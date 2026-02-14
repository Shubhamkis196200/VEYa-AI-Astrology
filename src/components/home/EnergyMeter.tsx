/**
 * VEYa — EnergyMeter
 *
 * Cosmic energy score bar from the Today tab.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface EnergyMeterProps {
  score: number;
  maxScore?: number;
}

export default function EnergyMeter({ score, maxScore = 10 }: EnergyMeterProps) {
  const widthPercent = `${(score / maxScore) * 100}%`;
  const label = `${score} / ${maxScore}`;

  return (
    <View>
      <Text style={styles.title}>🌙 Cosmic Energy</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: widthPercent as any }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  bar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accentGold,
    borderRadius: 4,
  },
  label: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    color: colors.textSecondary,
  },
});
