// ============================================================================
// VEYa Achievement Unlock Toast — Celebration Animation
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAchievementUnlockToast, type Achievement } from '@/stores/achievementStore';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

const RARITY_COLORS = {
  common: ['#6B7280', '#4B5563'],
  rare: ['#3B82F6', '#2563EB'],
  epic: ['#8B5CF6', '#7C3AED'],
  legendary: ['#F59E0B', '#D97706'],
} as const;

const RARITY_LABELS = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
} as const;

export default function AchievementToast() {
  const { recentUnlock, clearRecentUnlock } = useAchievementUnlockToast();
  
  const translateY = useSharedValue(-200);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (recentUnlock) {
      // Haptic celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Animate in
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(60, { damping: 15, stiffness: 150 });
      scale.value = withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 12 })
      );
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 400 }),
        withTiming(0.3, { duration: 600 })
      );

      // Auto dismiss after 4 seconds
      const timeout = setTimeout(() => {
        dismissToast();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [recentUnlock]);

  const dismissToast = () => {
    translateY.value = withTiming(-200, { duration: 300, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(clearRecentUnlock)();
    });
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!recentUnlock) return null;

  const colors = RARITY_COLORS[recentUnlock.rarity];

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable onPress={dismissToast}>
        <View style={styles.toastCard}>
          {/* Background glow */}
          <Animated.View style={[styles.glow, glowStyle]}>
            <LinearGradient
              colors={[colors[0] + '40', 'transparent']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </Animated.View>
          
          {/* Content */}
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <Text style={styles.emoji}>{recentUnlock.emoji}</Text>
              <View style={styles.textContainer}>
                <Text style={styles.unlockLabel}>Achievement Unlocked!</Text>
                <Text style={styles.achievementName}>{recentUnlock.name}</Text>
                <Text style={styles.description}>{recentUnlock.description}</Text>
              </View>
            </View>
            <View style={styles.rarityBadge}>
              <Text style={styles.rarityText}>{RARITY_LABELS[recentUnlock.rarity]}</Text>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 100,
  },
  gradient: {
    padding: spacing.md,
    paddingVertical: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  unlockLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  achievementName: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  rarityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
