import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/supabase';

export const BudgetFormModal = ({ visible, onClose, onSave, onDelete, initialData, activeProjectId }) => {
  const [category, setCategory] = useState('');
  const [item, setItem] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiced, setInvoiced] = useState('');
  const [paid, setPaid] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || '');
      setItem(initialData.item || '');
      setVendor(initialData.vendor || '');
      setAmount(String(initialData.amount || '0'));
      setInvoiced(String(initialData.invoiced_amount || '0'));
      setPaid(String(initialData.paid_amount || '0'));
    } else {
      setCategory('');
      setItem('');
      setVendor('');
      setAmount('');
      setInvoiced('');
      setPaid('');
    }
  }, [initialData, visible]);

  const handleSave = async () => {
    if (!item.trim() || !amount.trim()) {
      Alert.alert('Validation Error', 'Item name and amount are required.');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        category: category.trim() || 'Uncategorized',
        item: item.trim(),
        vendor: vendor.trim() || null,
        amount: parseFloat(amount) || 0,
        invoiced_amount: parseFloat(invoiced) || 0,
        paid_amount: parseFloat(paid) || 0,
        project_id: initialData?.project_id || activeProjectId
      };
      
      if (initialData?.id) {
        payload.id = initialData.id;
      }
      
      await api.saveBudgetItem(payload);
      onSave();
      onClose();
    } catch (err) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Budget Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await api.deleteBudgetItem(initialData.id);
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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{initialData ? 'Edit Item' : 'New Item'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              <Text style={[styles.saveText, saving && {opacity: 0.5}]}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Civil Works" placeholderTextColor={colors.muted2} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput style={styles.input} value={item} onChangeText={setItem} placeholder="e.g. Concrete Foundation" placeholderTextColor={colors.muted2} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Vendor (Optional)</Text>
            <TextInput style={styles.input} value={vendor} onChangeText={setVendor} placeholder="e.g. ABC Corp" placeholderTextColor={colors.muted2} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Total Budgeted Amount (₹) *</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.muted2} />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, {flex: 1, marginRight: spacing.sm}]}>
              <Text style={styles.label}>Invoiced (₹)</Text>
              <TextInput style={styles.input} value={invoiced} onChangeText={setInvoiced} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.muted2} />
            </View>
            <View style={[styles.field, {flex: 1}]}>
              <Text style={styles.label}>Paid (₹)</Text>
              <TextInput style={styles.input} value={paid} onChangeText={setPaid} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.muted2} />
            </View>
          </View>

          {initialData && onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Ionicons name="trash-outline" size={18} color={colors.statusBad} />
              <Text style={styles.deleteText}>Delete Item</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.paper0, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  container: { flex: 1, backgroundColor: colors.paper0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.paper1, borderBottomWidth: 1, borderBottomColor: colors.line },
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
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.statusBadBg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.statusBad },
  deleteText: { fontSize: 14, fontWeight: '700', color: colors.statusBad, marginLeft: 8 },
});
