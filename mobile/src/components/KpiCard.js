import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export const KpiCard = ({ title, value, subtext, icon, color = colors.brandOrange }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
            <Ionicons name={icon} size={16} color={color} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#17181C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    minWidth: '47%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 2,
  },
  subtext: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
  },
});
