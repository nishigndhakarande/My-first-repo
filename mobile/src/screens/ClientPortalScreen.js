import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

export const ClientPortalScreen = ({ navigation }) => {
  const { activeProject, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [financials, setFinancials] = useState({ totalBudget: 0, totalPaid: 0 });

  const fetchData = useCallback(async () => {
    try {
      if (activeProject) {
        const [drawings, scheds, budget] = await Promise.all([
          api.getDrawings(activeProject.id),
          api.getScheduleTasks(activeProject.id),
          api.getBudgetItems ? api.getBudgetItems(activeProject.id) : Promise.resolve([])
        ]);
        
        // Photos
        const images = drawings.filter(d => 
          d.file_type === 'photo' || 
          d.file_type === 'progress' ||
          (d.file_url && d.file_url.match(/\.(jpeg|jpg|gif|png)$/) != null)
        );
        setPhotos(images);
        
        // Schedules
        setSchedules(scheds);

        // Financials (Sum up amounts)
        if (budget && budget.length > 0) {
          const totalBudget = budget.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0);
          const totalPaid = budget.reduce((sum, item) => sum + (Number(item.actual_cost) || 0), 0);
          setFinancials({ totalBudget, totalPaid });
        }
      } else {
        setPhotos([]);
        setSchedules([]);
        setFinancials({ totalBudget: 0, totalPaid: 0 });
      }
    } catch (err) {
      console.warn('Error fetching client data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const completedMilestones = schedules.filter(s => String(s.status || '').toLowerCase().includes('complete') || String(s.status || '').toLowerCase().includes('done')).length;
  const progressPercent = schedules.length > 0 ? Math.round((completedMilestones / schedules.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <Header title="Client Portal" subtitle={activeProject ? activeProject.name : 'Select a project'} />

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={colors.brandOrange} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Banner */}
          <View style={styles.welcomeBox}>
            <View style={styles.welcomeIconWrap}>
              <Ionicons name="home" size={28} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>Hello, {profile?.full_name || 'Client'}</Text>
              <Text style={styles.welcomeSubtitle}>
                Here is the latest overview of {activeProject ? activeProject.name : 'your project'}.
              </Text>
            </View>
          </View>

          {/* Core Metrics */}
          <View style={styles.metricsRow}>
             <View style={styles.metricCard}>
                <Ionicons name="analytics" size={24} color={colors.brandBlue} style={{marginBottom: 8}} />
                <Text style={styles.metricValue}>{progressPercent}%</Text>
                <Text style={styles.metricLabel}>Overall Progress</Text>
             </View>
             <View style={styles.metricCard}>
                <Ionicons name="checkmark-done-circle" size={24} color={colors.brandGreen} style={{marginBottom: 8}} />
                <Text style={styles.metricValue}>{completedMilestones} / {schedules.length}</Text>
                <Text style={styles.metricLabel}>Tasks Completed</Text>
             </View>
          </View>

          {/* Financial Overview (Only show if there is a budget set) */}
          {financials.totalBudget > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                 <Ionicons name="wallet-outline" size={18} color={colors.ink900} />
                 <Text style={styles.cardTitle}>Financial Overview</Text>
              </View>
              <View style={styles.financeRow}>
                <View style={styles.financeCol}>
                  <Text style={styles.financeLabel}>Total Estimated</Text>
                  <Text style={styles.financeAmount}>₹{financials.totalBudget.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.financeDivider} />
                <View style={styles.financeCol}>
                  <Text style={styles.financeLabel}>Total Paid</Text>
                  <Text style={[styles.financeAmount, { color: colors.brandGreen }]}>₹{financials.totalPaid.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              
              {/* Payment Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min((financials.totalPaid / financials.totalBudget) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round((financials.totalPaid / financials.totalBudget) * 100)}% Paid</Text>
              </View>
            </View>
          )}

          {/* Recent Photos */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
                 <Ionicons name="images-outline" size={18} color={colors.ink900} />
                 <Text style={styles.cardTitle}>Recent Site Photos</Text>
            </View>
            {photos.length === 0 ? (
              <View style={styles.emptyWrap}>
                 <Ionicons name="camera-outline" size={32} color={colors.line2} />
                 <Text style={styles.emptyText}>No recent photos uploaded by the team.</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {photos.slice(0, 4).map((p, idx) => (
                  <View key={p.id || idx} style={styles.photoWrap}>
                    <Image source={{ uri: p.file_url }} style={styles.photo} resizeMode="cover" />
                    <View style={styles.photoDateWrap}>
                       <Text style={styles.photoDateText}>{p.site_date || p.created_at?.split('T')[0]}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.contactBtn} 
            onPress={() => {
              if (navigation) {
                navigation.navigate('Chat');
              } else {
                Alert.alert('Messaging', 'Please go to the Chat tab below to talk with your Project Manager.');
              }
            }}
          >
            <Ionicons name="chatbubbles" size={20} color="#FFF" />
            <Text style={styles.contactBtnText}>Message Project Manager</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  
  welcomeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.navy900, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  welcomeIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  welcomeSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, lineHeight: 18 },
  
  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  metricCard: { flex: 1, backgroundColor: colors.paper1, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.line, alignItems: 'flex-start' },
  metricValue: { fontSize: 24, fontWeight: '800', color: colors.ink900, marginBottom: 4 },
  metricLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },

  card: { backgroundColor: colors.paper1, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.ink900 },
  
  financeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  financeCol: { flex: 1 },
  financeDivider: { width: 1, height: 40, backgroundColor: colors.line, marginHorizontal: spacing.md },
  financeLabel: { fontSize: 12, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', marginBottom: 4 },
  financeAmount: { fontSize: 18, fontWeight: '800', color: colors.ink900 },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  progressBarTrack: { flex: 1, height: 8, backgroundColor: colors.line2, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.brandGreen, borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '800', color: colors.brandGreen, minWidth: 40, textAlign: 'right' },
  
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoWrap: { width: '48%', aspectRatio: 1, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  photo: { width: '100%', height: '100%', backgroundColor: colors.paper0 },
  photoDateWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4, alignItems: 'center' },
  photoDateText: { fontSize: 10, color: '#FFF', fontWeight: '600' },
  
  emptyWrap: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: 8 },
  
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brandOrange, paddingVertical: 14, borderRadius: borderRadius.lg, elevation: 2, shadowColor: colors.brandOrange, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, marginTop: 8 },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
