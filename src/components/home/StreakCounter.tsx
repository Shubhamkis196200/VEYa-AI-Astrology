// ============================================================================
// VEYa Streak Counter — Animated Flame + Milestones
// ============================================================================

import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

interface StreakCounterProps {
  currentStreak: number;
  isLoading?: boolean;
}

const MILESTONES = [7, 30, 100];

export default function StreakCounter({ currentStreak, isLoading }: StreakCounterProps) {
  const flamePulse = useSharedValue(1);
  const flameBase = useSharedValue(1);
  const numberScale = useSharedValue(1);
  const previousStreak = useRef(currentStreak);

  useEffect(() => {
    flamePulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      true,
    );
    
    return () => {
      cancelAnimation(flamePulse);
    };
  }, []);

  useEffect(() => {
    const base = 1 + Math.min(currentStreak / 30, 0.6);
    flameBase.value = withSpring(base, { damping: 12, stiffness: 120 });

    if (currentStreak > previousStreak.current) {
      numberScale.value = 1.18;
      numberScale.value = withSpring(1, { damping: 10, stiffness: 140 });
    }
    previousStreak.current = currentStreak;
  }, [currentStreak]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flamePulse.value * flameBase.value }],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const milestoneLabel = useMemo(() => {
    if (!MILESTONES.includes(currentStreak)) return null;
    if (currentStreak === 7) return '✨ First 7-day milestone!';
    if (currentStreak === 30) return '🌙 30-day lunar rhythm achieved!';
    if (currentStreak === 100) return '🔥 100-day legendary streak!';
    return null;
  }, [currentStreak]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Animated.Text style={[styles.flame, flameStyle]}>🔥</Animated.Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Checking your streak...</Text>
        ) : currentStreak > 0 ? (
          <Animated.Text style={[styles.streakText, numberStyle]}>
            {currentStreak} Day Streak
          </Animated.Text>
        ) : (
          <Text style={styles.zeroText}>Start your streak today</Text>
        )}
      </View>

      {milestoneLabel && (
        <Animated.View
          entering={FadeInDown.duration(600)}
          exiting={FadeOut.duration(400)}
          style={styles.milestone}
        >
          <Text style={styles.milestoneText}>{milestoneLabel}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flame: {
    fontSize: 22,
    marginRight: 10,
  },
  streakText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  zeroText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.textSecondary,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  milestone: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  milestoneText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primaryDark,
    letterSpacing: 0.3,
  },
});
