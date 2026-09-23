import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/supabase';

export const ProjectFormModal = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [budgetApproved, setBudgetApproved] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [budgetStatus, setBudgetStatus] = useState('on-budget');
  const [scheduleStatus, setScheduleStatus] = useState('on-track');
  const [progressPct, setProgressPct] = useState('');
  const [nextMilestone, setNextMilestone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sportType, setSportType] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const resetForm = () => {
    setName('');
    setLocation('');
    setDescription('');
    setBudgetApproved('');
    setCostPrice('');
    setBudgetStatus('on-budget');
    setScheduleStatus('on-track');
    setProgressPct('');
    setNextMilestone('');
    setStartDate('');
    setEndDate('');
    setSportType('');
    setImageUrl('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Project name is required.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        name: name.trim(),
        location: location.trim() || null,
        description: description.trim() || null,
        budget_approved: parseFloat(budgetApproved) || 0,
        cost_price: parseFloat(costPrice) || 0,
        budget_status: budgetStatus,
        schedule_status: scheduleStatus,
        quality_status: 'clear',
        ncr_count: 0,
        progress_pct: parseInt(progressPct, 10) || 0,
        next_milestone: nextMilestone.trim() || null,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
        image_url: imageUrl.trim() || null,
        sport_type: sportType.trim() || null,
      };

      await api.createProject(payload);
      onSuccess();
      handleClose();
    } catch (err) {
      console.warn('Create project error:', err);
      setErrorMsg(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (label, value, setValue, options) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pickerBtn, value === opt.value && styles.pickerBtnActive]}
            onPress={() => setValue(opt.value)}
          >
            <Text style={[styles.pickerBtnText, value === opt.value && styles.pickerBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Project</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.ink900} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Project Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. XYZ School Turf" placeholderTextColor={colors.muted3} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="e.g. Baner, Pune" placeholderTextColor={colors.muted3} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Short description..." placeholderTextColor={colors.muted3} multiline numberOfLines={3} textAlignVertical="top" />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.label}>Selling Price (₹ Cr)</Text>
                <TextInput style={styles.input} value={budgetApproved} onChangeText={setBudgetApproved} placeholder="1.50" keyboardType="numeric" placeholderTextColor={colors.muted3} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Cost Price (₹ Cr)</Text>
                <TextInput style={styles.input} value={costPrice} onChangeText={setCostPrice} placeholder="1.10" keyboardType="numeric" placeholderTextColor={colors.muted3} />
              </View>
            </View>

            {renderPicker('Budget Status', budgetStatus, setBudgetStatus, [
              { label: 'On Budget', value: 'on-budget' },
              { label: 'Watch', value: 'watch' },
              { label: 'Over', value: 'over-budget' },
            ])}

            {renderPicker('Schedule Status', scheduleStatus, setScheduleStatus, [
              { label: 'On Track', value: 'on-track' },
              { label: 'At Risk', value: 'at risk' },
              { label: 'Delayed', value: 'delayed' },
            ])}

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.label}>Progress (%)</Text>
                <TextInput style={styles.input} value={progressPct} onChangeText={setProgressPct} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.muted3} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Next Milestone</Text>
                <TextInput style={styles.input} value={nextMilestone} onChangeText={setNextMilestone} placeholder="e.g. Turf Install" placeholderTextColor={colors.muted3} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted3} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>End Date</Text>
                <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted3} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Sport Type</Text>
              <TextInput style={styles.input} value={sportType} onChangeText={setSportType} placeholder="e.g. Futsal, Tennis" placeholderTextColor={colors.muted3} />
            </View>
            
            <View style={{ height: spacing.xl }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Create Project</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.paper0, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink900 },
  closeBtn: { padding: 4 },
  scrollArea: { padding: spacing.md },
  field: { marginBottom: spacing.md },
  row: { flexDirection: 'row' },
  label: { fontSize: 12, fontWeight: '600', color: colors.ink600, marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 14, color: colors.ink900 },
  textArea: { minHeight: 80 },
  pickerRow: { flexDirection: 'row', gap: 8 },
  pickerBtn: { flex: 1, paddingVertical: 8, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  pickerBtnActive: { backgroundColor: colors.brandBlue + '15', borderColor: colors.brandBlue },
  pickerBtnText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  pickerBtnTextActive: { color: colors.brandBlue },
  footer: { flexDirection: 'row', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper0 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: borderRadius.md, marginRight: spacing.sm, backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.ink700 },
  saveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: colors.brandOrange },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  errorBox: { backgroundColor: colors.statusBad + '15', padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.md },
  errorText: { color: colors.statusBad, fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
