/**
 * VEYa — Screen 01: Welcome Portal
 * 
 * The first screen users see. Creates instant emotional connection,
 * communicates premium positioning, and invites the user to begin.
 * 
 * Design direction: Luxury journal opening · Glossier meets celestial · 
 * Warm cream with soft cosmic accents · Typography-led, breathing space
 * 
 * @module screens/welcome
 * @version 1.0.0
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  Line,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { 
  colors as themeColors, 
  typography as themeTypography, 
  spacing as themeSpacing, 
  borderRadius as themeBorderRadius,
  shadows as themeShadows 
} from '@/theme/design-system';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (Extended from design-system.ts)
// ─────────────────────────────────────────────────────────────

const colors = {
  ...themeColors,
  overlay: 'rgba(26, 26, 46, 0.7)',
} as const;

const typography = {
  fonts: themeTypography.fonts,
  sizes: {
    display1: themeTypography.sizes.display1,
    display2: themeTypography.sizes.display2,
    heading1: 26,
    body: themeTypography.sizes.body,
    bodySmall: themeTypography.sizes.bodySmall,
    caption: themeTypography.sizes.caption,
    tiny: themeTypography.sizes.tiny,
  },
} as const;

const spacing = {
  ...themeSpacing,
  xxxl: 64,
} as const;

const borderRadius = themeBorderRadius;

const shadows = {
  ...themeShadows,
  subtle: {
    shadowColor: '#D4A547',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// DIMENSIONS
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);
const AnimatedSvgG = Animated.createAnimatedComponent(G);

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES
// Gentle floating particles that create a "luxury stardust" feel.
// Each particle has its own orbit, opacity cycle, and size.
// Uses SVG for crisp rendering at any density.
// ─────────────────────────────────────────────────────────────

interface ParticleConfig {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  color: string;
}

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  const goldTones = [
    'rgba(212, 165, 71, 0.6)',   // Warm gold
    'rgba(212, 165, 71, 0.35)',  // Soft gold
    'rgba(139, 92, 246, 0.25)',  // Whisper purple
    'rgba(232, 120, 138, 0.2)',  // Blush rose
    'rgba(212, 165, 71, 0.45)', // Medium gold
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * SCREEN_HEIGHT,
      r: Math.random() * 2.5 + 0.5,  // 0.5–3px radius
      opacity: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 4000,
      duration: Math.random() * 6000 + 5000, // 5–11s
      driftX: (Math.random() - 0.5) * 30,
      driftY: (Math.random() - 0.5) * 40,
      color: goldTones[Math.floor(Math.random() * goldTones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(28);

/**
 * A single floating stardust particle with gentle drift animation.
 * Uses Reanimated shared values for smooth 60fps animation.
 */
function StardustParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Gentle horizontal drift
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftX, {
            duration: config.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-config.driftX * 0.7, {
            duration: config.duration * 0.8,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1, // infinite
        true  // reverse
      )
    );

    // Gentle vertical drift
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, {
            duration: config.duration * 1.1,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-config.driftY * 0.6, {
            duration: config.duration * 0.9,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    // Fade in/out breathing
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.opacity, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(config.opacity * 0.2, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.cx,
          top: config.cy,
          width: config.r * 2,
          height: config.r * 2,
          borderRadius: config.r,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// COSMIC ILLUSTRATION
// A minimal watercolor-style celestial illustration using SVG.
// Renders a soft constellation pattern with gentle connecting lines
// and a radial glow at center — all in warm light-theme tones.
// ─────────────────────────────────────────────────────────────

function CosmicIllustration() {
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    rotateValue.value = withRepeat(
      withTiming(360, {
        duration: 120000, // 2 minutes per rotation — very slow
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedRotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  // Star positions for a gentle constellation pattern
  const stars = [
    { x: 140, y: 80, r: 3 },
    { x: 200, y: 50, r: 2 },
    { x: 180, y: 130, r: 2.5 },
    { x: 100, y: 120, r: 2 },
    { x: 160, y: 160, r: 3.5 },
    { x: 220, y: 140, r: 2 },
    { x: 120, y: 180, r: 1.5 },
    { x: 250, y: 100, r: 1.5 },
    { x: 80, y: 60, r: 1.5 },
    { x: 240, y: 180, r: 2 },
  ];

  // Connecting lines between certain stars (constellation pattern)
  const connections = [
    [0, 1], [0, 3], [0, 4], [1, 5],
    [2, 4], [3, 6], [4, 5], [5, 9],
    [7, 1], [8, 3],
  ];

  return (
    <Animated.View style={[styles.illustrationContainer, animatedRotation]}>
      <Svg
        width={320}
        height={240}
        viewBox="0 0 320 240"
      >
        <Defs>
          <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.15" />
            <Stop offset="60%" stopColor={colors.accentGold} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Soft radial glow at center */}
        <Circle cx="160" cy="120" r="100" fill="url(#centerGlow)" />

        {/* Constellation connecting lines */}
        {connections.map(([a, b], i) => (
          <Line
            key={`line-${i}`}
            x1={stars[a].x}
            y1={stars[a].y}
            x2={stars[b].x}
            y2={stars[b].y}
            stroke={colors.accentGold}
            strokeWidth={0.5}
            strokeOpacity={0.3}
          />
        ))}

        {/* Star points */}
        {stars.map((star, i) => (
          <G key={`star-${i}`}>
            {/* Outer glow */}
            <Circle
              cx={star.x}
              cy={star.y}
              r={star.r * 3}
              fill={colors.accentGold}
              opacity={0.08}
            />
            {/* Star core */}
            <Circle
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill={colors.accentGold}
              opacity={0.5}
            />
          </G>
        ))}

        {/* Decorative crescent moon (top-right area) */}
        <Path
          d="M230 30 A 18 18 0 1 1 230 66 A 14 14 0 1 0 230 30"
          fill={colors.accentGold}
          opacity={0.2}
        />

        {/* Small decorative star burst */}
        <G opacity={0.25}>
          <Line x1="70" y1="190" x2="70" y2="210" stroke={colors.accentGold} strokeWidth={1} />
          <Line x1="60" y1="200" x2="80" y2="200" stroke={colors.accentGold} strokeWidth={1} />
          <Line x1="63" y1="193" x2="77" y2="207" stroke={colors.accentGold} strokeWidth={0.5} />
          <Line x1="77" y1="193" x2="63" y2="207" stroke={colors.accentGold} strokeWidth={0.5} />
        </G>
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: WelcomeScreen
// ─────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const buttonScale = useSharedValue(1);

  // ── Button press animation ──
  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
  };

  const handleBeginJourney = async () => {
    // Haptic feedback on CTA press
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(auth)/onboarding/name');
  };

  const handleSignIn = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to sign-in flow
    router.push('/(auth)/sign-in' as any);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={['#FDFBF7', '#F8F4EC', '#F5F0E8']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Stardust particle layer ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <StardustParticle key={i} config={p} />
        ))}
      </View>

      {/* ── Main content ── */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xxl,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {/* ── Upper spacer (pushes content to golden ratio) ── */}
        <View style={styles.topSpacer} />

        {/* ── Cosmic illustration ── */}
        <Animated.View
          entering={FadeIn.duration(1200).delay(200).easing(Easing.out(Easing.ease))}
        >
          <CosmicIllustration />
        </Animated.View>

        {/* ── Brand wordmark ── */}
        <Animated.Text
          entering={FadeInDown.duration(800).delay(600).easing(Easing.out(Easing.ease))}
          style={styles.logo}
          accessibilityRole="header"
          accessibilityLabel="VEYa"
        >
          VEYa
        </Animated.Text>

        {/* ── Tagline ── */}
        <Animated.Text
          entering={FadeInDown.duration(700).delay(900).easing(Easing.out(Easing.ease))}
          style={styles.tagline}
          accessibilityLabel="Your AI Astrologer Who Truly Knows You"
        >
          Your AI Astrologer{'\n'}Who Truly Knows You
        </Animated.Text>

        {/* ── Flexible space ── */}
        <View style={styles.middleSpacer} />

        {/* ── CTA Button: Begin Your Journey ── */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(1300).easing(Easing.out(Easing.ease))}
        >
          <AnimatedPressable
            onPress={handleBeginJourney}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.ctaButton, buttonAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel="Begin Your Journey"
            accessibilityHint="Starts the onboarding process to set up your cosmic profile"
          >
            <Text style={styles.ctaText}>Begin Your Journey</Text>
          </AnimatedPressable>
        </Animated.View>

        {/* ── Sign In link ── */}
        <Animated.View
          entering={FadeIn.duration(500).delay(1600).easing(Easing.out(Easing.ease))}
        >
          <Pressable
            onPress={handleSignIn}
            style={styles.signInContainer}
            hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Sign In"
          >
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Pushes content down to roughly the upper third / golden ratio zone
  topSpacer: {
    flex: 0.15,
  },

  illustrationContainer: {
    width: 320,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  // ── Logo ──
  logo: {
    fontFamily: typography.fonts.display,
    fontSize: 52,
    color: colors.textPrimary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    // Subtle text shadow for depth
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(212, 165, 71, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
      android: {},
    }),
  },

  // ── Tagline ──
  tagline: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.6,
    letterSpacing: 0.3,
    maxWidth: 260,
  },

  // Pushes CTA toward the bottom
  middleSpacer: {
    flex: 1,
    minHeight: spacing.xxl,
  },

  // ── CTA Button ──
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.sm,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    // Warm glow shadow
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  ctaText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Sign In ──
  signInContainer: {
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },

  signInText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
  },

  signInLink: {
    fontFamily: typography.fonts.bodyMedium,
    color: colors.primary,
  },
});
