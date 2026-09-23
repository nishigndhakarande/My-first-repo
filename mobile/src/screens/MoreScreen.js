import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

export const MoreScreen = ({ navigation }) => {
  const { profile, user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out of SIPS?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const MENU_ITEMS = [
    {
      title: 'Approvals',
      subtitle: 'Pending requests and sign-offs',
      icon: 'checkmark-circle-outline',
      color: colors.brandGreen,
      screen: 'Approvals',
    },
    {
      title: 'Budget & Finance',
      subtitle: 'Line items, planned vs actual spend',
      icon: 'wallet-outline',
      color: colors.brandBlue,
      screen: 'Budget',
    },
    {
      title: 'Quality & NCR',
      subtitle: 'Defect tracking and snag inspections',
      icon: 'shield-outline',
      color: colors.statusBad,
      screen: 'Quality',
    },
    {
      title: 'Drawings & Media',
      subtitle: 'Blueprints, revisions, and site photos',
      icon: 'layers-outline',
      color: colors.brandOrange,
      screen: 'Drawings',
    },
  ];

  const SECONDARY_ITEMS = [
    {
      title: 'Vendors',
      subtitle: 'Vendor directory and contracts',
      icon: 'bus-outline',
      color: colors.ink600,
      screen: 'Vendors',
    },
    {
      title: 'Client Portal',
      subtitle: 'External stakeholder view',
      icon: 'globe-outline',
      color: colors.brandBlue,
      screen: 'ClientPortal',
    },
    {
      title: 'User Management',
      subtitle: 'Roles, permissions and company',
      icon: 'people-outline',
      color: colors.brandOrange,
      screen: 'Admin',
      requiresAdmin: true,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Menu & Settings" subtitle="System Modules & Profile" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {profile?.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'US'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'SIPS User'}</Text>
            <View style={styles.roleRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{profile?.role ? profile.role.toUpperCase() : 'MEMBER'}</Text>
              </View>
            </View>
            <Text style={styles.emailText}>{user?.email || 'user@kindersports.in'}</Text>
          </View>
        </View>

        {/* Modules Section */}
        <Text style={styles.sectionHeader}>Project Modules</Text>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuRow,
                idx < MENU_ITEMS.length - 1 && styles.menuRowBorder,
              ]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.menuMeta}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted3} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Network & Admin Section */}
        <Text style={styles.sectionHeader}>Network & Admin</Text>
        <View style={styles.menuCard}>
          {SECONDARY_ITEMS.map((item, idx) => {
            if (item.requiresAdmin && profile?.role !== 'director' && profile?.role !== 'pm') {
              return null;
            }
            return (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.menuRow,
                  idx < SECONDARY_ITEMS.length - 1 && styles.menuRowBorder,
                ]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.menuMeta}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted3} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Support Section */}
        <Text style={styles.sectionHeader}>Kinder Sports Support</Text>
        <View style={styles.supportCard}>
          <View style={styles.supportRow}>
            <Ionicons name="mail-outline" size={18} color={colors.brandOrange} />
            <Text style={styles.supportText}>support@kindersports.in</Text>
          </View>
          <View style={styles.supportRow}>
            <Ionicons name="call-outline" size={18} color={colors.brandOrange} />
            <Text style={styles.supportText}>+91 80874 44187</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.statusBad} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SIPS Mobile v1.0.0 &bull; Kinder Sports</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper0,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    backgroundColor: colors.paper1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink900,
  },
  roleRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  roleBadge: {
    backgroundColor: colors.brandOrange50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brandOrange,
  },
  emailText: {
    fontSize: 11.5,
    color: colors.muted,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  menuCard: {
    backgroundColor: colors.paper1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuMeta: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink900,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  supportCard: {
    backgroundColor: colors.paper1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  supportText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.ink800,
  },
  logoutBtn: {
    backgroundColor: colors.statusBadBg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: spacing.md,
  },
  logoutBtnText: {
    color: colors.statusBad,
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.muted3,
  },
});
