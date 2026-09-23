import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export const MediaUploadModal = ({ visible, onClose, onUpload, activeProjectId, defaultTab }) => {
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [fileCategory, setFileCategory] = useState(defaultTab || 'progress');
  const [discipline, setDiscipline] = useState('');
  const [siteDate, setSiteDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);

  // Sync defaultTab prop when opened
  React.useEffect(() => {
    if (visible) {
      setFileCategory(defaultTab || 'progress');
      setFileUri('');
      setFileName('');
      setMimeType('');
      setDiscipline('');
      setSiteDate(new Date().toISOString().split('T')[0]);
    }
  }, [visible, defaultTab]);

  const pickImage = async (useCamera) => {
    try {
      let result;
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Camera permission is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        const name = asset.fileName || ('photo_' + Date.now() + '.jpg');
        setFileName(name);
        setMimeType(asset.mimeType || 'image/jpeg');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open picker: ' + e.message);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name);
        setMimeType(asset.mimeType || 'application/octet-stream');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open document picker: ' + e.message);
    }
  };

  const handleUpload = async () => {
    if (!activeProjectId) {
      Alert.alert('No Project', 'Please select a project from the dashboard first.');
      return;
    }
    if (!fileUri) {
      Alert.alert('Validation', 'Please select a file to upload.');
      return;
    }
    
    setUploading(true);
    try {
      await api.uploadMedia(
        activeProjectId,
        fileUri,
        fileName,
        mimeType,
        fileCategory,
        discipline.trim() || 'General',
        siteDate
      );
      
      Alert.alert('Success', 'File uploaded successfully.');
      onUpload();
      onClose();
    } catch (err) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={uploading}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Upload Media</Text>
            <TouchableOpacity onPress={handleUpload} disabled={uploading || !fileUri} style={styles.saveBtn}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.brandOrange} />
              ) : (
                <Text style={[styles.saveText, !fileUri && {opacity: 0.5}]}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.field}>
              <Text style={styles.label}>Select File *</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(true)}>
                  <Ionicons name="camera" size={20} color={colors.ink800} />
                  <Text style={styles.pickerText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(false)}>
                  <Ionicons name="images" size={20} color={colors.ink800} />
                  <Text style={styles.pickerText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument}>
                  <Ionicons name="document-text" size={20} color={colors.ink800} />
                  <Text style={styles.pickerText}>File</Text>
                </TouchableOpacity>
              </View>
              {fileUri ? (
                <View style={styles.selectedFileWrap}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.brandGreen} />
                  <Text style={styles.selectedFileText} numberOfLines={1}>{fileName}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.statusChips}>
                {[
                  {id: 'progress', label: 'Site Photo'},
                  {id: 'drawing', label: 'Drawing'},
                  {id: 'document', label: 'Document'}
                ].map(opt => (
                  <TouchableOpacity key={opt.id} style={[styles.chip, fileCategory === opt.id && styles.chipActive]} onPress={() => setFileCategory(opt.id)}>
                    <Text style={[styles.chipText, fileCategory === opt.id && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, {flex: 1, marginRight: spacing.sm}]}>
                <Text style={styles.label}>Discipline</Text>
                <TextInput style={styles.input} value={discipline} onChangeText={setDiscipline} placeholder="e.g. Civil" placeholderTextColor={colors.muted2} />
              </View>
              <View style={[styles.field, {flex: 1}]}>
                <Text style={styles.label}>Site Date</Text>
                <TextInput style={styles.input} value={siteDate} onChangeText={setSiteDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted2} />
              </View>
            </View>

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
  saveBtn: { padding: 4 },
  saveText: { fontSize: 15, fontWeight: '700', color: colors.brandOrange },
  formContent: { padding: spacing.md, paddingBottom: spacing.xxxl },
  field: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 14, color: colors.ink900 },
  row: { flexDirection: 'row' },
  pickerBtn: { flex: 1, backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pickerText: { fontSize: 11, fontWeight: '600', color: colors.ink800 },
  selectedFileWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.paper1, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.brandGreen },
  selectedFileText: { fontSize: 12, color: colors.ink900, flex: 1 },
  statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.ink700 },
  chipTextActive: { color: '#FFF' },
});
