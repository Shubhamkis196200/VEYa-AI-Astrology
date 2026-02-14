/**
 * VEYa — Screen 05: Birth Place (Location Search)
 *
 * Collects the user's birth location via an elegant search-with-autocomplete UI.
 * Latitude/longitude from the selected city are critical for accurate house
 * placements and Rising sign calculation.
 *
 * Design features:
 *   - Premium search input with gold search icon
 *   - Autocomplete dropdown with soft shadow, rounded corners, slide-down reveal
 *   - Each suggestion shows a warm-gold map pin + city/country text
 *   - Once selected, the input transforms to a confirmed-selection chip
 *   - Subtle abstract globe SVG illustration as background decoration
 *   - Progress 5/8 dots
 *
 * Design direction: Luxury light theme · Cream background · Playfair + Inter ·
 * Warm gold accents · Generous negative space · Consistent with Screens 01–04
 *
 * @module screens/onboarding/birth-place
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  Keyboard,
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
  withSpring,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInDown,
  Layout,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  Line,
  Ellipse,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (identical to Screens 01–04)
// ─────────────────────────────────────────────────────────────

const colors = {
  background: '#FDFBF7',
  surface: '#F5F0E8',
  surfaceAlt: '#EDE7DB',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9B9BAD',
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#EDE9FE',
  accentGold: '#D4A547',
  accentGoldLight: '#FDF4E3',
  accentRose: '#E8788A',
  overlay: 'rgba(26, 26, 46, 0.7)',
  error: '#D4564E',
  inputBorder: '#DDD8CE',
  inputBorderFocused: '#D4A547',
  disabled: '#C5C0B6',
  border: '#E5DFD5',
  white: '#FFFFFF',
  dropdownShadow: 'rgba(26, 26, 46, 0.08)',
} as const;

const typography = {
  fonts: {
    display: 'PlayfairDisplay-Bold',
    displaySemiBold: 'PlayfairDisplay-SemiBold',
    displayRegular: 'PlayfairDisplay-Regular',
    displayItalic: 'PlayfairDisplay-Italic',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
  },
  sizes: {
    display1: 34,
    display2: 28,
    heading1: 26,
    heading2: 22,
    body: 16,
    bodySmall: 14,
    caption: 13,
    tiny: 11,
  },
} as const;

const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// DIMENSIONS & CONSTANTS
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 10;
const CURRENT_STEP = 4; // 0-indexed: step 4 of 8 (5th dot)

// ─────────────────────────────────────────────────────────────
// MOCK AUTOCOMPLETE DATA
// Simulates city search results for the design.
// In production, this would come from Google Places or a geocoding API.
// ─────────────────────────────────────────────────────────────

interface CityResult {
  id: string;
  city: string;
  region: string;
  country: string;
  /** ISO 2-letter country code, used to display flag emoji */
  countryCode: string;
}

const MOCK_RESULTS: Record<string, CityResult[]> = {
  lon: [
    { id: '1', city: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB' },
    { id: '2', city: 'Long Beach', region: 'California', country: 'United States', countryCode: 'US' },
    { id: '3', city: 'Londrina', region: 'Paraná', country: 'Brazil', countryCode: 'BR' },
  ],
  new: [
    { id: '4', city: 'New York', region: 'New York', country: 'United States', countryCode: 'US' },
    { id: '5', city: 'New Delhi', region: 'Delhi', country: 'India', countryCode: 'IN' },
    { id: '6', city: 'New Orleans', region: 'Louisiana', country: 'United States', countryCode: 'US' },
    { id: '7', city: 'Newcastle', region: 'England', country: 'United Kingdom', countryCode: 'GB' },
  ],
  par: [
    { id: '8', city: 'Paris', region: 'Île-de-France', country: 'France', countryCode: 'FR' },
    { id: '9', city: 'Paraná', region: 'Entre Ríos', country: 'Argentina', countryCode: 'AR' },
  ],
  tok: [
    { id: '10', city: 'Tokyo', region: 'Tokyo', country: 'Japan', countryCode: 'JP' },
  ],
  los: [
    { id: '11', city: 'Los Angeles', region: 'California', country: 'United States', countryCode: 'US' },
    { id: '12', city: 'Los Cabos', region: 'Baja California Sur', country: 'Mexico', countryCode: 'MX' },
  ],
};

/**
 * Mock search function — matches input prefix against known entries.
 * Returns results with a small simulated delay for realism.
 */
function mockSearch(query: string): CityResult[] {
  if (query.length < 2) return [];
  const lower = query.toLowerCase().trim();
  for (const prefix of Object.keys(MOCK_RESULTS)) {
    if (lower.startsWith(prefix)) {
      return MOCK_RESULTS[prefix];
    }
  }
  return [];
}

/**
 * Convert ISO 3166-1 alpha-2 code to flag emoji.
 */
function countryCodeToFlag(code: string): string {
  const base = 0x1f1e6 - 65; // 'A' = 65
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((c) => c.charCodeAt(0) + base)
  );
}

// ─────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES (consistent with Screens 01–04)
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
    'rgba(212, 165, 71, 0.5)',
    'rgba(212, 165, 71, 0.3)',
    'rgba(139, 92, 246, 0.15)',
    'rgba(232, 120, 138, 0.15)',
    'rgba(212, 165, 71, 0.4)',
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * SCREEN_HEIGHT,
      r: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      delay: Math.random() * 4000,
      duration: Math.random() * 6000 + 5000,
      driftX: (Math.random() - 0.5) * 25,
      driftY: (Math.random() - 0.5) * 30,
      color: goldTones[Math.floor(Math.random() * goldTones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(14);

function StardustParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
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
        -1,
        true
      )
    );

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
// PROGRESS INDICATOR (identical to Screens 01–04)
// ─────────────────────────────────────────────────────────────

function ProgressDots({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(200)}
      style={styles.progressContainer}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isPast = index < currentStep;
        return (
          <View
            key={index}
            style={[
              styles.progressDot,
              isActive && styles.progressDotActive,
              isPast && styles.progressDotPast,
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// BACK BUTTON (identical to Screens 01–04)
// ─────────────────────────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the birth time screen"
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M15 19l-7-7 7-7"
          stroke={colors.textSecondary}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────────

/** Search/magnifying glass icon for the input */
function SearchIcon({ color = colors.textMuted, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle
        cx="8.5"
        cy="8.5"
        r="6"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      <Line
        x1="13"
        y1="13"
        x2="18"
        y2="18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Map pin icon — warm gold, used in results and selected state */
function MapPinIcon({ color = colors.accentGold, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      {/* Pin body */}
      <Path
        d="M9 1C5.7 1 3 3.7 3 7C3 11.25 9 17 9 17C9 17 15 11.25 15 7C15 3.7 12.3 1 9 1Z"
        stroke={color}
        strokeWidth={1.3}
        fill="none"
      />
      {/* Inner circle */}
      <Circle
        cx="9"
        cy="7"
        r="2.5"
        stroke={color}
        strokeWidth={1.2}
        fill={color}
        opacity={0.2}
      />
      <Circle
        cx="9"
        cy="7"
        r="1"
        fill={color}
      />
    </Svg>
  );
}

/** Clear/dismiss icon for selected location chip */
function CloseIcon({ color = colors.textMuted, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Line x1="4" y1="4" x2="12" y2="12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="12" y1="4" x2="4" y2="12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// ABSTRACT GLOBE BACKGROUND ILLUSTRATION
// A very subtle, minimal globe/meridian illustration that sits
// behind the main content. Rendered in ultra-low opacity so it
// acts as texture rather than competing with the UI.
// ─────────────────────────────────────────────────────────────

function GlobeIllustration() {
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    rotateValue.value = withRepeat(
      withTiming(360, {
        duration: 180000, // 3 minutes per rotation — glacially slow
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedRotation = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  return (
    <Animated.View
      style={[styles.globeContainer, animatedRotation]}
      pointerEvents="none"
    >
      <Svg width={280} height={280} viewBox="0 0 280 280">
        <Defs>
          <RadialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.08" />
            <Stop offset="70%" stopColor={colors.accentGold} stopOpacity="0.03" />
            <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Soft radial glow */}
        <Circle cx="140" cy="140" r="130" fill="url(#globeGlow)" />

        {/* Globe outline */}
        <Circle
          cx="140"
          cy="140"
          r="90"
          stroke={colors.accentGold}
          strokeWidth={0.6}
          fill="none"
          opacity={0.12}
        />

        {/* Equator */}
        <Ellipse
          cx="140"
          cy="140"
          rx="90"
          ry="30"
          stroke={colors.accentGold}
          strokeWidth={0.5}
          fill="none"
          opacity={0.1}
        />

        {/* Latitude lines */}
        <Ellipse
          cx="140"
          cy="110"
          rx="75"
          ry="20"
          stroke={colors.accentGold}
          strokeWidth={0.4}
          fill="none"
          opacity={0.08}
        />
        <Ellipse
          cx="140"
          cy="170"
          rx="75"
          ry="20"
          stroke={colors.accentGold}
          strokeWidth={0.4}
          fill="none"
          opacity={0.08}
        />

        {/* Vertical meridians */}
        <Ellipse
          cx="140"
          cy="140"
          rx="30"
          ry="90"
          stroke={colors.accentGold}
          strokeWidth={0.5}
          fill="none"
          opacity={0.1}
        />
        <Ellipse
          cx="140"
          cy="140"
          rx="60"
          ry="90"
          stroke={colors.accentGold}
          strokeWidth={0.4}
          fill="none"
          opacity={0.08}
        />

        {/* Small decorative stars/dots around the globe */}
        {[
          { cx: 50, cy: 60, r: 1.5 },
          { cx: 230, cy: 80, r: 1.2 },
          { cx: 60, cy: 220, r: 1 },
          { cx: 220, cy: 210, r: 1.5 },
          { cx: 140, cy: 30, r: 1.2 },
          { cx: 35, cy: 140, r: 0.8 },
          { cx: 245, cy: 140, r: 1 },
        ].map((dot, i) => (
          <G key={`dot-${i}`}>
            <Circle
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r * 3}
              fill={colors.accentGold}
              opacity={0.05}
            />
            <Circle
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={colors.accentGold}
              opacity={0.15}
            />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTOCOMPLETE RESULT ROW
// Each row shows: [MapPin] City, Region — Country [Flag]
// Tap to select. Subtle highlight on press.
// ─────────────────────────────────────────────────────────────

interface ResultRowProps {
  result: CityResult;
  onSelect: (result: CityResult) => void;
  index: number;
}

function ResultRow({ result, onSelect, index }: ResultRowProps) {
  const scaleValue = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const handlePressIn = () => {
    scaleValue.value = withTiming(0.98, { duration: 80 });
    bgOpacity.value = withTiming(1, { duration: 80 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });
    bgOpacity.value = withTiming(0, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(212, 165, 71, ${bgOpacity.value * 0.06})`,
  }));

  const flag = countryCodeToFlag(result.countryCode);

  return (
    <Animated.View
      entering={FadeInDown.duration(300)
        .delay(index * 60)
        .easing(Easing.out(Easing.ease))}
    >
      <AnimatedPressable
        onPress={() => onSelect(result)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.resultRow, animatedStyle, bgStyle]}
        accessibilityRole="button"
        accessibilityLabel={`${result.city}, ${result.region}, ${result.country}`}
      >
        <View style={styles.resultPinContainer}>
          <MapPinIcon size={16} />
        </View>

        <View style={styles.resultTextContainer}>
          <Text style={styles.resultCity} numberOfLines={1}>
            {result.city}
            <Text style={styles.resultRegion}>, {result.region}</Text>
          </Text>
          <Text style={styles.resultCountry} numberOfLines={1}>
            {result.country}
          </Text>
        </View>

        <Text style={styles.resultFlag}>{flag}</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// SELECTED LOCATION CHIP
// Once a city is selected, the search input is replaced by an
// elegant chip showing the confirmed selection with a map pin,
// city name, and a dismiss (X) button to re-search.
// ─────────────────────────────────────────────────────────────

interface SelectedChipProps {
  result: CityResult;
  onClear: () => void;
}

function SelectedLocationChip({ result, onClear }: SelectedChipProps) {
  const flag = countryCodeToFlag(result.countryCode);

  return (
    <Animated.View
      entering={FadeIn.duration(400).easing(Easing.out(Easing.ease))}
      style={styles.selectedChipOuter}
    >
      <View style={styles.selectedChip}>
        {/* Gold pin icon */}
        <View style={styles.selectedPinContainer}>
          <MapPinIcon color={colors.accentGold} size={20} />
        </View>

        {/* City info */}
        <View style={styles.selectedTextContainer}>
          <Text style={styles.selectedCity} numberOfLines={1}>
            {result.city}, {result.region}
          </Text>
          <Text style={styles.selectedCountry} numberOfLines={1}>
            {flag} {result.country}
          </Text>
        </View>

        {/* Clear button */}
        <Pressable
          onPress={onClear}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Clear selection"
          accessibilityHint="Removes the selected city so you can search again"
        >
          <CloseIcon color={colors.textMuted} size={14} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: BirthPlaceScreen
// ─────────────────────────────────────────────────────────────

export default function BirthPlaceScreen() {
  const insets = useSafeAreaInsets();
  const { data, updateData, nextStep, completeOnboarding } = useOnboardingStore();
  const inputRef = useRef<TextInput>(null);

  // ── State ──
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // ── Derived ──
  const isValid = selectedCity !== null;
  const showDropdown = isFocused && results.length > 0 && !selectedCity;

  // ── Search effect ──
  useEffect(() => {
    if (selectedCity) {
      setResults([]);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      // Simulated debounce — in production, use a proper debounce + API call
      const timeout = setTimeout(() => {
        setResults(mockSearch(trimmed));
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
    }
  }, [query, selectedCity]);

  // ── Animation values ──
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0.4);
  const inputBorderColor = useSharedValue(0); // 0 = default, 1 = focused

  useEffect(() => {
    buttonOpacity.value = withTiming(isValid ? 1 : 0.4, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [isValid]);

  useEffect(() => {
    inputBorderColor.value = withTiming(isFocused ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [isFocused]);

  // ── Handlers ──
  const handleBack = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSelectCity = async (result: CityResult) => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();
    setSelectedCity(result);
    setQuery('');
    setResults([]);
  };

  const handleClearSelection = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCity(null);
    setQuery('');
    setResults([]);
    // Re-focus the input after clearing
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleContinue = async () => {
    if (!isValid || !selectedCity) return;

    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    updateData({
      birthPlace: `${selectedCity.city}, ${selectedCity.region}, ${selectedCity.country}`,
      // In production: latitude/longitude would come from geocoding API
    });

    nextStep();
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handlePressIn = () => {
    if (!isValid) return;
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

  // ── Animated styles ──
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
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

      {/* ── Abstract globe illustration (background) ── */}
      <GlobeIllustration />

      {/* ── Stardust particles ── */}
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
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {/* ── Header: Back + Progress ── */}
        <Animated.View
          entering={FadeIn.duration(500).delay(100)}
          style={styles.header}
        >
          <BackButton onPress={handleBack} />
          <ProgressDots currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Headline ── */}
          <Animated.Text
            entering={FadeInDown.duration(700).delay(300).easing(Easing.out(Easing.ease))}
            style={styles.headline}
            accessibilityRole="header"
          >
            Where were you born?
          </Animated.Text>

          {/* ── Subtext ── */}
          <Animated.Text
            entering={FadeInDown.duration(600).delay(500).easing(Easing.out(Easing.ease))}
            style={styles.subtext}
          >
            Your birth location fine-tunes your{'\n'}Rising sign and house placements
          </Animated.Text>

          {/* ── Search input OR selected chip ── */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(650).easing(Easing.out(Easing.ease))}
            style={styles.searchSection}
          >
            {selectedCity ? (
              <SelectedLocationChip
                result={selectedCity}
                onClear={handleClearSelection}
              />
            ) : (
              <View style={styles.searchInputContainer}>
                {/* Search icon */}
                <View style={styles.searchIconContainer}>
                  <SearchIcon
                    color={isFocused ? colors.accentGold : colors.textMuted}
                    size={20}
                  />
                </View>

                {/* Text input */}
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.searchInput,
                    isFocused && styles.searchInputFocused,
                  ]}
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    // Small delay so tap on result registers before blur hides dropdown
                    setTimeout(() => setIsFocused(false), 200);
                  }}
                  placeholder="Start typing your city..."
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="search"
                  accessibilityLabel="Search for your birth city"
                  accessibilityHint="Type a city name to see autocomplete suggestions"
                />
              </View>
            )}

            {/* ── Autocomplete dropdown ── */}
            {showDropdown && (
              <Animated.View
                entering={FadeInDown.duration(300).easing(Easing.out(Easing.ease))}
                exiting={FadeOut.duration(200)}
                style={styles.dropdown}
              >
                {results.map((result, index) => (
                  <React.Fragment key={result.id}>
                    {index > 0 && <View style={styles.dropdownDivider} />}
                    <ResultRow
                      result={result}
                      onSelect={handleSelectCity}
                      index={index}
                    />
                  </React.Fragment>
                ))}
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Helper text when no selection yet ── */}
          {!selectedCity && !showDropdown && query.length === 0 && (
            <Animated.View
              entering={FadeIn.duration(400).delay(800)}
              style={styles.helperContainer}
            >
              <View style={styles.helperIconRow}>
                <MapPinIcon color={colors.accentGold} size={22} />
              </View>
              <Text style={styles.helperText}>
                Search for the city where you were born.{'\n'}
                Even a nearby city works great.
              </Text>
            </Animated.View>
          )}

          {/* ── Confirmed selection display (extra detail below chip) ── */}
          {selectedCity && (
            <Animated.View
              entering={FadeInDown.duration(500).delay(200).easing(Easing.out(Easing.ease))}
              style={styles.confirmationContainer}
            >
              <LinearGradient
                colors={['#FDF4E3', '#FDEFD5']}
                style={styles.confirmationGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.confirmationEmoji}>📍</Text>
                <Text style={styles.confirmationTitle}>
                  {selectedCity.city}
                </Text>
                <Text style={styles.confirmationSubtitle}>
                  {selectedCity.region}, {selectedCity.country}
                </Text>
                <View style={styles.confirmationDivider} />
                <Text style={styles.confirmationNote}>
                  We'll use this location to calculate your precise house
                  placements and Rising sign.
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Bottom spacer for scroll ── */}
          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* ── Continue button (fixed at bottom) ── */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(900).easing(Easing.out(Easing.ease))}
          style={styles.ctaContainer}
        >
          <AnimatedPressable
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isValid}
            style={[styles.ctaButton, buttonAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityHint="Proceeds to the chart reveal screen"
            accessibilityState={{ disabled: !isValid }}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </AnimatedPressable>
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
    paddingHorizontal: spacing.lg,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    marginBottom: spacing.xs,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },

  headerSpacer: {
    width: 44,
  },

  // ── Progress Dots ──
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
  },

  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentGold,
    ...Platform.select({
      ios: {
        shadowColor: colors.accentGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },

  progressDotPast: {
    backgroundColor: colors.accentGold,
    opacity: 0.5,
  },

  // ── ScrollView ──
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },

  // ── Headline ──
  headline: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display2,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: typography.sizes.display2 * 1.25,
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(212, 165, 71, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
      android: {},
    }),
  },

  // ── Subtext ──
  subtext: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.bodySmall * 1.5,
    letterSpacing: 0.2,
    maxWidth: 300,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },

  // ── Globe illustration (background) ──
  globeContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.28,
    alignSelf: 'center',
    width: 280,
    height: 280,
    left: (SCREEN_WIDTH - 280) / 2,
    opacity: 0.6,
  },

  // ── Search Section ──
  searchSection: {
    position: 'relative',
    zIndex: 10,
    marginBottom: spacing.lg,
  },

  // ── Search Input ──
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(212, 165, 71, 0.15)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },

  searchIconContainer: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    paddingRight: spacing.md,
    height: 56,
    letterSpacing: 0.2,
  },

  searchInputFocused: {
    // The container handles the focused border; this is for the input itself
  },

  // ── Autocomplete Dropdown ──
  dropdown: {
    position: 'absolute',
    top: 60, // below the 56px input + 4px gap
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(26, 26, 46, 0.12)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },

  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // ── Result Row ──
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  resultPinContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentGoldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultTextContainer: {
    flex: 1,
  },

  resultCity: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },

  resultRegion: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
  },

  resultCountry: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    marginTop: 1,
    letterSpacing: 0.2,
  },

  resultFlag: {
    fontSize: 18,
    marginLeft: spacing.xs,
  },

  // ── Selected Location Chip ──
  selectedChipOuter: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accentGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },

  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.accentGold,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  selectedPinContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentGoldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedTextContainer: {
    flex: 1,
  },

  selectedCity: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },

  selectedCountry: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Helper text ──
  helperContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  helperIconRow: {
    marginBottom: spacing.sm,
    opacity: 0.7,
  },

  helperText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.caption * 1.6,
    letterSpacing: 0.2,
    maxWidth: 260,
  },

  // ── Confirmation Card (after selection) ──
  confirmationContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.accentGold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },

  confirmationGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },

  confirmationEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },

  confirmationTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },

  confirmationSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  confirmationDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 165, 71, 0.2)',
    width: '60%',
    marginVertical: spacing.md,
  },

  confirmationNote: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.caption * 1.5,
    letterSpacing: 0.1,
    maxWidth: 280,
  },

  // ── CTA Button (matches Screens 01–04 exactly) ──
  ctaContainer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.sm,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: 56,
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
});
