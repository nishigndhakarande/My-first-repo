import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  UIManager
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { TaskFormModal } from '../components/TaskFormModal';
import { StatusBadge } from '../components/StatusBadge';
import { Ionicons } from '@expo/vector-icons';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Safe local date parsing
const parseDateStr = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
};

const formatDateObj = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `--`;
};

const getDatesInRange = (startDateStr, endDateStr) => {
  const dates = [];
  let curr = parseDateStr(startDateStr);
  const end = parseDateStr(endDateStr);
  if (isNaN(curr) || isNaN(end)) return [startDateStr || endDateStr];
  
  while (curr <= end) {
    dates.push(formatDateObj(new Date(curr)));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const getStatusColor = (status) => {
  const s = String(status).toLowerCase();
  if (s.includes('complete') || s.includes('done')) return colors.statusGood;
  if (s.includes('progress')) return colors.brandBlue;
  if (s.includes('delay')) return colors.statusBad;
  return colors.brandOrange;
};

export const ScheduleScreen = () => {
  const { activeProject } = useAuth();
  const [scheduleTasks, setScheduleTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [selectedDate, setSelectedDate] = useState(formatDateObj(new Date()));

  const fetchSchedule = useCallback(async () => {
    try {
      const data = await api.getScheduleTasks(activeProject?.id);
      setScheduleTasks(data || []);
    } catch (err) {
      console.warn('Error fetching schedule:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Generate marked dates for Calendar (multi-dot)
  const markedDates = useMemo(() => {
    const marks = {};
    
    scheduleTasks.forEach(task => {
      const start = task.baseline_start;
      const end = task.due_date || task.planned_end;
      
      let datesToMap = [];
      if (start && end && start <= end) {
        datesToMap = getDatesInRange(start, end);
      } else if (start) {
        datesToMap = [start];
      } else if (end) {
        datesToMap = [end];
      }

      const dotColor = getStatusColor(task.status);
      const dot = { key: task.id, color: dotColor };

      datesToMap.forEach(dStr => {
        if (!marks[dStr]) marks[dStr] = { dots: [] };
        // Avoid adding too many dots (max 4 per day for clean UI)
        if (marks[dStr].dots.length < 4) {
           marks[dStr].dots.push(dot);
        }
      });
    });

    // Mark the selected date
    if (selectedDate) {
      if (!marks[selectedDate]) marks[selectedDate] = {};
      marks[selectedDate] = { 
        ...marks[selectedDate], 
        selected: true, 
        selectedColor: colors.brandOrange 
      };
    }
    
    return marks;
  }, [scheduleTasks, selectedDate]);

  // Filter tasks for the selected date when in list view
  const tasksForSelectedDate = useMemo(() => {
    return scheduleTasks.filter(task => {
      const start = task.baseline_start;
      const end = task.due_date || task.planned_end;
      if (start && end && start <= end) {
        return selectedDate >= start && selectedDate <= end;
      }
      return start === selectedDate || end === selectedDate;
    });
  }, [scheduleTasks, selectedDate]);

  const renderTask = ({ item }) => (
    <TouchableOpacity 
      style={styles.taskCard} 
      activeOpacity={0.8}
      onPress={() => { setEditingTask(item); setModalVisible(true); }}
    >
      <View style={styles.taskHeaderRow}>
        <Text style={styles.taskTitle} numberOfLines={2}>{item.task || 'Unnamed Task'}</Text>
        <StatusBadge status={item.status || 'not_started'} />
      </View>
      {item.milestone && (
        <Text style={styles.milestoneText}>
          <Ionicons name="flag" size={12} color={colors.brandOrange} /> {item.milestone}
        </Text>
      )}
      <View style={styles.taskDatesRow}>
        <View style={styles.dateItem}>
          <Ionicons name="play-circle-outline" size={14} color={colors.muted} />
          <Text style={styles.dateLabel}>Start: </Text>
          <Text style={styles.dateValue}>{item.baseline_start || 'TBD'}</Text>
        </View>
        <View style={styles.dateItem}>
          <Ionicons name="stop-circle-outline" size={14} color={colors.muted} />
          <Text style={styles.dateLabel}>End: </Text>
          <Text style={styles.dateValue}>{item.due_date || item.planned_end || 'TBD'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Project Schedule"
        subtitle={activeProject ? activeProject.name : 'Master Timeline'}
      />

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.brandOrange} />
        </View>
      ) : (
        <View style={styles.content}>
          {viewMode === 'calendar' ? (
            <View style={styles.calendarWrap}>
              <Text style={styles.helperText}>Select a date to view its tasks</Text>
              <Calendar
                markingType={'multi-dot'}
                markedDates={markedDates}
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setViewMode('list');
                }}
                theme={{
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: colors.ink700,
                  selectedDayBackgroundColor: colors.brandOrange,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: colors.brandOrange,
                  dayTextColor: colors.ink900,
                  textDisabledColor: colors.muted3,
                  dotColor: colors.brandOrange,
                  arrowColor: colors.brandOrange,
                  monthTextColor: colors.ink900,
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                }}
              />
            </View>
          ) : (
            <View style={styles.listWrap}>
              <View style={styles.listHeader}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setViewMode('calendar')}>
                  <Ionicons name="arrow-back" size={20} color={colors.ink900} />
                  <Text style={styles.backBtnText}>Back to Calendar</Text>
                </TouchableOpacity>
                <Text style={styles.selectedDateText}>{selectedDate}</Text>
              </View>

              <FlatList
                data={tasksForSelectedDate}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderTask}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={44} color={colors.muted3} />
                    <Text style={styles.emptyTitle}>No tasks on this date</Text>
                    <Text style={styles.emptySubtitle}>You have a free schedule today.</Text>
                  </View>
                }
              />
            </View>
          )}
        </View>
      )}

      {/* ROOT LEVEL MODAL & FAB */}
      <TaskFormModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => fetchSchedule()}
        onDelete={() => fetchSchedule()}
        initialData={editingTask}
        activeProjectId={activeProject?.id}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => { setEditingTask(null); setModalVisible(true); }}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  content: { flex: 1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  calendarWrap: { padding: spacing.md },
  helperText: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: spacing.sm },

  listWrap: { flex: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.line },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: colors.ink900, marginLeft: 6 },
  selectedDateText: { fontSize: 14, fontWeight: '700', color: colors.brandOrange },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  
  taskCard: { backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, borderLeftWidth: 4, borderLeftColor: colors.brandBlue },
  taskHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  taskTitle: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  milestoneText: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm, fontWeight: '500' },
  taskDatesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dateItem: { flexDirection: 'row', alignItems: 'center' },
  dateLabel: { fontSize: 12, color: colors.muted, marginLeft: 4 },
  dateValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink800, marginTop: spacing.md },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4 },

  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandOrange, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }
});
