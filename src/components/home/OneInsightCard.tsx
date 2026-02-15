// ============================================================================
// VEYa One Insight Card — The Hero Daily Card
// ============================================================================
// 
// This is THE most important component - one powerful, shareable daily insight
// that makes users want to open the app every single day.
//

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getCurrentTransits, getMoonPhase } from '@/services/astroEngine';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAchievementStore } from '@/stores/achievementStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyInsight {
  emoji: string;
  headline: string;
  message: string;
  transit: string;
  energy: 'positive' | 'neutral' | 'challenging';
}

// ---------------------------------------------------------------------------
// Insight Generation
// ---------------------------------------------------------------------------

function generateDailyInsight(
  sunSign?: string,
  moonSign?: string,
  risingSign?: string,
  userName?: string
): DailyInsight {
  const transits = getCurrentTransits();
  const moonPhase = getMoonPhase();
  
  // Find the most significant transit for today
  const venus = transits.find(t => t.name === 'Venus');
  const mars = transits.find(t => t.name === 'Mars');
  const jupiter = transits.find(t => t.name === 'Jupiter');
  const moon = transits.find(t => t.name === 'Moon');

  // Generate insight based on strongest transit
  const insights: DailyInsight[] = [];

  // Venus insights (love, beauty, harmony)
  if (venus) {
    const venusInsights: Record<string, DailyInsight> = {
      Aries: {
        emoji: '💕',
        headline: 'Love Takes Initiative',
        message: `Venus in Aries fires up your heart. Be bold in expressing affection — someone is waiting to hear how you feel.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Taurus: {
        emoji: '🌹',
        headline: 'Sensual Pleasures Await',
        message: `Venus is home in Taurus. Indulge your senses today — good food, soft fabrics, beautiful art. You deserve it.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Gemini: {
        emoji: '💬',
        headline: 'Words of Love',
        message: `Venus in Gemini wants playful conversation. A flirty text, a compliment, or a heartfelt letter could change everything.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Cancer: {
        emoji: '🏠',
        headline: 'Home is Where the Heart Is',
        message: `Venus in Cancer craves emotional security. Nurture your closest relationships — make someone feel truly seen.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Leo: {
        emoji: '✨',
        headline: 'Love Wants to Shine',
        message: `Venus in Leo demands grand gestures. Don't hold back — express your love dramatically and authentically.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Virgo: {
        emoji: '🤍',
        headline: 'Love in the Details',
        message: `Venus in Virgo shows love through service. A thoughtful act of care speaks louder than words today.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'neutral',
      },
      Libra: {
        emoji: '⚖️',
        headline: 'Harmony in Relationships',
        message: `Venus rules Libra beautifully. Seek balance in partnerships — compromise today leads to deeper connection.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Scorpio: {
        emoji: '🖤',
        headline: 'Deep Emotional Truth',
        message: `Venus in Scorpio wants intensity. Surface-level won't satisfy — dive into what you truly desire.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'challenging',
      },
      Sagittarius: {
        emoji: '🏹',
        headline: 'Freedom in Love',
        message: `Venus in Sagittarius needs adventure. Plan something spontaneous with someone you love.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Capricorn: {
        emoji: '🏔️',
        headline: 'Committed Love',
        message: `Venus in Capricorn values loyalty. Long-term investments in relationships pay off now.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'neutral',
      },
      Aquarius: {
        emoji: '🌟',
        headline: 'Unconventional Connection',
        message: `Venus in Aquarius celebrates unique bonds. The friend who gets your weirdness? That's love.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
      Pisces: {
        emoji: '🌊',
        headline: 'Boundless Compassion',
        message: `Venus in Pisces dissolves barriers. Feel everything deeply today — your sensitivity is your superpower.`,
        transit: `Venus in ${venus.sign}`,
        energy: 'positive',
      },
    };
    
    if (venus.sign && venusInsights[venus.sign]) {
      insights.push(venusInsights[venus.sign]);
    }
  }

  // Mars insights (energy, action, drive)
  if (mars) {
    insights.push({
      emoji: '🔥',
      headline: `${mars.sign} Fire Within`,
      message: `Mars in ${mars.sign} energizes your actions. Channel this drive into something meaningful — don't let it burn aimlessly.`,
      transit: `Mars in ${mars.sign}`,
      energy: mars.sign === 'Aries' || mars.sign === 'Scorpio' ? 'positive' : 'neutral',
    });
  }

  // Moon phase insights
  if (moonPhase.daysUntilFullMoon <= 2) {
    insights.unshift({
      emoji: '🌕',
      headline: 'Full Moon Illumination',
      message: `The Full Moon in ${moonPhase.moonSign} reveals hidden truths. What's been growing in the shadows is ready to be seen.`,
      transit: `Full Moon in ${moonPhase.moonSign}`,
      energy: 'positive',
    });
  } else if (moonPhase.daysUntilNewMoon <= 2) {
    insights.unshift({
      emoji: '🌑',
      headline: 'New Moon New Beginnings',
      message: `The New Moon in ${moonPhase.moonSign} invites fresh starts. Plant a seed of intention — the universe is listening.`,
      transit: `New Moon in ${moonPhase.moonSign}`,
      energy: 'positive',
    });
  }

  // Return the most significant insight (first in priority)
  return insights[0] || {
    emoji: '✨',
    headline: 'Cosmic Alignment',
    message: `The stars are with you today, ${userName || 'cosmic soul'}. Trust your instincts and move with confidence.`,
    transit: `Moon in ${moonPhase.moonSign}`,
    energy: 'positive',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OneInsightCardProps {
  onPress?: () => void;
}

export default function OneInsightCard({ onPress }: OneInsightCardProps) {
  const { data } = useOnboardingStore();
  const { incrementProgress } = useAchievementStore();
  const viewShotRef = React.useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  const insight = useMemo(() => {
    try {
      return generateDailyInsight(data.sunSign, data.moonSign, data.risingSign, data.name);
    } catch (e) {
      console.warn('[OneInsight] generateDailyInsight failed:', e);
      // Complete fallback with ALL required properties
      return {
        emoji: '✨',
        headline: 'Your Cosmic Reading',
        message: `The stars align in your favor today, ${data.name || 'cosmic traveler'}. Trust your intuition.`,
        transit: 'Moon in harmony',
        energy: 'positive' as const,
      };
    }
  }, [data.sunSign, data.moonSign, data.risingSign, data.name]);

  // Animations
  const glowPulse = useSharedValue(0.4);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    
    return () => {
      cancelAnimation(glowPulse);
      cancelAnimation(shimmer);
    };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
    transform: [{ scale: 1 + glowPulse.value * 0.02 }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-200, SCREEN_WIDTH + 200]) }],
  }));

  const energyColors = {
    positive: ['#059669', '#10B981', '#34D399'],
    neutral: ['#6366F1', '#818CF8', '#A5B4FC'],
    challenging: ['#DC2626', '#EF4444', '#F87171'],
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Capture the card as an image
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1,
        });

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your cosmic insight',
          });
          incrementProgress('cosmic_sharer');
        } else {
          // Fallback to text share
          await Share.share({
            message: `${insight.emoji} ${insight.headline}\n\n${insight.message}\n\n— via VEYa ✨`,
          });
          incrementProgress('cosmic_sharer');
        }
      }
    } catch (error) {
      console.warn('[Share] Failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Animated.View entering={FadeInUp.duration(800).delay(200)}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <Pressable onPress={handlePress} style={styles.container}>
          <LinearGradient
            colors={['#1B0B38', '#2D1B4E', '#1B0B38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Background glow */}
            <Animated.View style={[styles.glowOrb, glowStyle]}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.4)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </Animated.View>

            {/* Shimmer effect */}
            <View style={styles.shimmerContainer}>
              <Animated.View style={[styles.shimmer, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 100, height: '100%' }}
                />
              </Animated.View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Date */}
              <Text style={styles.date}>{dateString}</Text>

              {/* Emoji */}
              <Animated.Text 
                entering={FadeIn.duration(600).delay(400)}
                style={styles.emoji}
              >
                {insight.emoji}
              </Animated.Text>

              {/* Headline */}
              <Animated.Text 
                entering={FadeIn.duration(600).delay(500)}
                style={styles.headline}
              >
                {insight.headline}
              </Animated.Text>

              {/* Message */}
              <Animated.Text 
                entering={FadeIn.duration(600).delay(600)}
                style={styles.message}
              >
                {insight.message}
              </Animated.Text>

              {/* Transit badge */}
              <Animated.View 
                entering={FadeIn.duration(400).delay(700)}
                style={styles.transitBadge}
              >
                <View style={[styles.energyDot, { backgroundColor: energyColors[insight.energy][1] }]} />
                <Text style={styles.transitText}>{insight.transit}</Text>
              </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.brandingRow}>
                <Text style={styles.branding}>VEYa</Text>
                <Text style={styles.brandingDot}>·</Text>
                <Text style={styles.brandingTagline}>Your Cosmic Companion</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </ViewShot>

      {/* Share button (outside ViewShot so it doesn't appear in screenshot) */}
      <Pressable 
        onPress={handleShare} 
        style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
        disabled={isSharing}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          style={styles.shareGradient}
        >
          <Text style={styles.shareText}>
            {isSharing ? 'Sharing...' : 'Share ✨'}
          </Text>
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
    marginBottom: spacing.sm,
  },
  cardGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
    minHeight: 280,
    justifyContent: 'space-between',
  },
  glowOrb: {
    position: 'absolute',
    top: -100,
    left: '25%',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  date: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontFamily: typography.fonts.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  transitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  energyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  transitText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branding: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 14,
    color: 'rgba(212, 165, 71, 0.8)',
    letterSpacing: 2,
  },
  brandingDot: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.xs,
  },
  brandingTagline: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  shareButton: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  shareText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
