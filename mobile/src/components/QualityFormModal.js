import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase, api } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker';

const STATUS_OPTIONS = [
  { label: 'Pass', value: 'pass', color: colors.brandGreen },
  { label: 'Fail', value: 'fail', color: colors.statusBad },
  { label: 'Warning', value: 'warning', color: colors.brandOrange },
];

export const QualityFormModal = ({ visible, onClose, onSave, onDelete, initialData, activeProjectId }) => {
  const [particular, setParticular] = useState('');
  const [unit, setUnit] = useState('');
  const [status, setStatus] = useState('pass');
  const [remarks, setRemarks] = useState('');
  const [evidenceUri, setEvidenceUri] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (initialData) {
      setParticular(initialData.particular || '');
      setUnit(initialData.unit || '');
      setStatus(initialData.status || 'pass');
      setRemarks(initialData.remarks || '');
      setEvidenceUri(initialData.evidence_url || '');
    } else {
      setParticular('');
      setUnit('');
      setStatus('pass');
      setRemarks('');
      setEvidenceUri('');
    }
  }, [initialData, visible]);

  const handlePickImage = async (useCamera) => {
    try {
      let result;
      if (useCamera) {
        const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
        if (perm !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEvidenceUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Image Error', 'Failed to pick image.');
    }
  };

  const handleSave = async () => {
    if (!particular.trim()) {
      Alert.alert('Validation Error', 'Particular field is required.');
      return;
    }
    
    setSaving(true);
    try {
      let finalEvidenceUrl = evidenceUri;

      // If it's a local URI (starts with file://), upload it first
      if (evidenceUri && evidenceUri.startsWith('file://')) {
        setUploadingImage(true);
        const response = await fetch(evidenceUri);
        const blob = await response.blob();
        const ext = evidenceUri.split('.').pop() || 'jpg';
        const fileName = `quality_${Date.now()}.${ext}`;
        const path = `projects/${activeProjectId}/quality/${fileName}`;
        
        const { error: upErr } = await supabase.storage.from('project-media').upload(path, blob, {
          contentType: `image/${ext}`
        });
        
        if (upErr) throw upErr;
        
        const { data: pubData } = supabase.storage.from('project-media').getPublicUrl(path);
        finalEvidenceUrl = pubData.publicUrl;
        setUploadingImage(false);
      }

      const payload = {
        particular: particular.trim(),
        unit: unit.trim() || null,
        status: status,
        remarks: remarks.trim() || null,
        evidence_url: finalEvidenceUrl || null,
        project_id: initialData?.project_id || activeProjectId,
      };
      
      if (initialData?.id) {
        payload.id = initialData.id;
      }
      
      await api.saveQualityCheck(payload);
      onSave();
      onClose();
    } catch (err) {
      Alert.alert('Save Failed', err.message);
      setUploadingImage(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this check?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await api.deleteQualityCheck(initialData.id);
          onDelete();
          onClose();
        } catch(err) {
          Alert.alert('Delete Failed', err.message);
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={saving}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{initialData ? 'Edit Quality Check' : 'New Check'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator size="small" color={colors.brandOrange} /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            
            <View style={styles.field}>
              <Text style={styles.label}>Particular / Check Name *</Text>
              <TextInput style={styles.input} value={particular} onChangeText={setParticular} placeholder="e.g. Concrete Compressive Strength" placeholderTextColor={colors.muted2} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location / Unit</Text>
              <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="e.g. Column C4, 2nd Floor" placeholderTextColor={colors.muted2} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map(opt => (
                  <TouchableOpacity 
                    key={opt.value} 
                    style={[styles.statusBtn, status === opt.value && { backgroundColor: opt.color + '20', borderColor: opt.color }]} 
                    onPress={() => setStatus(opt.value)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                    <Text style={[styles.statusText, status === opt.value && { color: opt.color }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Remarks / NCR Details</Text>
              <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} value={remarks} onChangeText={setRemarks} placeholder="Enter any issues or notes here..." placeholderTextColor={colors.muted2} multiline />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Evidence (Photo)</Text>
              {evidenceUri ? (
                <View style={styles.evidenceContainer}>
                  <Image source={{ uri: evidenceUri }} style={styles.evidenceImage} />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setEvidenceUri('')}>
                    <Ionicons name="close-circle" size={24} color={colors.statusBad} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(true)}>
                    <Ionicons name="camera" size={20} color={colors.brandBlue} />
                    <Text style={styles.photoBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => handlePickImage(false)}>
                    <Ionicons name="image" size={20} color={colors.brandBlue} />
                    <Text style={styles.photoBtnText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
              {uploadingImage && <Text style={styles.uploadingText}>Uploading photo...</Text>}
            </View>

            {initialData && onDelete && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
                <Ionicons name="trash-outline" size={18} color={colors.statusBad} />
                <Text style={styles.deleteText}>Delete Check</Text>
              </TouchableOpacity>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.paper0, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '95%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.paper1, borderBottomWidth: 1, borderBottomColor: colors.line, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 15, color: colors.brandBlue },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink900 },
  saveBtn: { padding: 4, minWidth: 44, alignItems: 'flex-end' },
  saveText: { fontSize: 15, fontWeight: '700', color: colors.brandOrange },
  formContent: { padding: spacing.md },
  field: { marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 14, color: colors.ink900 },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: colors.line, borderRadius: borderRadius.md, backgroundColor: colors.paper1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  photoActions: { flexDirection: 'row', gap: spacing.sm },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: colors.line, borderRadius: borderRadius.md, backgroundColor: colors.paper1, borderStyle: 'dashed' },
  photoBtnText: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: colors.brandBlue },
  evidenceContainer: { position: 'relative', width: '100%', height: 200, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  evidenceImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removePhotoBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 12 },
  uploadingText: { fontSize: 12, color: colors.brandOrange, marginTop: 8, fontStyle: 'italic' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.statusBadBg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.statusBad },
  deleteText: { fontSize: 14, fontWeight: '700', color: colors.statusBad, marginLeft: 8 },
});
