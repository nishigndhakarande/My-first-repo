import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { BudgetFormModal } from '../components/BudgetFormModal';
import { Ionicons } from '@expo/vector-icons';

export const BudgetScreen = () => {
  const { activeProject } = useAuth();
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCats, setExpandedCats] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'sheet'

  const fetchBudget = useCallback(async () => {
    try {
      const data = await api.getBudgetItems(activeProject?.id);
      setBudgetItems(data);
    } catch (err) {
      console.warn('Error fetching budget:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudget();
  };

  const { grouped, totals } = useMemo(() => {
    const sums = { amount: 0, invoiced: 0, paid: 0 };
    const groups = {};

    budgetItems.forEach((item) => {
      sums.amount += Number(item.amount) || 0;
      sums.invoiced += Number(item.invoiced_amount) || 0;
      sums.paid += Number(item.paid_amount) || 0;

      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = { category: cat, items: [], amount: 0, paid: 0 };
      groups[cat].items.push(item);
      groups[cat].amount += Number(item.amount) || 0;
      groups[cat].paid += Number(item.paid_amount) || 0;
    });

    return { grouped: Object.values(groups), totals: sums };
  }, [budgetItems]);

  const toggleCategory = (cat) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCats((prev) => ({ ...prev, [cat]: prev[cat] === false ? true : false }));
  };

  const renderItem = (item, idx) => {
    const budgeted = Number(item.amount) || 0;
    const paid = Number(item.paid_amount) || 0;
    const invoiced = Number(item.invoiced_amount) || 0;
    const progress = budgeted > 0 ? (paid / budgeted) * 100 : 0;

    return (
      <View key={item.id || idx} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{item.item || 'Unnamed Item'}</Text>
            {item.vendor && <Text style={styles.itemSubtitle}>Vendor: {item.vendor}</Text>}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingItem(item); setModalVisible(true); }}>
            <Ionicons name="create-outline" size={16} color={colors.brandBlue} />
          </TouchableOpacity>
        </View>

        <View style={styles.financialGrid}>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Budgeted</Text>
            <Text style={styles.finValue}>{'₹' + budgeted.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.finCol, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line2 }]}>
            <Text style={styles.finLabel}>Invoiced</Text>
            <Text style={[styles.finValue, { color: colors.brandOrange }]}>{'₹' + invoiced.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>Paid</Text>
            <Text style={[styles.finValue, { color: colors.brandGreen }]}>{'₹' + paid.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: (budgeted > 0 ? Math.min(100, Math.round((paid / budgeted) * 100)) : 0) + '%' }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderCategory = ({ item }) => {
    const isExpanded = expandedCats[item.category] !== false;
    return (
      <View style={styles.catContainer}>
        <TouchableOpacity style={styles.catHeader} onPress={() => toggleCategory(item.category)} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={styles.catTitle}>{item.category}</Text>
            <Text style={styles.catSubtitle}>{item.items.length} Items</Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginRight: spacing.md }}>
            <Text style={styles.catAmount}>{'₹' + item.amount.toLocaleString('en-IN')}</Text>
            <Text style={styles.catPaid}>Paid: {'₹' + item.paid.toLocaleString('en-IN')}</Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.catItemsWrapper}>
            {item.items.map((it, idx) => renderItem(it, idx))}
          </View>
        )}
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
              <Text style={[styles.sheetCellHeader, { width: 120 }]}>Category</Text>
              <Text style={[styles.sheetCellHeader, { width: 150 }]}>Item Name</Text>
              <Text style={[styles.sheetCellHeader, { width: 120 }]}>Vendor</Text>
              <Text style={[styles.sheetCellHeader, { width: 100, textAlign: 'right' }]}>Budgeted</Text>
              <Text style={[styles.sheetCellHeader, { width: 100, textAlign: 'right' }]}>Invoiced</Text>
              <Text style={[styles.sheetCellHeader, { width: 100, textAlign: 'right' }]}>Paid</Text>
              <Text style={[styles.sheetCellHeader, { width: 80, textAlign: 'center' }]}>Progress</Text>
              <Text style={[styles.sheetCellHeader, { width: 60, textAlign: 'center' }]}>Action</Text>
            </View>

            {/* Sheet Body */}
            <ScrollView showsVerticalScrollIndicator={true} style={styles.sheetScrollV}>
              {budgetItems.map((item, idx) => {
                const budgeted = Number(item.amount) || 0;
                const invoiced = Number(item.invoiced_amount) || 0;
                const paid = Number(item.paid_amount) || 0;
                const progress = budgeted > 0 ? Math.round((paid / budgeted) * 100) : 0;

                return (
                  <View key={item.id || idx} style={styles.sheetRow}>
                    <Text style={[styles.sheetCell, { width: 120 }]} numberOfLines={1}>{item.category || 'General'}</Text>
                    <Text style={[styles.sheetCell, { width: 150, fontWeight: '600' }]} numberOfLines={1}>{item.item || '-'}</Text>
                    <Text style={[styles.sheetCell, { width: 120 }]} numberOfLines={1}>{item.vendor || '-'}</Text>
                    <Text style={[styles.sheetCell, { width: 100, textAlign: 'right' }]}>{'₹' + budgeted.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.sheetCell, { width: 100, textAlign: 'right', color: colors.brandOrange }]}>{'₹' + invoiced.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.sheetCell, { width: 100, textAlign: 'right', color: colors.brandGreen }]}>{'₹' + paid.toLocaleString('en-IN')}</Text>
                    <View style={[styles.sheetCell, { width: 80, alignItems: 'center' }]}>
                      <View style={{ backgroundColor: progress >= 100 ? colors.brandGreen + '20' : colors.brandOrange + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: progress >= 100 ? colors.brandGreen : colors.brandOrange, fontWeight: '700' }}>{progress}%</Text>
                      </View>
                    </View>
                    <View style={[styles.sheetCell, { width: 60, alignItems: 'center' }]}>
                      <TouchableOpacity onPress={() => { setEditingItem(item); setModalVisible(true); }}>
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
      <Header title="Project Budget" subtitle={activeProject ? activeProject.name : 'All Projects'} />

      {/* Summary Header */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryValue}>{'₹' + totals.amount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: colors.brandGreen }]}>{'₹' + totals.paid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[styles.summaryValue, { color: colors.brandOrange }]}>{'₹' + Math.max(0, totals.amount - totals.paid).toLocaleString('en-IN')}</Text>
        </View>
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
      ) : budgetItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={44} color={colors.muted3} />
          <Text style={styles.emptyTitle}>No Budget Data</Text>
          <Text style={styles.emptySubtitle}>No budget items found for this selection.</Text>
        </View>
      ) : viewMode === 'card' ? (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.category}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
        />
      ) : (
        renderSheetView()
      )}
      <BudgetFormModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => fetchBudget()}
        onDelete={() => fetchBudget()}
        initialData={editingItem}
        activeProjectId={activeProject?.id}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => { setEditingItem(null); setModalVisible(true); }}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  summaryContainer: { flexDirection: 'row', backgroundColor: colors.paper1, padding: spacing.md, margin: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.line, justifyContent: 'space-between' },
  summaryBox: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '800', color: colors.ink900 },
  
  viewToggleContainer: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: 8 },
  viewToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: borderRadius.pill, backgroundColor: colors.brandBlue + '15', borderWidth: 1, borderColor: colors.brandBlue + '30' },
  viewToggleBtnActive: { backgroundColor: colors.brandBlue, borderColor: colors.brandBlue },
  viewToggleText: { marginLeft: 6, fontSize: 13, fontWeight: '700', color: colors.brandBlue },
  viewToggleTextActive: { color: '#FFF' },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl + 40, gap: spacing.md },
  catContainer: { backgroundColor: colors.paper1, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  catHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.paper0, borderBottomWidth: 1, borderBottomColor: colors.line },
  catTitle: { fontSize: 14, fontWeight: '700', color: colors.ink900 },
  catSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  catAmount: { fontSize: 14, fontWeight: '700', color: colors.ink900 },
  catPaid: { fontSize: 12, color: colors.brandGreen, marginTop: 2 },
  catItemsWrapper: { padding: spacing.sm },
  
  card: { backgroundColor: colors.paper0, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.line2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.ink900, marginBottom: 2 },
  itemSubtitle: { fontSize: 12, color: colors.muted },
  editBtn: { padding: 4, backgroundColor: colors.brandBlue + '15', borderRadius: borderRadius.sm },
  financialGrid: { flexDirection: 'row', backgroundColor: colors.paper1, borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  finCol: { flex: 1, alignItems: 'center' },
  finLabel: { fontSize: 11, color: colors.muted, marginBottom: 4 },
  finValue: { fontSize: 13, fontWeight: '700', color: colors.ink900 },
  progressRow: { marginTop: spacing.sm },
  progressTrack: { height: 6, backgroundColor: colors.line2, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brandGreen, borderRadius: 3 },
  
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
