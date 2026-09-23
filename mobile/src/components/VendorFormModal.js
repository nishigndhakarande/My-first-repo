import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/supabase';

export const VendorFormModal = ({ visible, onClose, onSave, onDelete, initialData }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [slaStatus, setSlaStatus] = useState('clear');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || '');
      setContactPerson(initialData.contact_person || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setSlaStatus(initialData.sla_status || 'clear');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setCategory('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setSlaStatus('clear');
      setNotes('');
    }
  }, [initialData, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Vendor name is required.');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || null,
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        sla_status: slaStatus,
        notes: notes.trim() || null,
      };
      
      if (initialData?.id) {
        payload.id = initialData.id;
      }
      
      await api.saveVendor(payload);
      onSave();
      onClose();
    } catch (err) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Vendor', 'Are you sure you want to delete this vendor?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await api.deleteVendor(initialData.id);
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
            <Text style={styles.title}>{initialData ? 'Edit Vendor' : 'Add Vendor'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator size="small" color={colors.brandOrange} /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.label}>Vendor Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Greenline Turf" placeholderTextColor={colors.muted2} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category / Service</Text>
              <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Turf, Civil, Material" placeholderTextColor={colors.muted2} />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.label}>Contact Person</Text>
              <TextInput style={styles.input} value={contactPerson} onChangeText={setContactPerson} placeholder="e.g. Rajesh Kumar" placeholderTextColor={colors.muted2} />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, {flex: 1, marginRight: spacing.sm}]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="e.g. 9876543210" placeholderTextColor={colors.muted2} />
              </View>
              <View style={[styles.field, {flex: 1}]}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="example@email.com" placeholderTextColor={colors.muted2} autoCapitalize="none" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Notes</Text>
              <TextInput style={[styles.input, {minHeight: 80, textAlignVertical: 'top'}]} value={notes} onChangeText={setNotes} placeholder="Additional details..." placeholderTextColor={colors.muted2} multiline />
            </View>

            {initialData && onDelete && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
                <Ionicons name="trash-outline" size={18} color={colors.statusBad} />
                <Text style={styles.deleteText}>Delete Vendor</Text>
              </TouchableOpacity>
            )}
            
            <View style={{height: 40}} />
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
  formContent: { padding: spacing.md },
  field: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 14, color: colors.ink900 },
  row: { flexDirection: 'row' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.statusBadBg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.statusBad },
  deleteText: { fontSize: 14, fontWeight: '700', color: colors.statusBad, marginLeft: 8 },
});
