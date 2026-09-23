import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['pending', 'in_progress', 'delayed', 'completed'];

export const TaskFormModal = ({ visible, onClose, onSave, onDelete, initialData, activeProjectId }) => {
  const { profile } = useAuth();
  const [task, setTask] = useState('');
  const [milestone, setMilestone] = useState('');
  const [status, setStatus] = useState('pending');
  const [reason, setReason] = useState('');
  const [progress, setProgress] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTask(initialData.task || initialData.title || initialData.name || '');
      setMilestone(initialData.milestone || '');
      setStatus(initialData.status || 'pending');
      setReason(initialData.remarks || '');
      setProgress(String(initialData.progress || '0'));
      setStartDate(initialData.baseline_start || '');
      setEndDate(initialData.planned_end || initialData.due_date || '');
      setAssignedTo(initialData.assigned_to || '');
    } else {
      setTask('');
      setMilestone('');
      setStatus('pending');
      setReason('');
      setProgress('0');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setAssignedTo('');
    }
  }, [initialData, visible]);

  const handleSave = async () => {
    if (!task.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }
    if ((status === 'in_progress' || status === 'delayed') && !reason.trim()) {
      Alert.alert('Validation Error', 'Reason/Remarks is mandatory when status is In Progress or Delayed.');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        task: task.trim(),
        milestone: milestone.trim() || 'General',
        status: status,
        remarks: reason.trim() || null,
        progress: parseInt(progress) || 0,
        baseline_start: startDate || null,
        planned_end: endDate || null,
        due_date: endDate || null, // map planned_end to due_date to match web's usage interchangeably
        assigned_to: assignedTo.trim() || null,
        project_id: initialData?.project_id || activeProjectId
      };
      
      let rescheduleRequested = false;
      if (initialData?.id) {
        payload.id = initialData.id;
        
        // Reschedule Workflow Check
        const isTeam = profile?.role !== 'director' && profile?.role !== 'pm';
        const initialStart = initialData.baseline_start || '';
        const initialEnd = initialData.planned_end || initialData.due_date || '';
        const startChanged = (startDate || '') !== initialStart;
        const endChanged = (endDate || '') !== initialEnd;
        
        if (isTeam && (startChanged || endChanged)) {
          // Revert dates in direct payload to avoid bypassing approval
          payload.baseline_start = initialStart || null;
          payload.planned_end = initialEnd || null;
          payload.due_date = initialEnd || null;
          
          await api.requestReschedule(
            initialData.id, 
            initialData.project_id || activeProjectId, 
            startDate || null, 
            endDate || null, 
            'Reschedule requested from mobile app'
          );
          rescheduleRequested = true;
        }
      }
      
      await api.saveScheduleTask(payload);
      
      if (rescheduleRequested) {
        Alert.alert('Request Sent', 'Your date changes were sent to the Project Manager for approval. Other task details were updated immediately.');
      }
      
      onSave(); // trigger refresh in parent
      onClose();
    } catch (err) {
      Alert.alert('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await api.deleteScheduleTask(initialData.id);
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{initialData ? 'Edit Task' : 'New Task'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            <Text style={[styles.saveText, saving && {opacity: 0.5}]}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <View style={styles.field}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput style={styles.input} value={task} onChangeText={setTask} placeholder="e.g. Excavation Phase 1" placeholderTextColor={colors.muted2} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Milestone</Text>
            <TextInput style={styles.input} value={milestone} onChangeText={setMilestone} placeholder="e.g. Substructure" placeholderTextColor={colors.muted2} />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, {flex: 1, marginRight: spacing.sm}]}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted2} />
            </View>
            <View style={[styles.field, {flex: 1}]}>
              <Text style={styles.label}>End Date</Text>
              <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted2} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusChips}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity key={opt} style={[styles.chip, status === opt && styles.chipActive]} onPress={() => setStatus(opt)}>
                  <Text style={[styles.chipText, status === opt && styles.chipTextActive]}>{opt.replace('_', ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(status === 'in_progress' || status === 'delayed') && (
            <View style={styles.field}>
              <Text style={styles.label}>Reason / Remarks *</Text>
              <TextInput 
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} 
                value={reason} 
                onChangeText={setReason} 
                placeholder="Required for In Progress or Delayed status..." 
                placeholderTextColor={colors.muted2}
                multiline
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Progress (%)</Text>
            <TextInput style={styles.input} value={progress} onChangeText={setProgress} keyboardType="number-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Assigned To</Text>
            <TextInput style={styles.input} value={assignedTo} onChangeText={setAssignedTo} placeholder="e.g. John Doe" placeholderTextColor={colors.muted2} />
          </View>

          {initialData && onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Ionicons name="trash-outline" size={18} color={colors.statusBad} />
              <Text style={styles.deleteText}>Delete Task</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.paper1, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.ink700 },
  chipTextActive: { color: '#FFF' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.statusBadBg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.statusBad },
  deleteText: { fontSize: 14, fontWeight: '700', color: colors.statusBad, marginLeft: 8 },
});
