/**
 * VEYa — GradientCard
 *
 * A card wrapper using expo-linear-gradient with consistent styling.
 * Used across all tabs for elevated card surfaces.
 */

import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { borderRadius } from '@/theme/borderRadius';
import { spacing } from '@/theme/spacing';

interface GradientCardProps {
  /** Gradient colors. Defaults to white → warm cream. */
  gradientColors?: readonly [string, string, ...string[]];
  /** Gradient start point */
  start?: { x: number; y: number };
  /** Gradient end point */
  end?: { x: number; y: number };
  /** Card border radius. Defaults to xl (20). */
  radius?: number;
  /** Card padding. Defaults to spacing.lg (24). */
  padding?: number;
  /** Additional outer style */
  style?: ViewStyle;
  /** Additional inner gradient style */
  innerStyle?: ViewStyle;
  children: React.ReactNode;
}

export default function GradientCard({
  gradientColors = ['#FFFFFF', '#FDFBF7', '#FAF6EE'] as any,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  radius = borderRadius.xl,
  padding = spacing.lg,
  style,
  innerStyle,
  children,
}: GradientCardProps) {
  return (
    <View style={[styles.outer, { borderRadius: radius }, style]}>
      <LinearGradient
        colors={gradientColors as any}
        start={start}
        end={end}
        style={[
          styles.gradient,
          {
            borderRadius: radius,
            padding,
          },
          innerStyle,
        ]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(212, 165, 71, 0.15)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: { elevation: 5 },
    }),
  },
  gradient: {
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.15)',
  },
});
