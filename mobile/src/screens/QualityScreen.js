import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { QualityFormModal } from '../components/QualityFormModal';
import { Ionicons } from '@expo/vector-icons';

export const QualityScreen = () => {
  const { activeProject } = useAuth();
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingCheck, setEditingCheck] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'sheet'

  const fetchQualityChecks = useCallback(async () => {
    try {
      const data = await api.getQualityIssues(activeProject?.id);
      setChecks(data);
    } catch (err) {
      console.warn('Error loading quality checks:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchQualityChecks();
  }, [fetchQualityChecks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQualityChecks();
  };

  const filteredChecks = useMemo(() => {
    return checks.filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const text = ((c.particular || '') + ' ' + (c.remarks || '')).toLowerCase();
      return text.includes(q);
    });
  }, [checks, searchQuery]);

  const getStatusConfig = (status) => {
    const s = status || 'open';
    if (s === 'pass') return { color: colors.brandGreen, label: 'PASS' };
    if (s === 'fail') return { color: colors.statusBad, label: 'FAIL' };
    if (s === 'warning') return { color: colors.brandOrange, label: 'WARN' };
    if (s === 'ncr') return { color: colors.statusBad, label: 'NCR' };
    return { color: colors.muted, label: 'OPEN' };
  };

  const renderItem = ({ item }) => {
    const { color: statusColor, label: statusLabel } = getStatusConfig(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.particularText} numberOfLines={2}>{item.particular || 'Unnamed Check'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={styles.metaText} numberOfLines={1}>{item.unit || 'Location not specified'}</Text>
            </View>

            {item.remarks ? (
              <View style={styles.remarksBox}>
                <Text style={styles.remarksText} numberOfLines={3}>{item.remarks}</Text>
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingCheck(item); setModalVisible(true); }}>
                 <Ionicons name="create-outline" size={16} color={colors.brandBlue} />
                 <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {item.evidence_url && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.evidence_url }} style={styles.thumbnail} />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSheetView = () => {
    return (
      <View style={styles.sheetContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.sheetScrollH}>
          <View>
            {/* Sheet Header */}
            <View style={styles.sheetRowHeader}>
              <Text style={[styles.sheetCellHeader, { width: 160 }]}>Particular / Check</Text>
              <Text style={[styles.sheetCellHeader, { width: 120 }]}>Location</Text>
              <Text style={[styles.sheetCellHeader, { width: 80, textAlign: 'center' }]}>Status</Text>
              <Text style={[styles.sheetCellHeader, { width: 220 }]}>Remarks / NCR</Text>
              <Text style={[styles.sheetCellHeader, { width: 60, textAlign: 'center' }]}>Photo</Text>
              <Text style={[styles.sheetCellHeader, { width: 60, textAlign: 'center' }]}>Action</Text>
            </View>

            {/* Sheet Body */}
            <ScrollView showsVerticalScrollIndicator={true} style={styles.sheetScrollV}>
              {filteredChecks.map((item, idx) => {
                const { color: statusColor, label: statusLabel } = getStatusConfig(item.status);

                return (
                  <View key={item.id || idx} style={styles.sheetRow}>
                    <Text style={[styles.sheetCell, { width: 160, fontWeight: '600' }]} numberOfLines={2}>{item.particular || '-'}</Text>
                    <Text style={[styles.sheetCell, { width: 120 }]} numberOfLines={2}>{item.unit || '-'}</Text>
                    <View style={[styles.sheetCell, { width: 80, alignItems: 'center' }]}>
                      <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: statusColor, fontWeight: '700' }}>{statusLabel}</Text>
                      </View>
                    </View>
                    <Text style={[styles.sheetCell, { width: 220, fontStyle: 'italic', color: colors.ink700 }]} numberOfLines={3}>{item.remarks || '-'}</Text>
                    <View style={[styles.sheetCell, { width: 60, alignItems: 'center' }]}>
                      {item.evidence_url ? (
                        <Ionicons name="image" size={20} color={colors.brandBlue} />
                      ) : (
                        <Text style={{ color: colors.muted2 }}>-</Text>
                      )}
                    </View>
                    <View style={[styles.sheetCell, { width: 60, alignItems: 'center' }]}>
                      <TouchableOpacity onPress={() => { setEditingCheck(item); setModalVisible(true); }}>
                        <Ionicons name="create-outline" size={18} color={colors.brandBlue} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Quality & NCR" subtitle={activeProject ? activeProject.name : 'All Projects'} />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.muted2} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search checks, remarks..."
          placeholderTextColor={colors.muted3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'card' && styles.viewToggleBtnActive]} onPress={() => setViewMode('card')}>
          <Ionicons name="apps-outline" size={16} color={viewMode === 'card' ? '#fff' : colors.brandBlue} />
          <Text style={[styles.viewToggleText, viewMode === 'card' && styles.viewToggleTextActive]}>Card View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.viewToggleBtn, viewMode === 'sheet' && styles.viewToggleBtnActive]} onPress={() => setViewMode('sheet')}>
          <Ionicons name="list-outline" size={16} color={viewMode === 'sheet' ? '#fff' : colors.brandBlue} />
          <Text style={[styles.viewToggleText, viewMode === 'sheet' && styles.viewToggleTextActive]}>Sheet View</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={colors.brandOrange} /></View>
      ) : filteredChecks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={44} color={colors.muted3} />
          <Text style={styles.emptyTitle}>No Quality Checks</Text>
          <Text style={styles.emptySubtitle}>No records match your search or filters.</Text>
        </View>
      ) : viewMode === 'card' ? (
        <FlatList
          data={filteredChecks}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
        />
      ) : (
        renderSheetView()
      )}

      <QualityFormModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => fetchQualityChecks()}
        onDelete={() => fetchQualityChecks()}
        initialData={editingCheck}
        activeProjectId={activeProject?.id}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => { setEditingCheck(null); setModalVisible(true); }}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper1, margin: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.line },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.ink900 },
  
  viewToggleContainer: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: 8 },
  viewToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.brandBlue + '15', borderWidth: 1, borderColor: colors.brandBlue + '30' },
  viewToggleBtnActive: { backgroundColor: colors.brandBlue, borderColor: colors.brandBlue },
  viewToggleText: { marginLeft: 6, fontSize: 13, fontWeight: '700', color: colors.brandBlue },
  viewToggleTextActive: { color: '#FFF' },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl + 40 },
  card: { backgroundColor: colors.paper1, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardMain: { flexDirection: 'row' },
  cardContent: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  particularText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink900, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  metaText: { fontSize: 12, color: colors.muted, marginLeft: 4 },
  remarksBox: { backgroundColor: colors.paper0, padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  remarksText: { fontSize: 13, color: colors.ink700, fontStyle: 'italic' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brandBlue + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.brandBlue, marginLeft: 6 },
  imageContainer: { width: 100, borderLeftWidth: 1, borderLeftColor: colors.line, backgroundColor: colors.paper0 },
  thumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  sheetContainer: { flex: 1, backgroundColor: colors.paper1, marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  sheetScrollH: { flex: 1 },
  sheetScrollV: { flex: 1 },
  sheetRowHeader: { flexDirection: 'row', backgroundColor: colors.paper0, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 12 },
  sheetCellHeader: { fontSize: 12, fontWeight: '700', color: colors.muted, paddingHorizontal: 12, textTransform: 'uppercase' },
  sheetRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line2, paddingVertical: 12, alignItems: 'center' },
  sheetCell: { fontSize: 13, color: colors.ink900, paddingHorizontal: 12 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, marginTop: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.muted, marginTop: spacing.md },
  emptySubtitle: { fontSize: 13, color: colors.muted2, textAlign: 'center', marginTop: 4 },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.md, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandOrange, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
