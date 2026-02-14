// ============================================================================
// VEYa Daily Affirmation — Personalized Cosmic Affirmations
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

// ---------------------------------------------------------------------------
// Affirmation Data by Sign
// ---------------------------------------------------------------------------

const AFFIRMATIONS: Record<string, string[]> = {
  Aries: [
    "I am a fearless pioneer, blazing new trails with courage and confidence.",
    "My passion ignites positive change in the world around me.",
    "I trust my instincts and take bold action toward my dreams.",
    "I am a leader, and my energy inspires others to follow their truth.",
    "My fire burns bright, warming everyone in my circle.",
  ],
  Taurus: [
    "I am grounded, stable, and worthy of all the abundance coming my way.",
    "I trust the timing of my life and allow good things to unfold naturally.",
    "My patience is my superpower; I build lasting foundations.",
    "I deserve comfort, beauty, and pleasure in my daily life.",
    "My loyalty and dedication create deep, meaningful connections.",
  ],
  Gemini: [
    "My curiosity leads me to endless discoveries and new perspectives.",
    "I communicate with clarity, charm, and authentic expression.",
    "My adaptability is a gift that helps me thrive in any situation.",
    "I embrace all aspects of myself — I am beautifully complex.",
    "My words have power, and I use them to uplift and inspire.",
  ],
  Cancer: [
    "My sensitivity is my strength; I feel deeply and love fully.",
    "I create safe, nurturing spaces for myself and those I love.",
    "My intuition guides me toward what truly nourishes my soul.",
    "I honor my emotions — they are wise messengers from within.",
    "My capacity to care is a gift I share generously with the world.",
  ],
  Leo: [
    "I radiate warmth, confidence, and creative brilliance.",
    "I deserve to be seen, heard, and celebrated for who I am.",
    "My generous heart attracts abundance and love in all forms.",
    "I am royalty, and I carry myself with grace and dignity.",
    "My creative expression brings joy and light to others.",
  ],
  Virgo: [
    "My attention to detail creates excellence in everything I touch.",
    "I am worthy of love exactly as I am, imperfections and all.",
    "My analytical mind is a gift that solves problems and creates order.",
    "I serve others from a place of overflow, not depletion.",
    "My dedication to growth makes me better every single day.",
  ],
  Libra: [
    "I create harmony and beauty wherever I go.",
    "My relationships are balanced, loving, and mutually supportive.",
    "I trust myself to make decisions that honor my authentic truth.",
    "I am a bridge-builder, connecting people and ideas with grace.",
    "My diplomatic nature creates peace in times of conflict.",
  ],
  Scorpio: [
    "My depth and intensity are gifts that transform everything I touch.",
    "I embrace my shadow — it holds wisdom and power.",
    "I am magnetic; my authentic presence draws what I need.",
    "My intuition cuts through illusion to reveal profound truth.",
    "I rise from every challenge stronger and more powerful than before.",
  ],
  Sagittarius: [
    "My optimism and faith open doors to infinite possibilities.",
    "I am a seeker of truth, and wisdom finds me on every path.",
    "My adventurous spirit leads me to experiences that expand my soul.",
    "I trust the universe to guide me toward my highest purpose.",
    "My enthusiasm is contagious and lights up every room I enter.",
  ],
  Capricorn: [
    "My discipline and determination move mountains.",
    "I am worthy of success, recognition, and abundant reward.",
    "My patience builds empires that stand the test of time.",
    "I balance ambition with rest; I am sustainable in my success.",
    "My leadership inspires others to reach their highest potential.",
  ],
  Aquarius: [
    "My uniqueness is my greatest gift to the world.",
    "I am a visionary, seeing possibilities others cannot imagine.",
    "My humanitarian heart beats for the collective good.",
    "I embrace my eccentricity — it makes me unforgettable.",
    "My innovative mind creates solutions that change the world.",
  ],
  Pisces: [
    "My sensitivity is a portal to profound wisdom and creativity.",
    "I trust my dreams — they carry messages from the divine.",
    "My compassion heals hearts and bridges worlds.",
    "I am connected to the infinite; I am never truly alone.",
    "My artistic soul expresses the beauty of the universe.",
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DailyAffirmationProps {
  sunSign?: string;
  onShare?: (text: string) => void;
}

export default function DailyAffirmation({ sunSign = 'Aries', onShare }: DailyAffirmationProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Get deterministic daily affirmation
  const affirmation = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const signAffirmations = AFFIRMATIONS[sunSign] || AFFIRMATIONS.Aries;
    return signAffirmations[dayOfYear % signAffirmations.length];
  }, [sunSign]);

  // Shimmer animation
  const shimmer = useSharedValue(0);
  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + Math.sin(shimmer.value * Math.PI * 2) * 0.2,
  }));

  // Scale for press
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleReveal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(1.02, {}, () => {
      scale.value = withSpring(1);
    });
    setIsRevealed(true);
  };

  const handleShare = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await Share.share({
        message: `✨ Today's Cosmic Affirmation for ${sunSign}:\n\n"${affirmation}"\n\n— VEYa`,
      });
      onShare?.(affirmation);
    } catch {}
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(200)}
      style={scaleStyle}
    >
      <Pressable
        onPress={isRevealed ? handleShare : handleReveal}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <LinearGradient
          colors={['#4C1D95', '#7C3AED', '#A78BFA'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.label}>✨ DAILY AFFIRMATION</Text>
            
            {isRevealed ? (
              <>
                <Text style={styles.affirmation}>"{affirmation}"</Text>
                <View style={styles.footer}>
                  <Text style={styles.signLabel}>For {sunSign}</Text>
                  <Text style={styles.shareHint}>Tap to share</Text>
                </View>
              </>
            ) : (
              <View style={styles.unrevealed}>
                <Text style={styles.tapText}>Tap to reveal your affirmation</Text>
                <View style={styles.mysteryDots}>
                  <Text style={styles.dot}>✦</Text>
                  <Text style={styles.dot}>✦</Text>
                  <Text style={styles.dot}>✦</Text>
                </View>
              </View>
            )}
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
    minHeight: 140,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    zIndex: 1,
  },
  label: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  affirmation: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  shareHint: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  unrevealed: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  tapText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.sm,
  },
  mysteryDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
