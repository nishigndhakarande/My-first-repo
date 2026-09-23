import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api, supabase } from '../services/supabase';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

const TABS = ['Pending', 'Resolved'];

export const ApprovalsScreen = () => {
  const { activeProject, profile } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending');

  const canApprove = profile?.role === 'director' || profile?.role === 'pm';

  const fetchApprovals = useCallback(async () => {
    try {
      const data = await api.getApprovals(activeProject?.id);
      setApprovals(data);
    } catch (err) {
      console.warn('Error fetching approvals:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApprovals();
  };

  const handleAction = async (item, action) => {
    if (!canApprove) {
      Alert.alert('Permission Denied', 'You do not have permission to approve or reject items.');
      return;
    }
    Alert.alert(
      'Confirm ' + action,
      'Are you sure you want to ' + action.toLowerCase() + ' this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: action === 'Reject' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              let table = '';
              let patch = {};
              
              const statusVal = action === 'Approve' ? 'approved' : 'rejected';

              if (item._type === 'schedule_change') {
                table = 'schedule_change_requests';
                patch = { approval_status: statusVal };
              } else if (item._type === 'payment_adjustment') {
                table = 'payment_adjustments';
                patch = { approval_status: statusVal };
              } else if (item._type === 'change_order') {
                table = 'change_orders';
                patch = { status: statusVal };
              }

              if (table) {
                const { error } = await supabase.from(table).update(patch).eq('id', item.id);
                if (error) throw error;
                fetchApprovals();
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          } 
        }
      ]
    );
  };

  const filteredItems = useMemo(() => {
    return approvals.filter(item => {
      const status = String(item._status || '').toLowerCase();
      const isPending = status === 'pending';
      return activeTab === 'Pending' ? isPending : !isPending;
    });
  }, [approvals, activeTab]);

  const renderItem = ({ item }) => {
    const isPending = item._status === 'pending';
    let iconName = 'document-text';
    let iconColor = colors.brandBlue;
    
    if (item._type === 'schedule_change') {
      iconName = 'calendar';
      iconColor = colors.brandOrange;
    }
    if (item._type === 'payment_adjustment') {
      iconName = 'wallet';
      iconColor = colors.brandGreen;
    }
    if (item._type === 'change_order') {
      iconName = 'swap-horizontal';
      iconColor = colors.navy900;
    }

    return (
      <View style={styles.inboxItem}>
        <View style={[styles.avatar, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        
        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item._title}</Text>
            <Text style={styles.dateText}>{new Date(item._created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
          </View>
          
          <Text style={styles.itemSubtitle}>
            {item._type.replace('_', ' ').toUpperCase()}
          </Text>

          <View style={styles.detailBox}>
            {item._type === 'payment_adjustment' && (
              <Text style={styles.detailText}>Amount: {'₹' + (item.requested_amount?.toLocaleString('en-IN') || '0')}</Text>
            )}
            {item._type === 'schedule_change' && (
              <>
                <Text style={styles.detailText} numberOfLines={1}><Text style={styles.detailLabel}>New Dates:</Text> {item.proposed_start} to {item.proposed_end}</Text>
                {item.reason && <Text style={styles.detailText} numberOfLines={2}><Text style={styles.detailLabel}>Reason:</Text> {item.reason}</Text>}
              </>
            )}
          </View>
        </View>

        {isPending && canApprove ? (
          <View style={styles.actionCol}>
             <TouchableOpacity style={[styles.quickBtn, styles.approveBtn]} onPress={() => handleAction(item, 'Approve')}>
                <Ionicons name="checkmark" size={20} color="#FFF" />
             </TouchableOpacity>
             <TouchableOpacity style={[styles.quickBtn, styles.rejectBtn]} onPress={() => handleAction(item, 'Reject')}>
                <Ionicons name="close" size={20} color={colors.statusBad} />
             </TouchableOpacity>
          </View>
        ) : (
          !isPending && (
            <View style={styles.statusCol}>
              <View style={[styles.statusBadge, { backgroundColor: item._status === 'approved' ? colors.brandGreen + '15' : colors.statusBadBg }]}>
                <Text style={[styles.statusText, { color: item._status === 'approved' ? colors.brandGreen : colors.statusBad }]}>
                  {item._status.toUpperCase()}
                </Text>
              </View>
            </View>
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Approvals" subtitle={activeProject ? activeProject.name : 'All Projects'} />

      <View style={styles.tabContainer}>
        <View style={styles.segmentedControl}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{tab}</Text>
                {tab === 'Pending' && approvals.filter(a => a._status === 'pending').length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{approvals.filter(a => a._status === 'pending').length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={colors.brandOrange} /></View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id) + String(item._type)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={54} color={colors.brandGreen} />
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySubtitle}>No {activeTab.toLowerCase()} requests right now.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  tabContainer: { padding: spacing.md, backgroundColor: colors.paper1, borderBottomWidth: 1, borderBottomColor: colors.line },
  segmentedControl: { flexDirection: 'row', backgroundColor: colors.paper0, borderRadius: borderRadius.pill, padding: 4, borderWidth: 1, borderColor: colors.line2 },
  segmentBtn: { flex: 1, flexDirection: 'row', paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.pill },
  segmentBtnActive: { backgroundColor: colors.brandBlue, elevation: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: {width: 0, height: 1} },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: '#FFF' },
  badge: { backgroundColor: colors.statusBad, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 6, paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  
  listContent: { paddingBottom: spacing.xxxl },
  separator: { height: 1, backgroundColor: colors.line, marginLeft: 60 },
  
  inboxItem: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.paper0, alignItems: 'flex-start' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  
  contentCol: { flex: 1, marginRight: spacing.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  itemTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink900, paddingRight: 8 },
  dateText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  itemSubtitle: { fontSize: 11, fontWeight: '700', color: colors.brandBlue, marginBottom: 6 },
  
  detailBox: { marginTop: 4 },
  detailText: { fontSize: 13, color: colors.ink700, lineHeight: 18 },
  detailLabel: { fontWeight: '600', color: colors.ink900 },
  
  actionCol: { flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center' },
  quickBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: colors.brandGreen, elevation: 2, shadowColor: colors.brandGreen, shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: {width: 0, height: 2} },
  rejectBtn: { backgroundColor: colors.paper0, borderWidth: 1, borderColor: colors.statusBad },
  
  statusCol: { alignItems: 'flex-end', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusText: { fontSize: 10, fontWeight: '800' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink900, marginTop: spacing.md },
  emptySubtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
