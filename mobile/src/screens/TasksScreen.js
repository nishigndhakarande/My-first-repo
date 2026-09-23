import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { TaskFormModal } from '../components/TaskFormModal';
import { StatusBadge } from '../components/StatusBadge';
import { Ionicons } from '@expo/vector-icons';

const STATUS_TABS = ['To Do', 'In Progress', 'Review', 'Done'];
const MODES = ['My Tasks', 'Project Tasks'];

export const TasksScreen = () => {
  const { activeProject, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('To Do');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeMode, setActiveMode] = useState('My Tasks');

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.getProjectTasks(activeProject?.id);
      setTasks(data);
    } catch (err) {
      console.warn('Error loading tasks:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleToggleTask = async (task) => {
    const isCompleted = String(task.status || '').toLowerCase().includes('done') || String(task.status || '').toLowerCase().includes('complete');
    const newStatus = isCompleted ? 'in_progress' : 'completed';

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await api.updateTaskStatus(task.id, newStatus);
    } catch (err) {
      console.warn('Task update failed:', err.message);
      Alert.alert('Notice', 'Task status update could not be synced.');
      fetchTasks();
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Filter by Mode
      if (activeMode === 'My Tasks') {
        if (t.assigned_to && profile?.full_name) {
          if (!t.assigned_to.toLowerCase().includes(profile.full_name.toLowerCase())) return false;
        } else {
          return false;
        }
      }

      // 2. Filter by Status Tab
      const s = String(t.status || '').toLowerCase();
      if (activeTab === 'Done') return s.includes('done') || s.includes('complete');
      if (activeTab === 'Review') return s.includes('review') || s.includes('verify');
      if (activeTab === 'In Progress') return s.includes('progress') || s.includes('active');
      if (activeTab === 'To Do') return !s.includes('done') && !s.includes('complete') && !s.includes('progress') && !s.includes('review');
      return true;
    });
  }, [tasks, activeTab, activeMode, profile]);

  const renderItem = ({ item }) => {
    const isCompleted = String(item.status || '').toLowerCase().includes('done') || String(item.status || '').toLowerCase().includes('complete');

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => { setEditingTask(item); setModalVisible(true); }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.taskTitle, isCompleted && styles.titleCrossed]} numberOfLines={2}>
            {item.title || item.name || item.task || 'Task #' + item.id}
          </Text>
          <TouchableOpacity onPress={() => handleToggleTask(item)}>
            <Ionicons name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={isCompleted ? colors.brandGreen : colors.muted} />
          </TouchableOpacity>
        </View>

        {item.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <View style={[styles.priorityBadge, {backgroundColor: item.priority === 'High' ? colors.statusBadBg : colors.paper0}]}>
              <Text style={[styles.priorityText, {color: item.priority === 'High' ? colors.statusBad : colors.muted}]}>{item.priority || 'Normal'}</Text>
            </View>
            {item.due_date && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.muted} />
                <Text style={styles.metaText}>{item.due_date}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRight}>
            <StatusBadge status={item.status || 'To Do'} />
          </View>
        </View>
        <View style={styles.footerRow}>
           <Text style={styles.assigneeText}>
             <Ionicons name="person" size={12} color={colors.muted} /> {item.assigned_to_name || 'Unassigned'}
           </Text>
           {item.project_id && !activeProject && (
             <Text style={styles.projectContextText}>Proj: {item.project_id}</Text>
           )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Tasks Board"
        subtitle={activeProject ? activeProject.name : 'All Projects'}
      />

      <View style={styles.modeToggle}>
        {MODES.map(m => (
          <TouchableOpacity key={m} style={[styles.modeBtn, activeMode === m && styles.modeBtnActive]} onPress={() => setActiveMode(m)}>
            <Text style={[styles.modeBtnText, activeMode === m && styles.modeBtnTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabBar}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.brandOrange} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} colors={[colors.brandOrange]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkbox-outline" size={44} color={colors.muted3} />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySubtitle}>
                Try changing your filters or add a new task.
              </Text>
            </View>
          }
        />
      )}
      
      <TaskFormModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => fetchTasks()}
        onDelete={() => fetchTasks()}
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
  modeToggle: { flexDirection: 'row', backgroundColor: colors.paper1, padding: 4, margin: spacing.md, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: colors.line },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: borderRadius.pill },
  modeBtnActive: { backgroundColor: colors.navy900 },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: colors.ink600 },
  modeBtnTextActive: { color: '#FFFFFF' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.paper0, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: spacing.md },
  tabItem: { paddingVertical: spacing.sm, marginRight: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: colors.brandOrange },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.brandOrange },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxxl + 40, gap: spacing.md },
  card: { backgroundColor: colors.paper1, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  taskTitle: { fontSize: 14.5, fontWeight: '700', color: colors.ink900, flex: 1, marginRight: spacing.sm },
  titleCrossed: { textDecorationLine: 'line-through', color: colors.muted },
  taskDesc: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.xs },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.line },
  priorityText: { fontSize: 10, fontWeight: '700' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11.5, fontWeight: '600', color: colors.ink800 },
  metaRight: {},
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line2, marginTop: spacing.sm, paddingTop: spacing.sm },
  assigneeText: { fontSize: 11, color: colors.muted, fontWeight: '500' },
  projectContextText: { fontSize: 10, color: colors.brandOrange, fontWeight: '700', textTransform: 'uppercase' },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink800, marginTop: spacing.md },
  emptySubtitle: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandOrange, alignItems: 'center', justifyContent: 'center', shadowColor: colors.brandOrange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
