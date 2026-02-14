/**
 * VEYa — DailyBriefingCard
 *
 * The main daily reading/briefing card from the Today tab.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import ShareButton from '@/components/shared/ShareButton';

interface DailyBriefingCardProps {
  briefing: string;
  onShare?: () => void;
}

export default function DailyBriefingCard({
  briefing,
  onShare,
}: DailyBriefingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>✨ Daily Briefing</Text>
        {onShare && <ShareButton onPress={onShare} />}
      </View>
      <Text style={styles.briefingText}>{briefing}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,165,71,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  briefingText: {
    fontSize: 15,
    fontFamily: typography.fonts.body,
    color: '#3A3A50',
    lineHeight: 24,
  },
});
