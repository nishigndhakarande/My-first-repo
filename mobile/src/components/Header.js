import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const Header = ({ title, subtitle, showUser = true }) => {
  const { profile, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <View style={styles.topbar}>
      <View style={styles.leftSection}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/logo-mark-sm.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.title} numberOfLines={1}>
              {title || 'SIPS Platform'}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {showUser && profile && (
        <View style={styles.rightSection}>
          <View style={styles.userChip}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(profile.full_name)}</Text>
            </View>
            <TouchableOpacity
              onPress={logout}
              style={styles.logoutBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topbar: {
    backgroundColor: colors.navy900,
    paddingTop: 48,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#080B14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  leftSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  subtitle: {
    color: colors.muted2,
    fontSize: 11.5,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
