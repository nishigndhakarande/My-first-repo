import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/supabase';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { MediaUploadModal } from '../components/MediaUploadModal';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { id: 'drawing', label: 'Drawings', icon: 'color-palette-outline' },
  { id: 'progress', label: 'Site Progress', icon: 'camera-outline' },
  { id: 'document', label: 'Documents', icon: 'document-text-outline' }
];

const screenWidth = Dimensions.get('window').width;

export const DrawingsScreen = () => {
  const { activeProject } = useAuth();
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('drawing');
  const [isModalVisible, setModalVisible] = useState(false);
  
  // Fullscreen Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchDrawings = useCallback(async () => {
    try {
      const data = await api.getDrawings(activeProject?.id);
      setDrawings(data);
    } catch (err) {
      console.warn('Error fetching drawings:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchDrawings();
  }, [fetchDrawings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrawings();
  };

  const getBucket = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'drawing') return 'drawing';
    if (t === 'document') return 'document';
    return 'progress'; 
  };

  const filteredItems = useMemo(() => {
    return drawings.filter((item) => getBucket(item.file_type) === activeTab);
  }, [drawings, activeTab]);

  const handleMediaPress = (item) => {
    if (!item.file_url) return;
    const isImage = item.file_url.match(/\.(jpeg|jpg|gif|png)$/i) != null || activeTab === 'progress';
    
    if (isImage) {
      setSelectedImage(item.file_url);
      setViewerVisible(true);
    } else {
      Linking.openURL(item.file_url);
    }
  };

  const renderItem = ({ item }) => {
    const isImage = item.file_url && (item.file_url.match(/\.(jpeg|jpg|gif|png)$/i) != null || activeTab === 'progress');
    
    // Photo Grid View (Instagram-style for Site Progress)
    if (activeTab === 'progress') {
      const size = (screenWidth - spacing.md * 3) / 3; // 3 columns
      return (
        <TouchableOpacity 
          style={[styles.gridPhotoWrapper, { width: size, height: size }]} 
          activeOpacity={0.8}
          onPress={() => handleMediaPress(item)}
        >
          {isImage ? (
            <Image source={{ uri: item.file_url }} style={styles.gridPhoto} resizeMode="cover" />
          ) : (
             <View style={[styles.gridPhoto, { backgroundColor: colors.paper0, alignItems: 'center', justifyContent: 'center' }]}>
               <Ionicons name="document" size={24} color={colors.muted3} />
             </View>
          )}
          <View style={styles.gridPhotoDateOverlay}>
            <Text style={styles.gridPhotoDateText}>{item.site_date || item.created_at?.split('T')[0]}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Standard Document/Drawing Card (2 columns)
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => handleMediaPress(item)}
      >
        {isImage ? (
          <Image source={{ uri: item.file_url }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="document-text" size={40} color={colors.muted3} />
          </View>
        )}
        
        <View style={styles.cardBody}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.name || 'Unnamed File'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Ionicons name="location-outline" size={12} color={colors.muted} />
              <Text style={styles.metaText} numberOfLines={1}>{item.discipline || 'General'}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Ionicons name="calendar-outline" size={12} color={colors.muted} />
              <Text style={styles.metaText}>{item.site_date || item.created_at?.split('T')[0] || 'Unknown Date'}</Text>
            </View>
          </View>

          {activeTab === 'drawing' && (
            <View style={styles.statusWrap}>
              <StatusBadge status={item.status || 'Pending'} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Media & Docs" subtitle={activeProject ? activeProject.name : 'All Projects'} />

      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons name={tab.icon} size={16} color={isActive ? '#FFF' : colors.muted} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={colors.brandOrange} /></View>
      ) : (
        <FlatList
          key={activeTab} // Force re-render of columns on tab change
          data={filteredItems}
          keyExtractor={(item) => item.id || String(Math.random())}
          renderItem={renderItem}
          numColumns={activeTab === 'progress' ? 3 : 2}
          columnWrapperStyle={activeTab === 'progress' ? styles.gridRowWrapper : styles.cardRowWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandOrange} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name={activeTab === 'progress' ? 'images-outline' : 'folder-open-outline'} size={44} color={colors.muted3} />
              <Text style={styles.emptyTitle}>No files found</Text>
              <Text style={styles.emptySubtitle}>There are no uploads in this category yet.</Text>
            </View>
          }
        />
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      <Modal visible={viewerVisible} transparent={true} animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.viewerCloseBtn} onPress={() => setViewerVisible(false)}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <ScrollView 
            maximumZoomScale={3} 
            minimumZoomScale={1} 
            centerContent={true} 
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.viewerScrollContent}
          >
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.viewerImage} />
            )}
          </ScrollView>
        </View>
      </Modal>

      <MediaUploadModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onUpload={() => fetchDrawings()}
        activeProjectId={activeProject?.id}
        defaultTab={activeTab}
      />
      
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper0 },
  tabContainer: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.paper1, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: borderRadius.pill, backgroundColor: colors.paper0, borderWidth: 1, borderColor: colors.line },
  tabButtonActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  tabText: { fontSize: 11.5, fontWeight: '700', color: colors.ink700 },
  tabTextActive: { color: '#FFF' },
  
  listContent: { padding: spacing.md, paddingBottom: spacing.xxxl + 40 },
  cardRowWrapper: { justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
  gridRowWrapper: { justifyContent: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  
  card: { flex: 1, maxWidth: '48%', backgroundColor: colors.paper1, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  cardImage: { width: '100%', height: 120, backgroundColor: colors.line },
  placeholderImage: { width: '100%', height: 120, backgroundColor: colors.paper0, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.sm },
  itemTitle: { fontSize: 13, fontWeight: '700', color: colors.ink900, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  metaCol: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 10, color: colors.muted, fontWeight: '500' },
  statusWrap: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line2, alignItems: 'flex-start' },
  
  gridPhotoWrapper: { borderRadius: borderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  gridPhoto: { width: '100%', height: '100%' },
  gridPhotoDateOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 2, paddingHorizontal: 4, alignItems: 'center' },
  gridPhotoDateText: { color: '#FFF', fontSize: 9, fontWeight: '700' },

  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  viewerScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: screenWidth, height: '100%', resizeMode: 'contain' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink800, marginTop: spacing.md },
  emptySubtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 4 },
  
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.md, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandOrange, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
