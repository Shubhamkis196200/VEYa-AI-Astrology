/**
 * VEYa — Screen 02: Name Input
 * 
 * UNIFIED LIGHT THEME VERSION
 * Uses design system for consistency across all screens.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme/design-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 10;
const CURRENT_STEP = 1;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────
// DECORATIVE STAR
// ─────────────────────────────────────────────────────────────

function DecorativeStar() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.1, { duration: 2000 }),
      withTiming(1, { duration: 2000 })
    );
    rotation.value = withTiming(360, { duration: 20000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.starContainer, animatedStyle]}>
      <Svg width={40} height={40} viewBox="0 0 24 24">
        <Path
          d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
          fill={colors.accentGold}
        />
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRESS DOTS
// ─────────────────────────────────────────────────────────────

function ProgressDots() {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index < CURRENT_STEP && styles.progressDotCompleted,
            index === CURRENT_STEP && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function NameScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { setData } = useOnboardingStore();

  const isValid = name.trim().length >= 2;
  const buttonScale = useSharedValue(1);

  const handleContinue = () => {
    if (!isValid) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setData({ name: name.trim() });
    router.push('/(auth)/onboarding/birth-date');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: isValid ? 1 : 0.5,
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M15 18L9 12L15 6"
              stroke={colors.textPrimary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Pressable>
        <ProgressDots />
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Star Decoration */}
        <Animated.View entering={FadeIn.delay(200).duration(800)}>
          <DecorativeStar />
        </Animated.View>

        {/* Title */}
        <Animated.Text 
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.title}
        >
          What should we{'\n'}call you?
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text 
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.subtitle}
        >
          Whisper your name to the night — we'll{'\n'}weave it through your stars
        </Animated.Text>

        {/* Input */}
        <Animated.View 
          entering={FadeInDown.delay(500).duration(600)}
          style={styles.inputContainer}
        >
          <TextInput
            ref={inputRef}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.inputPlaceholder}
            style={[
              styles.input,
              isFocused && styles.inputFocused,
            ]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="words"
            autoComplete="given-name"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(600)}
          style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}
        >
          <AnimatedPressable
            onPress={handleContinue}
            disabled={!isValid}
            style={[styles.button, buttonAnimatedStyle]}
            onPressIn={() => {
              buttonScale.value = withTiming(0.97, { duration: 100 });
            }}
            onPressOut={() => {
              buttonScale.value = withTiming(1, { duration: 100 });
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </AnimatedPressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.accentGold,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  starContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display1,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.display1 * 1.2,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.5,
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.heading1,
    fontFamily: typography.fonts.bodyMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  inputFocused: {
    borderColor: colors.accentGold,
    borderWidth: 2,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textOnPrimary,
  },
});
