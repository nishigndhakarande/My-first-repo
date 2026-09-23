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
  Linking,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { VendorFormModal } from '../components/VendorFormModal';
import { Ionicons } from '@expo/vector-icons';

export const VendorsScreen = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      const data = await api.getVendors();
      setVendors(data);
    } catch (err) {
      console.warn('Error fetching vendors:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const filteredVendors = useMemo(() => {
    let list = vendors;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = vendors.filter(v => 
        (v.name || '').toLowerCase().includes(q) || 
        (v.contact_person || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q)
      );
    }
    // Sort alphabetically by name
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [vendors, searchQuery]);

  const handleCall = (phone) => {
    if (phone) Linking.openURL('tel:' + phone);
    else Alert.alert('No Phone', 'Phone number not available for this vendor.');
  };

  const handleEmail = (email) => {
    if (email) Linking.openURL('mailto:' + email);
    else Alert.alert('No Email', 'Email not available for this vendor.');
  };

  const getRandomColor = (name) => {
    const chars = '0123456789ABCDEF';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      // Make it slightly pastel by keeping values high
      const finalVal = Math.max(100, value).toString(16);
      color += finalVal.length === 1 ? '0' + finalVal : finalVal;
    }
    return color;
  };

  const renderItem = ({ item }) => {
    const avatarLetter = (item.name || 'V').charAt(0).toUpperCase();
    const avatarColor = getRandomColor(item.name || 'Vendor');

    return (
      <TouchableOpacity 
        style={styles.contactRow} 
        activeOpacity={0.8} 
        onPress={() => { setEditingVendor(item); setModalVisible(true); }}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.contactSub} numberOfLines={1}>
            {item.category ? item.category : 'General Vendor'}
            {item.contact_person ? ` • ${item.contact_person}` : ''}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCol}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: item.phone ? colors.brandGreen + '15' : colors.line }]} 
            onPress={() => handleCall(item.phone)}
            disabled={!item.phone}
          >
            <Ionicons name="call" size={16} color={item.phone ? colors.brandGreen : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: item.email ? colors.brandOrange + '15' : colors.line }]} 
            onPress={() => handleEmail(item.email)}
            disabled={!item.email}
          >
            <Ionicons name="mail" size={16} color={item.email ? colors.brandOrange : colors.muted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Vendors" subtitle="Contact Book" />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.muted2} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors, contacts, categories..."
          placeholderTextColor={colors.muted3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={colors.brandOrange} /></View>
      ) : (
        <FlatList
          data={filteredVendors}
          keyExtractor={(item) => String(item.id || Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-circle-outline" size={54} color={colors.muted3} />
              <Text style={styles.emptyTitle}>No Contacts Found</Text>
              <Text style={styles.emptySubtitle}>You don't have any vendors yet.</Text>
            </View>
          }
        />
      )}
      
      <VendorFormModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={() => fetchVendors()}
        onDelete={() => fetchVendors()}
        initialData={editingVendor}
      />
      
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => { setEditingVendor(null); setModalVisible(true); }}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper1, margin: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.line },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.ink900 },
  clearBtn: { padding: 4 },
  
  listContent: { paddingBottom: spacing.xxxl + 40 },
  separator: { height: 1, backgroundColor: colors.line, marginLeft: 72 }, // Align with text start
  
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: spacing.md, backgroundColor: colors.paper0 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  
  infoCol: { flex: 1, justifyContent: 'center', paddingRight: 8 },
  contactName: { fontSize: 16, fontWeight: '600', color: colors.ink900, marginBottom: 2 },
  contactSub: { fontSize: 13, color: colors.muted },
  
  actionsCol: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink900, marginTop: spacing.md },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6 },
  
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.md, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandBlue, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
