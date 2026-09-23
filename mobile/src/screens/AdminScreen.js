import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { api, supabase } from '../services/supabase';
import { Header } from '../components/Header';
import { UserFormModal } from '../components/UserFormModal';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const AdminScreen = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const isAdmin = profile?.role === 'director' || profile?.role === 'pm';

  const fetchUsers = useCallback(async () => {
    try {
      if (isAdmin) {
        const data = await api.getUsers();
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.warn('Error fetching users:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleActive = async (item) => {
    if (!isAdmin) return;
    const newStatus = !item.is_active;
    Alert.alert(
      newStatus ? 'Activate User' : 'Deactivate User',
      'Are you sure you want to ' + (newStatus ? 'activate' : 'deactivate') + ' this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', item.id);
              if (error) throw error;
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          } 
        }
      ]
    );
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      (u.full_name || '').toLowerCase().includes(q) || 
      (u.role || '').toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.full_name || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.full_name || 'Unknown User'}</Text>
          <Text style={styles.userRole}>Role: {String(item.role || 'team').toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.is_active ? colors.brandGreen + '20' : colors.statusBadBg }]}>
          <Text style={[styles.statusText, { color: item.is_active ? colors.brandGreen : colors.statusBad }]}>
            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingUser(item); setModalVisible(true); }}>
          <Ionicons name="options-outline" size={16} color={colors.brandBlue} />
          <Text style={[styles.actionBtnText, { color: colors.brandBlue }]}>Edit Role</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: item.is_active ? colors.statusBad : colors.brandGreen }]} 
          onPress={() => handleToggleActive(item)}
        >
          <Ionicons name={item.is_active ? "power-outline" : "checkmark-circle-outline"} size={16} color={item.is_active ? colors.statusBad : colors.brandGreen} />
          <Text style={[styles.actionBtnText, { color: item.is_active ? colors.statusBad : colors.brandGreen }]}>
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isAdmin && !loading) {
    return (
      <View style={styles.container}>
        <Header title="User Management" subtitle="Access Denied" />
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={44} color={colors.statusBad} />
          <Text style={styles.emptyTitle}>Restricted Area</Text>
          <Text style={styles.emptySubtitle}>You do not have permission to view User Management.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="User Management" subtitle="Manage Team Roles & Access" />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={colors.brandOrange} /></View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={44} color={colors.muted3} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
            </View>
          }
        />
      )}

      <UserFormModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => fetchUsers()}
        initialData={editingUser}
        companyId={profile?.company_id}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => { setEditingUser(null); setModalVisible(true); }}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper1, margin: spacing.md, paddingHorizontal: spacing.md, height: 44, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: colors.line },
  searchInput: { flex: 1, height: '100%', paddingHorizontal: spacing.sm, fontSize: 13, color: colors.ink900 },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.paper1, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandOrange, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  userName: { fontSize: 14, fontWeight: '700', color: colors.ink900 },
  userRole: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusText: { fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line2, paddingTop: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.line, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink800, marginTop: spacing.md },
  emptySubtitle: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandOrange, alignItems: 'center', justifyContent: 'center', shadowColor: colors.brandOrange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
