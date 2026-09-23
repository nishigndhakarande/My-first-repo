import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { Ionicons } from '@expo/vector-icons';

export const DashboardScreen = ({ navigation }) => {
  const { profile, activeProject, setActiveProject } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [ncrs, setNcrs] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProjectModalVisible, setProjectModalVisible] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const projs = await api.getProjects();
      setProjects(projs);

      if (!activeProject && projs.length > 0) {
        // Auto-select first project so data is always contextualized like web
        setActiveProject(projs[0]);
        return; // Will re-run fetchDashboardData because activeProject changed
      }

      const projId = activeProject?.id || null;
      const [tData, sData, qData, bData] = await Promise.all([
        api.getProjectTasks(projId),
        api.getScheduleTasks(projId),
        api.getQualityIssues(projId),
        api.getBudgetItems(projId),
      ]);

      setTasks(tData);
      setSchedules(sData);
      setNcrs(qData);
      setBudgetItems(bData);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusChart = () => {
    if (!projects.length) return null;
    const total = projects.length;
    const active = projects.filter(p => p.status === 'in_progress').length;
    const delayed = projects.filter(p => p.is_delayed).length;
    const planning = projects.filter(p => p.status === 'planning').length;
    
    return {
      active: (active / total) * 100,
      delayed: (delayed / total) * 100,
      planning: (planning / total) * 100,
      activeCount: active,
      delayedCount: delayed,
      planningCount: planning
    };
  };

  const chart = getStatusChart();

  return (
    <View style={styles.container}>
      <Header
        title={activeProject ? activeProject.name : 'Master Dashboard'}
        subtitle={profile?.full_name ? `Welcome back, ${profile.full_name}` : 'Welcome back'}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />
        }
      >
        <Text style={styles.sectionTitle}>Context</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.projectPillsContainer}>
          <TouchableOpacity
            style={[styles.projectPill, !activeProject && styles.projectPillActive]}
            onPress={() => setActiveProject(null)}
          >
            <Text style={[styles.projectPillText, !activeProject && styles.projectPillTextActive]}>
              All Projects
            </Text>
          </TouchableOpacity>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.projectPill, activeProject?.id === p.id && styles.projectPillActive]}
              onPress={() => setActiveProject(p)}
            >
              <Text style={[styles.projectPillText, activeProject?.id === p.id && styles.projectPillTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.brandOrange} />
          </View>
        ) : (
          <>
            <View style={styles.quickActionRow}>
              <TouchableOpacity style={styles.qaItem} onPress={() => navigation.navigate('Chat')}>
                <View style={[styles.qaIcon, { backgroundColor: '#EAF1FE' }]}>
                  <Ionicons name="chatbubbles" size={20} color={colors.brandBlue} />
                </View>
                <Text style={styles.qaText}>Collab & AI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaItem} activeOpacity={0.7} onPress={() => setProjectModalVisible(true)}>
                <View style={[styles.qaIcon, {backgroundColor: `${colors.brandOrange}15`}]}>
                  <Ionicons name="add" size={22} color={colors.brandOrange} />
                </View>
                <Text style={styles.qaText}>New Project</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaItem} activeOpacity={0.7} onPress={() => Alert.alert('Notice', 'Import tools are coming in the next update.')}>
                <View style={[styles.qaIcon, {backgroundColor: `${colors.brandBlue}15`}]}>
                  <Ionicons name="cloud-upload" size={20} color={colors.brandBlue} />
                </View>
                <Text style={styles.qaText}>Import</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, {backgroundColor: '#FEF3E2'}]}>
                  <Ionicons name="briefcase" size={16} color={colors.brandOrange} />
                </View>
                <Text style={styles.kpiValue}>{activeProject ? tasks.length : projects.length}</Text>
                <Text style={styles.kpiLabel}>{activeProject ? 'Total Tasks' : 'Total Projects'}</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, {backgroundColor: '#FEE2E2'}]}>
                  <Ionicons name="alert-circle" size={16} color={colors.statusBad} />
                </View>
                <Text style={styles.kpiValue}>{ncrs.length}</Text>
                <Text style={styles.kpiLabel}>Open NCRs</Text>
              </View>
            </View>

            {!activeProject && chart && (
              <View style={styles.cardSection}>
                <Text style={styles.cardTitle}>Portfolio Status Overview</Text>
                <View style={styles.barChartContainer}>
                  <View style={[styles.barSegment, { flex: chart.active || 1, backgroundColor: colors.brandGreen }]} />
                  <View style={[styles.barSegment, { flex: chart.delayed || 1, backgroundColor: colors.statusBad }]} />
                  <View style={[styles.barSegment, { flex: chart.planning || 1, backgroundColor: colors.brandBlue }]} />
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: colors.brandGreen}]} /><Text style={styles.legendText}>{chart.activeCount} Active</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: colors.statusBad}]} /><Text style={styles.legendText}>{chart.delayedCount} Delayed</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: colors.brandBlue}]} /><Text style={styles.legendText}>{chart.planningCount} Planning</Text></View>
                </View>
              </View>
            )}

            <View style={styles.cardSection}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Upcoming Milestones</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              {schedules.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming milestones.</Text>
              ) : (
                schedules.filter(s => s.milestone).slice(0, 3).map((s, idx) => (
                  <View key={s.id || idx} style={styles.listItemRow}>
                    <Ionicons name="flag" size={16} color={colors.brandOrange} style={styles.listIcon} />
                    <View style={styles.listMeta}>
                      <Text style={styles.listTitle} numberOfLines={1}>{s.task || s.milestone}</Text>
                      <Text style={styles.listSubtitle}>{s.due_date || s.planned_end || 'TBD'}</Text>
                    </View>
                    <StatusBadge status={s.status} />
                  </View>
                ))
              )}
            </View>

            <View style={styles.cardSection}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Today's Tasks</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              {tasks.length === 0 ? (
                <Text style={styles.emptyText}>No tasks assigned for today.</Text>
              ) : (
                tasks.slice(0, 4).map((t, idx) => (
                  <View key={t.id || idx} style={styles.listItemRow}>
                    <Ionicons name="radio-button-off" size={16} color={colors.muted} style={styles.listIcon} />
                    <View style={styles.listMeta}>
                      <Text style={styles.listTitle} numberOfLines={1}>{t.task || t.title}</Text>
                      <Text style={styles.listSubtitle}>Due: {t.due_date || 'N/A'}</Text>
                    </View>
                    <StatusBadge status={t.status} />
                  </View>
                ))
              )}
            </View>

            <View style={styles.cardSection}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Budget Overview</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              {budgetItems.length === 0 ? (
                <Text style={styles.emptyText}>No budget items found.</Text>
              ) : (
                budgetItems.slice(0, 3).map((b, idx) => (
                  <View key={b.id || idx} style={styles.listItemRow}>
                    <Ionicons name="wallet" size={16} color={colors.brandBlue} style={styles.listIcon} />
                    <View style={styles.listMeta}>
                      <Text style={styles.listTitle} numberOfLines={1}>{b.item_name || 'Item'}</Text>
                      <Text style={styles.listSubtitle}>{b.category || 'General'}</Text>
                    </View>
                    <Text style={styles.budgetAmount}>{'₹' + b.amount?.toLocaleString()}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <ProjectFormModal
        visible={isProjectModalVisible}
        onClose={() => setProjectModalVisible(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: spacing.sm },
  projectPillsContainer: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.md },
  projectPill: { backgroundColor: colors.paper1, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: colors.line },
  projectPillActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  projectPillText: { fontSize: 13, fontWeight: '600', color: colors.ink700 },
  projectPillTextActive: { color: '#FFFFFF' },
  loaderWrap: { paddingVertical: 50, alignItems: 'center' },
  quickActionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  qaItem: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper1, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.line, gap: 8 },
  qaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qaText: { fontSize: 11, fontWeight: '700', color: colors.ink800 },
  kpiGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  kpiCard: { flex: 1, backgroundColor: colors.paper1, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.line },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  kpiValue: { fontSize: 24, fontWeight: '800', color: colors.ink900, marginBottom: 2 },
  kpiLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  cardSection: { backgroundColor: colors.paper1, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.line },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.ink900 },
  viewAllText: { fontSize: 12, fontWeight: '700', color: colors.brandOrange },
  barChartContainer: { height: 16, flexDirection: 'row', borderRadius: borderRadius.pill, overflow: 'hidden', marginVertical: spacing.md },
  barSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '600', color: colors.ink800 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line2 },
  listIcon: { marginRight: spacing.sm },
  listMeta: { flex: 1, marginRight: spacing.sm },
  listTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink800 },
  listSubtitle: { fontSize: 11.5, color: colors.muted, marginTop: 2 },
  emptyText: { fontSize: 13, color: colors.muted, fontStyle: 'italic', paddingVertical: spacing.sm },
  budgetAmount: { fontSize: 13, fontWeight: '700', color: colors.ink900 },
});

