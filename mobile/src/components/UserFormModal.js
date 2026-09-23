import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase, api } from '../services/supabase';

const ROLES = [
  { id: 'client', label: 'Client' },
  { id: 'director', label: 'Director' },
  { id: 'pm', label: 'Project Manager' },
  { id: 'site_engineer', label: 'Site Engineer' },
  { id: 'team', label: 'Team Member' },
  { id: 'vendor', label: 'Vendor' },
];

export const UserFormModal = ({ visible, onClose, onSave, initialData, companyId }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('team');
  const [mobile, setMobile] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.full_name || '');
      setEmail(initialData.email || ''); // Usually readonly on edit
      setRole(initialData.role || 'team');
      setMobile(initialData.mobile || '');
      setEmployeeId(initialData.employee_id || '');
      setDepartment(initialData.department || '');
      setDesignation(initialData.designation || '');
      setIsActive(initialData.is_active ?? true);
    } else {
      setFullName('');
      setEmail('');
      setRole('team');
      setMobile('');
      setEmployeeId('');
      setDepartment('');
      setDesignation('');
      setIsActive(true);
    }
  }, [initialData, visible]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    if (!initialData && !email.trim()) {
      Alert.alert('Validation', 'Email is required for new users');
      return;
    }
    
    setSaving(true);
    try {
      if (initialData) {
        // Update profile
        const payload = {
          full_name: fullName.trim(),
          role: role,
          mobile: mobile.trim() || null,
          employee_id: employeeId.trim() || null,
          department: department.trim() || null,
          designation: designation.trim() || null,
          is_active: isActive
        };
        const { error } = await supabase.from('profiles').update(payload).eq('id', initialData.id);
        if (error) throw error;
      } else {
        // Invite new user
        const payload = {
          email: email.trim(),
          full_name: fullName.trim(),
          role: role,
          company_id: companyId,
          mobile: mobile.trim() || null,
          employee_id: employeeId.trim() || null,
          department: department.trim() || null,
          designation: designation.trim() || null,
          is_active: isActive,
          send_credentials: true,
          force_password_change: true
        };
        await api.inviteUser(payload);
      }
      
      onSave();
      onClose();
    } catch (err) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={saving}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{initialData ? 'Edit User' : 'Invite User'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator size="small" color={colors.brandOrange} /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. Rahul Sharma" placeholderTextColor={colors.muted2} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address {initialData ? '(Readonly)' : '*'}</Text>
              <TextInput 
                style={[styles.input, initialData && {backgroundColor: colors.paper0, color: colors.muted}]} 
                value={email} 
                onChangeText={setEmail} 
                editable={!initialData} 
                placeholder="e.g. rahul@company.com" 
                placeholderTextColor={colors.muted2}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>System Role</Text>
              <View style={styles.roleGrid}>
                {ROLES.map(r => (
                  <TouchableOpacity 
                    key={r.id} 
                    style={[styles.roleBtn, role === r.id && styles.roleBtnActive]} 
                    onPress={() => setRole(r.id)}
                  >
                    <Text style={[styles.roleText, role === r.id && styles.roleTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.field, {flex: 1, marginRight: spacing.sm}]}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="e.g. 9876543210" placeholderTextColor={colors.muted2} keyboardType="phone-pad" />
              </View>
              <View style={[styles.field, {flex: 1}]}>
                <Text style={styles.label}>Employee ID</Text>
                <TextInput style={styles.input} value={employeeId} onChangeText={setEmployeeId} placeholder="e.g. EMP-101" placeholderTextColor={colors.muted2} />
              </View>
            </View>

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
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line },
  roleBtnActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  roleText: { fontSize: 12, fontWeight: '600', color: colors.ink700 },
  roleTextActive: { color: '#FFF' },
});
