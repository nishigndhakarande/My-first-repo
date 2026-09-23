import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../theme/colors';

export const StatusBadge = ({ status }) => {
  const s = String(status || '').toLowerCase();

  let bg = colors.statusNeutralBg;
  let text = colors.statusNeutral;
  let label = status || 'Pending';

  if (s.includes('done') || s.includes('complete') || s.includes('active') || s.includes('approved')) {
    bg = colors.statusGoodBg;
    text = colors.statusGood;
  } else if (s.includes('progress') || s.includes('ongoing') || s.includes('under review')) {
    bg = colors.statusInfoBg;
    text = colors.statusInfo;
  } else if (s.includes('delay') || s.includes('watch') || s.includes('open') || s.includes('pending')) {
    bg = colors.statusWatchBg;
    text = colors.statusWatch;
  } else if (s.includes('bad') || s.includes('ncr') || s.includes('reject') || s.includes('blocked')) {
    bg = colors.statusBadBg;
    text = colors.statusBad;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
