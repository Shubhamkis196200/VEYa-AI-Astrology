/**
 * VEYa — SectionHeader
 *
 * Repeated section header pattern with label + title used in explore, profile, rituals tabs.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface SectionHeaderProps {
  /** Uppercase small label above the title, e.g. "MY BIRTH CHART" */
  label?: string;
  /** Main section title */
  title: string;
  /** Optional poetic/italic subtext */
  subtext?: string;
  /** Override bottom margin (default: spacing.md / 16) */
  marginBottom?: number;
}

export default function SectionHeader({
  label,
  title,
  subtext,
  marginBottom = spacing.md,
}: SectionHeaderProps) {
  return (
    <View style={{ marginBottom }}>
      {label != null && (
        <Text style={styles.label}>{label}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtext != null && (
        <Text style={styles.subtext}>{subtext}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading2,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  subtext: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    letterSpacing: 0.3,
    marginTop: 4,
  },
});
