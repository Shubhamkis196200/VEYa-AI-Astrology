/**
 * VEYa — DoAndDontCard
 *
 * The Do/Don't guidance card from the Today tab.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface DoAndDontCardProps {
  dos: string[];
  donts: string[];
}

export default function DoAndDontCard({ dos, donts }: DoAndDontCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>✅ Do / ❌ Don't</Text>
      {dos.map((d, i) => (
        <Text key={`do-${i}`} style={styles.doText}>✅ {d}</Text>
      ))}
      {donts.map((d, i) => (
        <Text key={`dont-${i}`} style={styles.dontText}>❌ {d}</Text>
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
  doText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    color: '#2D8A4E',
    marginBottom: 6,
    lineHeight: 21,
  },
  dontText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fonts.body,
    color: colors.fire,
    marginBottom: 6,
    lineHeight: 21,
  },
});
