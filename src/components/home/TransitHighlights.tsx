/**
 * VEYa — TransitHighlights
 *
 * Transit highlights list from the Today tab.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Transit {
  symbol: string;
  label: string;
  description: string;
}

interface TransitHighlightsProps {
  transits: Transit[];
}

export default function TransitHighlights({ transits }: TransitHighlightsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🔮 Transit Highlights</Text>
      {transits.map((t, i) => (
        <View key={`transit-${i}`} style={styles.transitRow}>
          <Text style={styles.transitLabel}>
            {t.symbol} {t.label}
          </Text>
          <Text style={styles.transitDesc}>{t.description}</Text>
        </View>
      ))}
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
  cardTitle: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  transitRow: { marginBottom: 12 },
  transitLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.bodySemiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  transitDesc: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fonts.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
