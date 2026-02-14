// ============================================================================
// VEYa Cosmic Weather Widget — Today's Cosmic Conditions at a Glance
// ============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getMoonPhase, getCurrentTransits } from '@/services/astroEngine';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CosmicCondition {
  emoji: string;
  label: string;
  value: string;
  color: string;
}

type WeatherLevel = 'excellent' | 'good' | 'mixed' | 'challenging';

interface WeatherData {
  level: WeatherLevel;
  emoji: string;
  headline: string;
  description: string;
  gradientColors: readonly [string, string];
  conditions: CosmicCondition[];
}

// ---------------------------------------------------------------------------
// Weather Calculator
// ---------------------------------------------------------------------------

function calculateCosmicWeather(): WeatherData {
  const moonPhase = getMoonPhase();
  const transits = getCurrentTransits();

  // Count benefic vs malefic transits
  const benefic = transits.filter(t =>
    ['Venus', 'Jupiter'].includes(t.name)
  ).length;
  const malefic = transits.filter(t =>
    ['Mars', 'Saturn', 'Pluto'].includes(t.name)
  ).length;

  // Moon phase energy
  const moonEnergy = moonPhase.illumination;
  const isWaxing = moonPhase.phaseName.includes('Waxing') || moonPhase.phaseName === 'New Moon';

  // Calculate overall score
  const score = 50 + (benefic * 15) - (malefic * 10) + (moonEnergy * 20) + (isWaxing ? 5 : 0);

  // Determine weather level
  let level: WeatherLevel;
  let emoji: string;
  let headline: string;
  let description: string;
  let gradientColors: readonly [string, string];

  if (score >= 80) {
    level = 'excellent';
    emoji = '✨';
    headline = 'Excellent Cosmic Weather';
    description = 'The stars are strongly aligned in your favor today';
    gradientColors = ['#064E3B', '#10B981'] as const;
  } else if (score >= 60) {
    level = 'good';
    emoji = '☀️';
    headline = 'Good Cosmic Weather';
    description = 'Positive energy flows — a great day for intentions';
    gradientColors = ['#1E3A5F', '#3B82F6'] as const;
  } else if (score >= 40) {
    level = 'mixed';
    emoji = '🌤️';
    headline = 'Mixed Cosmic Weather';
    description = 'Both opportunities and challenges present themselves';
    gradientColors = ['#78350F', '#D97706'] as const;
  } else {
    level = 'challenging';
    emoji = '🌧️';
    headline = 'Challenging Cosmic Weather';
    description = 'Take it slow today — self-care is your cosmic mission';
    gradientColors = ['#4C1D95', '#7C3AED'] as const;
  }

  // Build conditions
  const conditions: CosmicCondition[] = [
    {
      emoji: moonPhase.emoji,
      label: 'Moon',
      value: `${moonPhase.phaseName} (${Math.round(moonPhase.illumination * 100)}%)`,
      color: '#D4A547',
    },
    {
      emoji: '⚡',
      label: 'Energy',
      value: score >= 70 ? 'High' : score >= 50 ? 'Moderate' : 'Low',
      color: score >= 70 ? '#10B981' : score >= 50 ? '#3B82F6' : '#EF4444',
    },
    {
      emoji: isWaxing ? '📈' : '📉',
      label: 'Phase',
      value: isWaxing ? 'Growth Period' : 'Release Period',
      color: isWaxing ? '#10B981' : '#8B5CF6',
    },
  ];

  // Add top transit if any
  if (transits.length > 0) {
    const topTransit = transits[0];
    conditions.push({
      emoji: '🪐',
      label: 'Key Transit',
      value: `${topTransit.name} in ${topTransit.sign}`,
      color: '#6366F1',
    });
  }

  return { level, emoji, headline, description, gradientColors, conditions };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CosmicWeatherWidgetProps {
  onPress?: () => void;
}

export default function CosmicWeatherWidget({ onPress }: CosmicWeatherWidgetProps) {
  const weather = useMemo(() => calculateCosmicWeather(), []);

  // Subtle pulse for the weather emoji
  const pulse = useSharedValue(0);
  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.05 }],
    opacity: 0.8 + pulse.value * 0.2,
  }));

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(100)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
      >
        <LinearGradient
          colors={weather.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Animated.Text style={[styles.weatherEmoji, pulseStyle]}>
              {weather.emoji}
            </Animated.Text>
            <View style={styles.headerText}>
              <Text style={styles.headline}>{weather.headline}</Text>
              <Text style={styles.description}>{weather.description}</Text>
            </View>
          </View>

          {/* Conditions Grid */}
          <View style={styles.conditionsGrid}>
            {weather.conditions.map((condition, index) => (
              <View key={index} style={styles.conditionItem}>
                <Text style={styles.conditionEmoji}>{condition.emoji}</Text>
                <Text style={styles.conditionLabel}>{condition.label}</Text>
                <Text style={styles.conditionValue} numberOfLines={1}>
                  {condition.value}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weatherEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headline: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  description: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  conditionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  conditionEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  conditionLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  conditionValue: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
