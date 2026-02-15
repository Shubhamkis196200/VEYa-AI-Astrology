/**
 * VEYa — Explore Tab: Discovery Hub 🔮
 *
 * The "deep dive" tab — birth chart, compatibility, tarot, moon tracker,
 * and transit calendar. Content-rich but organized and luxurious.
 *
 * Layout (top → bottom, scrollable):
 *   1. Header — "Explore" title with poetic subtext
 *   2. My Birth Chart Section ⭐ — Crown jewel, interactive chart preview
 *   3. Compatibility Section 💕 — Gradient card, two overlapping circles
 *   4. Tarot Section 🃏 — Daily card pull with luxury card back design
 *   5. Moon Tracker 🌙 — Realistic moon phase visualization
 *   6. Transit Calendar — Compact monthly view with colored dots
 *
 * Mock Data: Scorpio Sun, Pisces Moon, Leo Rising user named "Aria"
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// VoiceInterface is lazy-loaded below
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
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
  FadeInRight,
  SlideInRight,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  Line,
  Text as SvgText,
  LinearGradient as SvgLinearGradient,
  Rect,
} from 'react-native-svg';
// Haptics loaded dynamically (Expo Go safe)
async function hapticImpact(style: 'Light' | 'Medium' = 'Light') {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(
      style === 'Light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
  } catch {}
}
import AnimatedPressable from '@/components/ui/AnimatedPressable';
import CompatibilityModal from '@/components/shared/CompatibilityModal';
import SoulConnectionScreen from '@/components/social/SoulConnectionScreen';
import CosmicYearTimeline from '@/components/shared/CosmicYearTimeline';
import SoundscapePlayer from '@/components/shared/SoundscapePlayer';
import NatalChart, {
  ZODIAC_SIGNS,
  ELEMENT_COLORS,
  HOUSE_CUSPS,
  DEFAULT_PLANETS,
  polarToCartesian,
  type Planet,
} from '@/components/shared/NatalChart';
import MoonPhaseViz from '@/components/shared/MoonPhase';
import TarotCardBack from '@/components/shared/TarotCard';
import { getDailyCard, getSpreadCards, isCardReversed, type TarotCard } from '@/data/tarotDeck';
import {
  getMoonPhase,
  getCurrentTransits,
  getMonthEvents,
  getPlanetaryHours,
  getRetrogradeData,
  type MoonPhaseInfo,
  type PlanetPosition,
  type MonthEvent,
  type PlanetaryHoursData,
  type RetrogradeData,
} from '@/services/astroEngine';
import { generateTarotReading, chatWithVeya } from '@/services/ai';
import { router } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboardingStore';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (using theme)
// ─────────────────────────────────────────────────────────────

import { colors as themeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

// VoiceInterface loaded dynamically when needed

// Extended colors not in the base theme
const colors = {
  ...themeColors,
  accentGoldDim: 'rgba(212, 165, 71, 0.3)',
  cosmicPurple: '#8B5CF6',
  cosmicPurpleDim: 'rgba(139, 92, 246, 0.25)',
  cardBorder: 'rgba(212, 165, 71, 0.12)',
  cardShadow: 'rgba(139, 92, 246, 0.08)',
  tabInactive: '#B8B8C8',
  transitOpportunity: '#4A9D6E',
  transitChallenge: '#D4942C',
  transitTransformation: '#8B5CF6',
  moonSurface: '#E8E0D4',
  moonShadow: '#C4B8A8',
  moonHighlight: '#F5F0E8',
  tarotGold: '#C9A84C',
  tarotDeepPurple: '#F5F0E8',
  tarotMidPurple: '#4A2D6E',
  accentRoseLight: '#FFF0F3',
} as const;

// ─────────────────────────────────────────────────────────────
// DIMENSIONS
// ─────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = spacing.lg;

// ─────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const IS_WEB = Platform.OS === 'web';

// ─────────────────────────────────────────────────────────────
// HAPTIC HELPERS
// ─────────────────────────────────────────────────────────────

async function hapticLight() {
  if (Platform.OS !== 'web') {
    try { await hapticImpact('Light'); } catch {}
  }
}

async function hapticMedium() {
  if (Platform.OS !== 'web') {
    try { await hapticImpact('Medium'); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK = {
  userName: 'Aria',
  bigThree: [
    { symbol: '☉', sign: 'Scorpio', label: 'Sun' },
    { symbol: '☽', sign: 'Pisces', label: 'Moon' },
    { symbol: '↑', sign: 'Leo', label: 'Rising' },
  ],
  lastCompatibility: {
    partnerName: 'Marcus',
    overallScore: 82,
    date: 'Feb 10',
  },
  moonPhase: {
    name: 'Waxing Gibbous',
    sign: 'Gemini',
    illumination: 0.78,
    nextPhase: 'Full Moon in 3 days',
    weekPhases: [
      { day: 'M', phase: 0.65, label: 'Wax Gib' },
      { day: 'T', phase: 0.72, label: 'Wax Gib' },
      { day: 'W', phase: 0.78, label: 'Wax Gib' },
      { day: 'T', phase: 0.85, label: 'Wax Gib' },
      { day: 'F', phase: 0.92, label: 'Wax Gib' },
      { day: 'S', phase: 0.97, label: 'Full' },
      { day: 'S', phase: 1.0, label: 'Full' },
    ],
  },
  transitCalendar: {
    month: 'February 2026',
    days: Array.from({ length: 28 }, (_, i) => ({
      date: i + 1,
      transits: i === 2 ? ['opportunity'] :
                i === 7 ? ['challenge', 'opportunity'] :
                i === 12 ? ['transformation'] :
                i === 14 ? ['opportunity'] :
                i === 18 ? ['challenge'] :
                i === 21 ? ['transformation', 'opportunity'] :
                i === 25 ? ['opportunity'] :
                i === 27 ? ['challenge'] : [],
    })),
    selectedDay: {
      date: 14,
      transits: [
        { planet: 'Venus ♀ trine Jupiter ♃', type: 'opportunity', description: 'Expansion in love and creativity' },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────
// CHART DATA — imported from NatalChart component
// (ZODIAC_SIGNS, ELEMENT_COLORS, Planet, DEFAULT_PLANETS,
//  HOUSE_CUSPS, polarToCartesian are imported above)
// ─────────────────────────────────────────────────────────────

// Local alias for convenience
const PLANETS = DEFAULT_PLANETS;

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES
// ─────────────────────────────────────────────────────────────

interface ParticleConfig {
  cx: number; cy: number; r: number; opacity: number;
  delay: number; duration: number; driftX: number; driftY: number; color: string;
}

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  const tones = [
    'rgba(212, 165, 71, 0.3)', 'rgba(139, 92, 246, 0.15)',
    'rgba(212, 165, 71, 0.2)', 'rgba(196, 181, 224, 0.2)',
  ];
  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH, cy: Math.random() * 200,
      r: Math.random() * 1.6 + 0.4, opacity: Math.random() * 0.25 + 0.06,
      delay: Math.random() * 4000, duration: Math.random() * 8000 + 6000,
      driftX: (Math.random() - 0.5) * 18, driftY: (Math.random() - 0.5) * 12,
      color: tones[Math.floor(Math.random() * tones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(4); // Reduced from 10 to 4 for performance

function StardustParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(config.delay, withRepeat(
      withSequence(
        withTiming(config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(-config.driftX * 0.6, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.sin) })
      ), -1, true));
    translateY.value = withDelay(config.delay, withRepeat(
      withSequence(
        withTiming(config.driftY, { duration: config.duration * 1.1, easing: Easing.inOut(Easing.sin) }),
        withTiming(-config.driftY * 0.5, { duration: config.duration * 0.9, easing: Easing.inOut(Easing.sin) })
      ), -1, true));
    opacity.value = withDelay(config.delay, withRepeat(
      withSequence(
        withTiming(config.opacity, { duration: config.duration * 0.5 }),
        withTiming(config.opacity * 0.15, { duration: config.duration * 0.5 })
      ), -1, true));
    
    // CRITICAL: Cancel animations on unmount to prevent memory leaks and CPU drain
    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute', left: config.cx, top: config.cy,
        width: config.r * 2, height: config.r * 2,
        borderRadius: config.r, backgroundColor: config.color,
      }, animatedStyle]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: HEADER WITH FEATURE DISCOVERY
// ═══════════════════════════════════════════════════════════════

function ExploreHeader() {
  return (
    <Animated.View entering={FadeIn.duration(700).delay(100)} style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Discover</Text>
      <Text style={styles.headerSubtext}>Uncover your cosmic story</Text>
      
      {/* Feature Discovery Guide */}
      <View style={styles.featureGuide}>
        <Text style={styles.featureGuideTitle}>✨ Explore VEYa's Features</Text>
        <View style={styles.featureGuideGrid}>
          <View style={styles.featureGuideItem}>
            <Text style={styles.featureGuideEmoji}>⭐</Text>
            <Text style={styles.featureGuideLabel}>Birth Chart</Text>
          </View>
          <View style={styles.featureGuideItem}>
            <Text style={styles.featureGuideEmoji}>💕</Text>
            <Text style={styles.featureGuideLabel}>Compatibility</Text>
          </View>
          <View style={styles.featureGuideItem}>
            <Text style={styles.featureGuideEmoji}>🃏</Text>
            <Text style={styles.featureGuideLabel}>Tarot</Text>
          </View>
          <View style={styles.featureGuideItem}>
            <Text style={styles.featureGuideEmoji}>🌙</Text>
            <Text style={styles.featureGuideLabel}>Moon Tracker</Text>
          </View>
          <View style={styles.featureGuideItem}>
            <Text style={styles.featureGuideEmoji}>📅</Text>
            <Text style={styles.featureGuideLabel}>Transits</Text>
          </View>
          <View style={styles.featureGuideItem}>
            <Text style={styles.featureGuideEmoji}>🎵</Text>
            <Text style={styles.featureGuideLabel}>Soundscapes</Text>
          </View>
        </View>
        <Text style={styles.featureGuideHint}>Scroll down to explore each feature</Text>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: MY BIRTH CHART ⭐
// ═══════════════════════════════════════════════════════════════

const MINI_CHART_SIZE = Math.min(SCREEN_WIDTH - 80, 260);

function MiniNatalChart() {
  return (
    <NatalChart
      size={MINI_CHART_SIZE}
      breathe={true}
      showGlow={true}
    />
  );
}

function BigThreePills({ data }: { data: { name: string; sunSign?: string; moonSign?: string; risingSign?: string } }) {
  const bigThree = [
    { symbol: '☉', sign: data.sunSign || 'Unknown', label: 'Sun' },
    { symbol: '☽', sign: data.moonSign || 'Unknown', label: 'Moon' },
    { symbol: '↑', sign: data.risingSign || 'Unknown', label: 'Rising' },
  ];
  
  return (
    <View style={styles.bigThreePillsRow}>
      {bigThree.map((item, index) => (
        <Animated.View key={item.label} entering={FadeInUp.duration(400).delay(800 + index * 120)}>
          <View style={styles.bigThreePill}>
            <Text style={styles.bigThreePillSymbol}>{item.symbol}</Text>
            <Text style={styles.bigThreePillSign}>{item.sign}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function MyBirthChartSection() {
  const [showFullChart, setShowFullChart] = useState(false);
  const { data } = useOnboardingStore();

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>MY BIRTH CHART</Text>
      <Text style={styles.sectionTitle}>Your Cosmic Blueprint</Text>
      <Pressable onPress={() => { hapticMedium(); setShowFullChart(true); }} style={styles.chartCard}>
        <LinearGradient
          colors={['#FFFFFF', '#FDFBF7', '#FAF6EE']}
          style={styles.chartCardGradient}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        >
          <MiniNatalChart />
          <BigThreePills data={data} />
          <Animated.View entering={FadeIn.duration(400).delay(1200)} style={styles.viewFullChartRow}>
            <Text style={styles.viewFullChartText}>View Full Chart</Text>
            <Text style={styles.viewFullChartArrow}> →</Text>
          </Animated.View>
        </LinearGradient>
      </Pressable>
      <FullChartModal visible={showFullChart} onClose={() => setShowFullChart(false)} />
    </Animated.View>
  );
}

// ── Full Chart Modal ──

const FULL_CHART_SIZE = Math.min(SCREEN_WIDTH - 40, 360);
const FULL_CHART_CENTER = FULL_CHART_SIZE / 2;
const FULL_OUTER_RADIUS = FULL_CHART_SIZE / 2 - 8;
const FULL_ZODIAC_INNER = FULL_OUTER_RADIUS - 28;
const FULL_HOUSE_INNER = FULL_OUTER_RADIUS * 0.28;

function FullChartModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data } = useOnboardingStore();
  const userName = data.name || 'Your';
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [chartExplanation, setChartExplanation] = useState<string | null>(null);
  const [houseSystem, setHouseSystem] = useState<'placidus' | 'whole'>('placidus');

  const handleExplainChart = async () => {
    hapticMedium();
    setIsExplaining(true);
    try {
      const userProfile = {
        user_id: 'user-chart',
        name: data.name || 'Friend',
        sun_sign: data.sunSign || 'Aries',
        moon_sign: data.moonSign,
        rising_sign: data.risingSign,
      };
      const prompt = `Give me a brief, warm 2-3 sentence reading of my Big Three: ${data.sunSign || 'Unknown'} Sun, ${data.moonSign || 'Unknown'} Moon, ${data.risingSign || 'Unknown'} Rising. Speak like a wise friend, not a textbook. Be specific and personal.`;
      
      const response = await chatWithVeya(prompt, [], userProfile, [], false, false);
      setChartExplanation(response);
    } catch (error) {
      console.error('Error explaining chart:', error);
      setChartExplanation('Your cosmic blueprint shows a unique combination of energies. Tap "Chat" to ask VEYa specific questions about your placements.');
    } finally {
      setIsExplaining(false);
    }
  };

  const planetInterpretations: Record<string, string> = {
    'Sun': 'Your Scorpio Sun reveals an intense, magnetic soul that feels everything at full depth.',
    'Moon': 'Your Pisces Moon makes your emotional world a vast ocean — intuitive and boundlessly creative.',
    'Mercury': 'Mercury in Scorpio gives your mind laser-sharp perception. You see what others miss.',
    'Venus': 'Venus in Libra craves harmony in love. You seek beauty and balance in all relationships.',
    'Mars': 'Mars in Virgo channels your energy into precise, purposeful action.',
    'Jupiter': 'Jupiter in Taurus expands your sense of abundance through patience and sensory richness.',
    'Saturn': 'Saturn in Capricorn is in its home sign — remarkable discipline and long-term vision.',
    'Uranus': 'Uranus in Gemini electrifies your communication. Ideas ahead of their time.',
    'Neptune': 'Neptune in Pisces deepens your vast intuition. Dreams and reality blur beautifully.',
    'Pluto': 'Pluto in Aquarius transforms how you relate to community and collective ideals.',
  };

  const zodiacTicks = ZODIAC_SIGNS.map((sign, i) => {
    const outer = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, FULL_OUTER_RADIUS, sign.startDegree);
    const inner = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, FULL_ZODIAC_INNER, sign.startDegree);
    return (<Line key={`fzt-${i}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
      stroke={colors.accentGold} strokeWidth={0.8} opacity={0.6} />);
  });

  const zodiacSymbols = ZODIAC_SIGNS.map((sign, i) => {
    const midDeg = sign.startDegree + 15;
    const labelR = (FULL_OUTER_RADIUS + FULL_ZODIAC_INNER) / 2;
    const pos = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, labelR, midDeg);
    return (<SvgText key={`fzs-${i}`} x={pos.x} y={pos.y + 5} textAnchor="middle"
      fontSize={12} fill={ELEMENT_COLORS[sign.element]} fontWeight="400">{sign.symbol}</SvgText>);
  });

  const houseLines = HOUSE_CUSPS.map((cusp, i) => {
    const outer = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, FULL_ZODIAC_INNER, cusp);
    const inner = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, FULL_HOUSE_INNER, cusp);
    const isCardinal = i === 0 || i === 3 || i === 6 || i === 9;
    return (<Line key={`fh-${i}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
      stroke={isCardinal ? colors.accentGold : 'rgba(212, 165, 71, 0.4)'}
      strokeWidth={isCardinal ? 1 : 0.5} />);
  });

  const houseNumbers = HOUSE_CUSPS.map((cusp, i) => {
    const nextCusp = HOUSE_CUSPS[(i + 1) % 12];
    const midDeg = cusp + (((nextCusp - cusp + 360) % 360) / 2);
    const labelR = (FULL_ZODIAC_INNER + FULL_HOUSE_INNER) / 2;
    const pos = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, labelR, midDeg);
    return (<SvgText key={`fhn-${i}`} x={pos.x} y={pos.y + 3.5} textAnchor="middle"
      fontSize={8} fill={colors.textMuted} opacity={0.4}>{i + 1}</SvgText>);
  });

  const planetR = (FULL_ZODIAC_INNER + FULL_HOUSE_INNER) / 2 + 12;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.fullChartModal}>
        <LinearGradient colors={['#FDFBF7', '#FAF6EE', '#F5F0E8']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.fullChartHeader}>
          <View style={{ width: 44 }} />
          <Text style={styles.fullChartTitle}>{userName}'s Natal Chart</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.fullChartCloseBtn}>
            <Text style={styles.fullChartCloseText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.houseSystemToggle}>
          <Pressable 
            onPress={() => { hapticLight(); setHouseSystem('placidus'); }}
            style={[styles.houseSystemOption, houseSystem === 'placidus' && styles.houseSystemOptionActive]}
          >
            <Text style={[styles.houseSystemOptionText, houseSystem === 'placidus' && styles.houseSystemOptionTextActive]}>Placidus</Text>
          </Pressable>
          <Pressable 
            onPress={() => { hapticLight(); setHouseSystem('whole'); }}
            style={[styles.houseSystemOption, houseSystem === 'whole' && styles.houseSystemOptionActive]}
          >
            <Text style={[styles.houseSystemOptionText, houseSystem === 'whole' && styles.houseSystemOptionTextActive]}>Whole Sign</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.fullChartScrollContent}>
          <View style={styles.fullChartSvgContainer}>
            <Svg width={FULL_CHART_SIZE} height={FULL_CHART_SIZE}>
              <Defs>
                <RadialGradient id="fullChartGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.1" />
                  <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={FULL_CHART_CENTER} cy={FULL_CHART_CENTER} r={FULL_OUTER_RADIUS} fill="url(#fullChartGlow)" />
              <Circle cx={FULL_CHART_CENTER} cy={FULL_CHART_CENTER} r={FULL_OUTER_RADIUS}
                stroke={colors.accentGold} strokeWidth={1.2} fill="none" />
              <Circle cx={FULL_CHART_CENTER} cy={FULL_CHART_CENTER} r={FULL_ZODIAC_INNER}
                stroke={colors.accentGold} strokeWidth={0.6} fill="none" opacity={0.7} />
              <Circle cx={FULL_CHART_CENTER} cy={FULL_CHART_CENTER} r={FULL_HOUSE_INNER}
                stroke="rgba(212, 165, 71, 0.18)" strokeWidth={0.4} fill="none" />
              <Circle cx={FULL_CHART_CENTER} cy={FULL_CHART_CENTER} r={3} fill={colors.accentGold} opacity={0.4} />
              {zodiacTicks}
              {zodiacSymbols}
              {houseLines}
              {houseNumbers}
              {(() => {
                const ascPos = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, FULL_ZODIAC_INNER + 16, HOUSE_CUSPS[0]);
                const mcPos = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, FULL_ZODIAC_INNER + 16, HOUSE_CUSPS[9]);
                return (<>
                  <SvgText x={ascPos.x} y={ascPos.y + 3} textAnchor="middle"
                    fontSize={7} fill={colors.accentGold} fontWeight="600" letterSpacing={1}>ASC</SvgText>
                  <SvgText x={mcPos.x} y={mcPos.y + 3} textAnchor="middle"
                    fontSize={7} fill={colors.accentGold} fontWeight="600" letterSpacing={1}>MC</SvgText>
                </>);
              })()}
              {PLANETS.map((planet, i) => {
                const pos = polarToCartesian(FULL_CHART_CENTER, FULL_CHART_CENTER, planetR, planet.degree);
                const isSelected = selectedPlanet?.name === planet.name;
                return (
                  <G key={`fp-${i}`}>
                    <Circle cx={pos.x} cy={pos.y} r={planet.size + 3} fill={planet.glowColor} opacity={isSelected ? 1 : 0.7} />
                    <Circle cx={pos.x} cy={pos.y} r={planet.size + (isSelected ? 1.5 : 0)} fill={planet.color} />
                    <Circle cx={pos.x - 0.5} cy={pos.y - 0.5} r={planet.size * 0.35} fill="#FFFFFF" opacity={0.5} />
                    <Circle cx={pos.x} cy={pos.y} r={16} fill="transparent"
                      onPress={() => { hapticLight(); setSelectedPlanet(planet); }} />
                  </G>
                );
              })}
            </Svg>
          </View>
          {selectedPlanet && (
            <View style={styles.planetInfoCard}>
              <View style={styles.planetInfoHeader}>
                <View style={[styles.planetInfoDot, { backgroundColor: selectedPlanet.color }]} />
                <Text style={styles.planetInfoName}>{selectedPlanet.symbol} {selectedPlanet.name}</Text>
                <Text style={styles.planetInfoSign}>
                  in {ZODIAC_SIGNS[Math.floor(selectedPlanet.degree / 30)].name}
                </Text>
              </View>
              <Text style={styles.planetInfoText}>{planetInterpretations[selectedPlanet.name]}</Text>
            </View>
          )}
          {!selectedPlanet && (
            <Text style={styles.chartHintText}>Tap any planet to see its placement</Text>
          )}
          <Pressable onPress={handleExplainChart} disabled={isExplaining} style={styles.explainChartButton}>
            <LinearGradient colors={isExplaining ? [colors.textMuted, colors.textMuted] : [colors.primary, colors.primaryDark]}
              style={styles.explainChartGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.explainChartText}>{isExplaining ? '✨ Analyzing...' : '✨ Explain My Chart'}</Text>
            </LinearGradient>
          </Pressable>
          {chartExplanation && (
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 18, color: colors.textPrimary, marginBottom: 12 }}>
                Your Chart Reading ✨
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.textSecondary, lineHeight: 24 }}>
                {chartExplanation}
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: COMPATIBILITY 💕
// ═══════════════════════════════════════════════════════════════

function OverlappingChartsIllustration() {
  const size = 120;
  const center = size / 2;
  const r = 38;
  const offset = 18;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <SvgLinearGradient id="chartGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.accentRose} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.15" />
        </SvgLinearGradient>
        <SvgLinearGradient id="chartGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0.15" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={center - offset} cy={center} r={r} fill="url(#chartGrad1)"
        stroke={colors.accentRose} strokeWidth={1} opacity={0.8} />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        return (<Line key={`lc-${i}`}
          x1={center - offset + (r - 4) * Math.cos(angle)} y1={center + (r - 4) * Math.sin(angle)}
          x2={center - offset + r * Math.cos(angle)} y2={center + r * Math.sin(angle)}
          stroke={colors.accentRose} strokeWidth={0.6} opacity={0.5} />);
      })}
      <Circle cx={center + offset} cy={center} r={r} fill="url(#chartGrad2)"
        stroke={colors.primary} strokeWidth={1} opacity={0.8} />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        return (<Line key={`rc-${i}`}
          x1={center + offset + (r - 4) * Math.cos(angle)} y1={center + (r - 4) * Math.sin(angle)}
          x2={center + offset + r * Math.cos(angle)} y2={center + r * Math.sin(angle)}
          stroke={colors.primary} strokeWidth={0.6} opacity={0.5} />);
      })}
      <Line x1={center - offset} y1={center} x2={center + offset} y2={center}
        stroke={colors.accentGold} strokeWidth={0.8} strokeDasharray="3,3" opacity={0.5} />
      <SvgText x={center} y={center + 5} textAnchor="middle" fontSize={16} opacity={0.6}>💕</SvgText>
    </Svg>
  );
}

function CompatibilitySection({ onStart }: { onStart: () => void }) {
  const scale = useSharedValue(1);
  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 10, stiffness: 180 }); };
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>COMPATIBILITY</Text>
      <Text style={styles.sectionTitle}>Check Your Chemistry</Text>
      <AnimatedPressable onPressIn={handlePressIn} onPressOut={handlePressOut}
        onPress={() => hapticMedium()} style={[styles.compatCard, cardStyle]}>
        <LinearGradient colors={[colors.accentRose, colors.primary, colors.accentGold]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.compatGradientStrip} />
        <View style={styles.compatCardContent}>
          <View style={styles.compatTextArea}>
            <Text style={styles.compatCardTitle}>Check Your{'\n'}Compatibility</Text>
            <Text style={styles.compatCardHint}>Enter your partner's birth data</Text>
            <Pressable
              onPress={() => { hapticMedium(); onStart(); }}
              style={styles.compatStartButton}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]}
                style={styles.compatStartGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.compatStartText}>Start →</Text>
              </LinearGradient>
            </Pressable>
          </View>
          <View style={styles.compatIllustration}>
            <OverlappingChartsIllustration />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: TAROT 🃏
// ═══════════════════════════════════════════════════════════════

interface SpreadOption { name: string; cardCount: string; locked: boolean; }

const SPREADS: SpreadOption[] = [
  { name: 'Daily Pull', cardCount: '1 card', locked: false },
  { name: '3-Card Spread', cardCount: 'Past · Present · Future', locked: false },
  { name: 'Celtic Cross', cardCount: '10 cards', locked: false },
];

const SPREAD_LABELS = ['Past', 'Present', 'Future'];

function TarotFlipCard({
  card,
  revealProgress,
  onPress,
  width = 150,
  height = 230,
  showMeaning = false,
  reversed = false,
}: {
  card: TarotCard | null;
  revealProgress: SharedValue<number>;
  onPress?: () => void;
  width?: number;
  height?: number;
  showMeaning?: boolean;
  reversed?: boolean;
}) {
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(revealProgress.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: interpolate(revealProgress.value, [0, 0.4, 1], [1, 0.7, 0]),
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(revealProgress.value, [0, 1], [180, 360])}deg` },
    ],
    opacity: interpolate(revealProgress.value, [0, 0.5, 1], [0, 0.4, 1]),
  }));

  return (
    <View style={[styles.tarotFlipContainer, { width, height }]}>
      <Animated.View style={[styles.tarotFlipSide, backStyle]} pointerEvents={card ? 'none' : 'auto'}>
        <TarotCardBack width={width} height={height} onPress={onPress} />
      </Animated.View>
      <Animated.View style={[styles.tarotFlipSide, frontStyle]} pointerEvents="none">
        {card && (
          <View style={[
            styles.tarotRevealedCard,
            showMeaning ? styles.tarotRevealedCardFull : styles.tarotRevealedCardCompact,
            { width, height },
          ]}
          >
            <View style={styles.tarotRevealedHeader}>
              <Text style={styles.tarotCardEmoji}>{card.emoji}</Text>
              {reversed && <Text style={styles.tarotReversedLabel}>Reversed</Text>}
            </View>
            <Text style={styles.tarotCardName}>{card.name}</Text>
            {showMeaning && (
              <>
                <Text style={styles.tarotCardMeaning}>{card.upright}</Text>
                <View style={styles.tarotKeywordRow}>
                  {card.keywords.map((keyword) => (
                    <View key={keyword} style={styles.tarotKeywordTag}>
                      <Text style={styles.tarotKeywordText}>{keyword}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function TarotSection() {
  const [selectedSpread, setSelectedSpread] = useState(SPREADS[0].name);
  const [revealedCard, setRevealedCard] = useState<TarotCard | null>(null);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [spreadCards, setSpreadCards] = useState<TarotCard[]>([]);
  const onboardingData = useOnboardingStore((s) => s.data);

  const dailyFlip = useSharedValue(0);
  const spreadFlip1 = useSharedValue(0);
  const spreadFlip2 = useSharedValue(0);
  const spreadFlip3 = useSharedValue(0);

  const revealDailyCard = () => {
    hapticMedium();
    const card = getDailyCard();
    setRevealedCard(card);
    setIsCardRevealed(true);
    setAiReading(null);
    dailyFlip.value = 0;
    dailyFlip.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  };

  const handleGetAIReading = async () => {
    if (!revealedCard || isLoadingReading) return;
    hapticLight();
    setIsLoadingReading(true);
    try {
      const reversed = isCardReversed(revealedCard.id, 0);
      const userProfile = onboardingData?.sunSign ? {
        sun_sign: onboardingData.sunSign,
        moon_sign: onboardingData.moonSign,
        rising_sign: onboardingData.risingSign,
        name: onboardingData.name,
      } : undefined;
      
      const reading = await generateTarotReading(
        {
          name: revealedCard.name,
          arcana: revealedCard.arcana,
          keywords: revealedCard.keywords,
          upright: revealedCard.upright,
          reversed: revealedCard.reversed,
        },
        reversed,
        userProfile
      );
      setAiReading(reading);
    } catch (error) {
      console.warn('[Tarot] AI reading failed:', error);
      const reversed = isCardReversed(revealedCard.id, 0);
      const orientation = reversed ? 'reversed' : 'upright';
      setAiReading(`${revealedCard.name} (${orientation}): ${reversed ? revealedCard.reversed : revealedCard.upright}`);
    } finally {
      setIsLoadingReading(false);
    }
  };

  const dealSpread = () => {
    const cards = getSpreadCards(3);
    setSpreadCards(cards);
    spreadFlip1.value = 0;
    spreadFlip2.value = 0;
    spreadFlip3.value = 0;
    spreadFlip1.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    spreadFlip2.value = withDelay(180, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    spreadFlip3.value = withDelay(360, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  };

  const handleSpreadSelect = (spreadName: string) => {
    hapticLight();
    setSelectedSpread(spreadName);
    if (spreadName === '3-Card Spread') {
      dealSpread();
    }
  };

  const dailyIsReversed = revealedCard ? isCardReversed(revealedCard.id, 0) : false;

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>TAROT</Text>
      <Text style={styles.sectionTitle}>Daily Card Pull</Text>
      <View style={styles.tarotCardContainer}>
        {selectedSpread === 'Daily Pull' && (
          <View style={styles.tarotCardArea}>
            <TarotFlipCard
              card={isCardRevealed ? revealedCard : null}
              revealProgress={dailyFlip}
              onPress={revealDailyCard}
              width={170}
              height={250}
              showMeaning={true}
              reversed={dailyIsReversed}
            />
            {!isCardRevealed && (
              <Text style={styles.tarotRevealHint}>Tap to reveal today's card</Text>
            )}
            {isCardRevealed && (
              <View style={styles.tarotReadingArea}>
                <Pressable onPress={handleGetAIReading} style={[styles.tarotAiButton, isLoadingReading && { opacity: 0.7 }]} disabled={isLoadingReading}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tarotAiGradient}
                  >
                    <Text style={styles.tarotAiButtonText}>
                      {isLoadingReading ? 'Reading the cards...' : 'Get AI Reading ✨'}
                    </Text>
                  </LinearGradient>
                </Pressable>
                {aiReading && (
                  <Animated.View entering={FadeInDown.duration(400)} style={styles.tarotAiReadingCard}>
                    <Text style={styles.tarotAiReadingText}>{aiReading}</Text>
                  </Animated.View>
                )}
              </View>
            )}
          </View>
        )}
        {selectedSpread === '3-Card Spread' && (
          <View style={styles.tarotSpreadContainer}>
            <View style={styles.tarotSpreadRow}>
              {spreadCards.map((card, index) => {
                const reversed = isCardReversed(card.id, index);
                const flipValue = [spreadFlip1, spreadFlip2, spreadFlip3][index];
                return (
                  <View key={card.id} style={styles.tarotSpreadItem}>
                    <TarotFlipCard
                      card={card}
                      revealProgress={flipValue}
                      width={110}
                      height={165}
                      reversed={reversed}
                    />
                    <Text style={styles.tarotSpreadLabel}>{SPREAD_LABELS[index]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        {selectedSpread === 'Celtic Cross' && (
          <View style={styles.tarotCelticContainer}>
            <Text style={styles.tarotCelticText}>Coming in next update</Text>
          </View>
        )}
      </View>
      <View style={styles.spreadOptions}>
        {SPREADS.map((spread) => (
          <Pressable key={spread.name} onPress={() => handleSpreadSelect(spread.name)}
            style={[
              styles.spreadOption,
              spread.locked && styles.spreadOptionLocked,
              selectedSpread === spread.name && styles.spreadOptionActive,
            ]}
          >
            <View style={styles.spreadOptionLeft}>
              <Text style={[styles.spreadOptionName, spread.locked && styles.spreadOptionNameLocked]}>{spread.name}</Text>
              <Text style={styles.spreadOptionDetail}>{spread.cardCount}</Text>
            </View>
            {spread.locked ? (
              <View style={styles.lockBadge}><Text style={styles.lockIcon}>🔒</Text></View>
            ) : (
              <Text style={styles.spreadArrow}>→</Text>
            )}
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: MOON TRACKER 🌙
// ═══════════════════════════════════════════════════════════════

function MoonPhaseVisualization({ illumination }: { illumination: number }) {
  return <MoonPhaseViz illumination={illumination} size={120} />;
}

function MoonWeekStrip({ todayMoon }: { todayMoon: MoonPhaseInfo }) {
  // Generate real week phases
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekPhases = dayLabels.map((label, i) => {
    const dayOffset = i - dayOfWeek;
    const d = new Date(now.getTime() + dayOffset * 86400000);
    const moonInfo = getMoonPhase(d);
    return { day: label, phase: moonInfo.illumination, isToday: dayOffset === 0 };
  });

  return (
    <View style={styles.moonWeekContainer}>
      {weekPhases.map((day, i) => {
        const moonR = 10;
        return (
          <View key={i} style={[styles.moonWeekDay, day.isToday && styles.moonWeekDayToday]}>
            <Text style={[styles.moonWeekDayLabel, day.isToday && styles.moonWeekDayLabelToday]}>{day.day}</Text>
            <Svg width={moonR * 2 + 4} height={moonR * 2 + 4}>
              <Circle cx={moonR + 2} cy={moonR + 2} r={moonR} fill="#E8E0D4" />
              {day.phase < 1 && (
                <Path
                  d={`M ${moonR + 2} ${moonR + 2 - moonR} A ${moonR} ${moonR} 0 1 0 ${moonR + 2} ${moonR + 2 + moonR} A ${moonR * Math.abs(2 * day.phase - 1)} ${moonR} 0 0 ${day.phase > 0.5 ? 1 : 0} ${moonR + 2} ${moonR + 2 - moonR} Z`}
                  fill="rgba(45, 40, 55, 0.55)"
                />
              )}
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

function MoonTrackerSection() {
  // REAL moon data from astronomy-engine
  const moonData = React.useMemo(() => getMoonPhase(), []);
  const daysUntilFull = Math.round(moonData.daysUntilFullMoon);
  const daysUntilNew = Math.round(moonData.daysUntilNewMoon);
  const nextEventStr = daysUntilFull <= daysUntilNew
    ? `Full Moon in ${daysUntilFull} day${daysUntilFull === 1 ? '' : 's'}`
    : `New Moon in ${daysUntilNew} day${daysUntilNew === 1 ? '' : 's'}`;
  const nextEmoji = daysUntilFull <= daysUntilNew ? '🌕' : '🌑';
  const isNearFullMoon = daysUntilFull <= 2;

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>MOON TRACKER</Text>
      <Text style={styles.sectionTitle}>Current Phase</Text>
      <View style={[styles.card, styles.moonCard]}>
        <View style={styles.moonCardContent}>
          <View style={styles.moonTopRow}>
            <MoonPhaseVisualization illumination={moonData.illumination} />
            <View style={styles.moonInfo}>
              <Text style={styles.moonPhaseName}>{moonData.phaseName}</Text>
              <Text style={styles.moonPhaseSign}>in {moonData.moonSign}</Text>
              <View style={styles.moonDivider} />
              <Text style={styles.moonNextPhase}>{nextEmoji} {nextEventStr}</Text>
            </View>
          </View>
          <MoonWeekStrip todayMoon={moonData} />
          {isNearFullMoon && (
            <Pressable onPress={() => hapticLight()} style={styles.moonRitualHint}>
              <Text style={styles.moonRitualHintText}>Full Moon ritual guide available</Text>
              <Text style={styles.moonRitualHintArrow}> →</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6: TRANSIT CALENDAR
// ═══════════════════════════════════════════════════════════════

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FIRST_DAY_OFFSET = 6;

const TRANSIT_COLORS: Record<string, string> = {
  opportunity: colors.transitOpportunity,
  challenge: colors.transitChallenge,
  transformation: colors.transitTransformation,
};

function TransitCalendarSection() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const today = now.getDate();
  const [selectedDay, setSelectedDay] = useState<number | null>(today);

  // Real transit events from astronomy-engine
  const monthEvents = React.useMemo(() => getMonthEvents(year, month), [year, month]);

  // Build event map: day → events
  const eventsByDay = React.useMemo(() => {
    const map: Record<number, MonthEvent[]> = {};
    for (const ev of monthEvents) {
      const d = ev.date.getDate();
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    }
    return map;
  }, [monthEvents]);

  const handleDayPress = (date: number) => {
    hapticLight();
    setSelectedDay(date === selectedDay ? null : date);
  };

  // Calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) weeks.push(calendarCells.slice(i, i + 7));

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getEventColor = (ev: MonthEvent): string => {
    if (ev.impact === 'positive') return colors.transitOpportunity;
    if (ev.impact === 'challenging') return colors.transitChallenge;
    if (ev.impact === 'significant') return colors.transitTransformation;
    return colors.transitOpportunity;
  };

  const getEventType = (ev: MonthEvent): string => {
    if (ev.impact === 'positive') return 'opportunity';
    if (ev.impact === 'challenging') return 'challenge';
    return 'transformation';
  };

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1000)} style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>TRANSIT CALENDAR</Text>
      <Text style={styles.sectionTitle}>{monthNames[month - 1]} {year}</Text>
      <View style={[styles.card, styles.calendarCard]}>
        <View style={styles.calendarWeekdayRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <View key={i} style={styles.calendarWeekdayCell}>
              <Text style={styles.calendarWeekdayText}>{label}</Text>
            </View>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeekRow}>
            {week.map((date, dayIndex) => {
              if (date === null) return <View key={dayIndex} style={styles.calendarDayCell} />;
              const dayEvents = eventsByDay[date] || [];
              const isSelected = date === selectedDay;
              const isToday = date === today;
              const hasEvents = dayEvents.length > 0;
              return (
                <Pressable key={dayIndex} onPress={() => handleDayPress(date)}
                  style={[styles.calendarDayCell, isSelected && styles.calendarDayCellSelected, isToday && !isSelected && styles.calendarDayCellToday]}>
                  <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, isToday && !isSelected && styles.calendarDayTextToday]}>{date}</Text>
                  {hasEvents && (
                    <View style={styles.calendarDotRow}>
                      {dayEvents.slice(0, 3).map((ev, ti) => (
                        <View key={ti} style={[styles.calendarDot, { backgroundColor: getEventColor(ev) }, isSelected && { backgroundColor: colors.white }]} />
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
        {selectedDay && eventsByDay[selectedDay] && eventsByDay[selectedDay].length > 0 && (
          <View style={styles.calendarDetailCard}>
            <Text style={styles.calendarDetailDate}>{monthNames[month - 1]} {selectedDay}</Text>
            {eventsByDay[selectedDay].map((ev, i) => (
              <View key={i} style={styles.calendarDetailRow}>
                <View style={[styles.calendarDetailDot, { backgroundColor: getEventColor(ev) }]} />
                <View style={styles.calendarDetailText}>
                  <Text style={styles.calendarDetailPlanet}>{ev.emoji} {ev.description}</Text>
                  <Text style={styles.calendarDetailDesc}>{ev.type === 'full_moon' ? 'Release and illuminate' : ev.type === 'new_moon' ? 'Set intentions and plant seeds' : ev.type === 'ingress' ? 'Energy shifts' : ev.type === 'retrograde' ? 'Review and reflect' : 'Forward momentum'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={styles.calendarLegend}>
          <View style={styles.calendarLegendItem}>
            <View style={[styles.calendarLegendDot, { backgroundColor: colors.transitOpportunity }]} />
            <Text style={styles.calendarLegendText}>Opportunity</Text>
          </View>
          <View style={styles.calendarLegendItem}>
            <View style={[styles.calendarLegendDot, { backgroundColor: colors.transitChallenge }]} />
            <Text style={styles.calendarLegendText}>Challenge</Text>
          </View>
          <View style={styles.calendarLegendItem}>
            <View style={[styles.calendarLegendDot, { backgroundColor: colors.transitTransformation }]} />
            <Text style={styles.calendarLegendText}>Significant</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7: PLANETARY HOURS ⏰
// ═══════════════════════════════════════════════════════════════

function PlanetaryHoursSection() {
  const [hoursData, setHoursData] = useState<PlanetaryHoursData | null>(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  useEffect(() => {
    // Get planetary hours (default to NYC coordinates, could be user location)
    const data = getPlanetaryHours(new Date());
    setHoursData(data);
  }, []);

  if (!hoursData) return null;

  const { currentHour, todayHours, sunrise, sunset, dayRuler, dayRulerSymbol } = hoursData;
  const dayHours = todayHours.filter(h => h.isDay);
  const nightHours = todayHours.filter(h => !h.isDay);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1100)} style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>PLANETARY HOURS</Text>
      <Text style={styles.sectionTitle}>Cosmic Timing</Text>
      <View style={[styles.card, styles.planetaryHoursCard]}>
        {/* Current Hour Hero */}
        <View style={styles.currentHourHero}>
          <View style={[styles.currentHourIcon, { backgroundColor: currentHour.color + '20' }]}>
            <Text style={[styles.currentHourSymbol, { color: currentHour.color }]}>{currentHour.symbol}</Text>
          </View>
          <View style={styles.currentHourInfo}>
            <Text style={styles.currentHourLabel}>Current Hour</Text>
            <Text style={styles.currentHourPlanet}>{currentHour.planet}</Text>
            <Text style={styles.currentHourTime}>
              {formatTime(currentHour.startTime)} - {formatTime(currentHour.endTime)}
            </Text>
          </View>
          <View style={styles.dayRulerBadge}>
            <Text style={styles.dayRulerSymbol}>{dayRulerSymbol}</Text>
            <Text style={styles.dayRulerLabel}>{dayRuler}'s Day</Text>
          </View>
        </View>

        {/* Sun Times */}
        <View style={styles.sunTimesRow}>
          <View style={styles.sunTimeItem}>
            <Text style={styles.sunTimeEmoji}>🌅</Text>
            <Text style={styles.sunTimeLabel}>Sunrise</Text>
            <Text style={styles.sunTimeValue}>{formatTime(sunrise)}</Text>
          </View>
          <View style={styles.sunTimeDivider} />
          <View style={styles.sunTimeItem}>
            <Text style={styles.sunTimeEmoji}>🌇</Text>
            <Text style={styles.sunTimeLabel}>Sunset</Text>
            <Text style={styles.sunTimeValue}>{formatTime(sunset)}</Text>
          </View>
        </View>

        {/* Hour Schedule Toggle */}
        <Pressable
          onPress={() => { hapticLight(); setShowFullSchedule(!showFullSchedule); }}
          style={styles.scheduleToggle}
        >
          <Text style={styles.scheduleToggleText}>
            {showFullSchedule ? 'Hide Full Schedule' : 'View Full Schedule'} {showFullSchedule ? '↑' : '↓'}
          </Text>
        </Pressable>

        {/* Full Schedule */}
        {showFullSchedule && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.fullScheduleContainer}>
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSectionLabel}>☀️ Day Hours</Text>
              <View style={styles.scheduleGrid}>
                {dayHours.map((hour) => (
                  <View key={hour.hourNumber} style={[styles.scheduleItem, hour.isCurrent && styles.scheduleItemCurrent]}>
                    <Text style={[styles.scheduleSymbol, { color: hour.color }]}>{hour.symbol}</Text>
                    <Text style={styles.schedulePlanet}>{hour.planet}</Text>
                    <Text style={styles.scheduleTime}>{formatTime(hour.startTime)}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSectionLabel}>🌙 Night Hours</Text>
              <View style={styles.scheduleGrid}>
                {nightHours.map((hour) => (
                  <View key={hour.hourNumber} style={[styles.scheduleItem, hour.isCurrent && styles.scheduleItemCurrent]}>
                    <Text style={[styles.scheduleSymbol, { color: hour.color }]}>{hour.symbol}</Text>
                    <Text style={styles.schedulePlanet}>{hour.planet}</Text>
                    <Text style={styles.scheduleTime}>{formatTime(hour.startTime)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Planetary Hour Guide */}
        <View style={styles.planetaryGuide}>
          <Text style={styles.planetaryGuideTitle}>Best Uses for {currentHour.planet} Hour:</Text>
          <Text style={styles.planetaryGuideText}>{getPlanetaryHourGuidance(currentHour.planet)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function getPlanetaryHourGuidance(planet: string): string {
  const guidance: Record<string, string> = {
    Sun: 'Success, leadership, vitality. Great for important meetings, asking for raises, or health-related activities.',
    Moon: 'Intuition, emotions, home. Ideal for family matters, meditation, and nurturing activities.',
    Mars: 'Action, courage, competition. Perfect for physical exercise, confronting challenges, or starting projects.',
    Mercury: 'Communication, intellect, travel. Best for writing, negotiations, learning, and short trips.',
    Jupiter: 'Expansion, luck, abundance. Excellent for business deals, legal matters, and spiritual growth.',
    Venus: 'Love, beauty, pleasure. Wonderful for dates, artistic pursuits, and self-care.',
    Saturn: 'Discipline, structure, endings. Good for organization, long-term planning, and breaking bad habits.',
  };
  return guidance[planet] || 'A time for cosmic alignment.';
}

// ═══════════════════════════════════════════════════════════════
// SECTION 8: RETROGRADE TRACKER ⏪
// ═══════════════════════════════════════════════════════════════

function RetrogradeTrackerSection() {
  const retroData = React.useMemo(() => getRetrogradeData(), []);

  if (!retroData) return null;

  const { currentRetrogrades, upcomingRetrogrades, retrogradeCount, message } = retroData;

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1200)} style={styles.sectionContainer}>
      <Text style={styles.sectionLabel}>RETROGRADE TRACKER</Text>
      <Text style={styles.sectionTitle}>Planetary Stations</Text>
      <View style={[styles.card, styles.retrogradeCard]}>
        {/* Status Header */}
        <View style={styles.retrogradeStatus}>
          <View style={[
            styles.retrogradeStatusBadge,
            retrogradeCount === 0 && styles.retrogradeStatusClear,
            retrogradeCount > 0 && retrogradeCount <= 2 && styles.retrogradeStatusModerate,
            retrogradeCount > 2 && styles.retrogradeStatusHeavy,
          ]}>
            <Text style={styles.retrogradeStatusIcon}>
              {retrogradeCount === 0 ? '✨' : retrogradeCount <= 2 ? '⏪' : '🌀'}
            </Text>
            <Text style={styles.retrogradeStatusText}>
              {retrogradeCount === 0 ? 'All Clear' : `${retrogradeCount} Retrograde${retrogradeCount > 1 ? 's' : ''}`}
            </Text>
          </View>
          <Text style={styles.retrogradeMessage}>{message}</Text>
        </View>

        {/* Current Retrogrades */}
        {currentRetrogrades.length > 0 && (
          <View style={styles.retrogradeSection}>
            <Text style={styles.retrogradeSectionLabel}>Currently Retrograde</Text>
            {currentRetrogrades.map((retro) => (
              <View key={retro.planet} style={styles.retrogradeItem}>
                <View style={styles.retrogradeItemLeft}>
                  <View style={[styles.retrogradeSymbolWrap, { backgroundColor: getRetroColor(retro.planet) + '20' }]}>
                    <Text style={[styles.retrogradeSymbol, { color: getRetroColor(retro.planet) }]}>{retro.symbol}</Text>
                  </View>
                  <View style={styles.retrogradeItemInfo}>
                    <Text style={styles.retrogradeItemName}>{retro.planet} ℞</Text>
                    <Text style={styles.retrogradeItemSign}>in {retro.sign}</Text>
                  </View>
                </View>
                {retro.endDate && (
                  <View style={styles.retrogradeEndDate}>
                    <Text style={styles.retrogradeEndLabel}>Goes Direct</Text>
                    <Text style={styles.retrogradeEndValue}>
                      {retro.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Retrogrades */}
        {upcomingRetrogrades.length > 0 && (
          <View style={styles.retrogradeSection}>
            <Text style={styles.retrogradeSectionLabel}>Upcoming</Text>
            {upcomingRetrogrades.map((retro) => (
              <View key={retro.planet} style={[styles.retrogradeItem, styles.retrogradeItemUpcoming]}>
                <View style={styles.retrogradeItemLeft}>
                  <View style={[styles.retrogradeSymbolWrap, styles.retrogradeSymbolUpcoming]}>
                    <Text style={styles.retrogradeSymbolMuted}>{retro.symbol}</Text>
                  </View>
                  <View style={styles.retrogradeItemInfo}>
                    <Text style={styles.retrogradeItemNameMuted}>{retro.planet}</Text>
                    <Text style={styles.retrogradeItemSign}>will enter {retro.sign}</Text>
                  </View>
                </View>
                {retro.stationDate && (
                  <View style={styles.retrogradeEndDate}>
                    <Text style={styles.retrogradeEndLabel}>Stations Rx</Text>
                    <Text style={styles.retrogradeEndValue}>
                      {retro.stationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* No Retrogrades Message */}
        {currentRetrogrades.length === 0 && upcomingRetrogrades.length === 0 && (
          <View style={styles.noRetrogrades}>
            <Text style={styles.noRetrogradesEmoji}>🚀</Text>
            <Text style={styles.noRetrogradesText}>Clear skies ahead! All planets moving forward.</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function getRetroColor(planet: string): string {
  const colors: Record<string, string> = {
    Mercury: '#87CEEB',
    Venus: '#DDA0DD',
    Mars: '#CD5C5C',
    Jupiter: '#7B68EE',
    Saturn: '#5B5B7A',
    Uranus: '#40E0D0',
    Neptune: '#4169E1',
    Pluto: '#8B0000',
  };
  return colors[planet] || '#888888';
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ExploreTab() {
  const insets = useSafeAreaInsets();
  const [showCompatibility, setShowCompatibility] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FDFBF7', '#F8F4EC', '#FDFBF7']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => (<StardustParticle key={i} config={p} />))}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <ExploreHeader />
        
        {/* YOUR CHART SECTION */}
        <Text style={styles.majorSectionHeader}>Your Chart</Text>
        <MyBirthChartSection />

        {/* Ask VEYa About Your Chart */}
        <Pressable
          onPress={() => router.push('/(tabs)/chat')}
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <LinearGradient
            colors={['#6D28D9', '#8B5CF6', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.askVeyaCard}
          >
            <View style={styles.askVeyaContent}>
              <Text style={styles.askVeyaEmoji}>🎙️</Text>
              <View style={styles.askVeyaTextWrap}>
                <Text style={styles.askVeyaTitle}>Ask VEYa About Your Chart</Text>
                <Text style={styles.askVeyaSubtitle}>Get a personal voice reading of your natal placements</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* EXPLORE SECTION */}
        <Text style={styles.majorSectionHeader}>Explore</Text>
        <CompatibilitySection onStart={() => setShowCompatibility(true)} />
        <TarotSection />
        <MoonTrackerSection />
        <TransitCalendarSection />
        <PlanetaryHoursSection />
        <RetrogradeTrackerSection />

        {/* Soul Connections Section */}
        <Text style={styles.majorSectionHeader}>Connect</Text>
        <Animated.View entering={FadeInDown.duration(600).delay(1000)} style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>SOUL CONNECTIONS</Text>
          <Text style={styles.sectionTitle}>Your Cosmic Circle</Text>
          <SoulConnectionScreen />
        </Animated.View>

        {/* Cosmic Year Section */}
        <Text style={styles.majorSectionHeader}>Plan Ahead</Text>
        <Animated.View entering={FadeInDown.duration(600).delay(1200)} style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>YOUR COSMIC YEAR</Text>
          <Text style={styles.sectionTitle}>2026 at a Glance</Text>
          <CosmicYearTimeline />
        </Animated.View>

        {/* Soundscapes Section */}
        <Text style={styles.majorSectionHeader}>Relax</Text>
        <Animated.View entering={FadeInDown.duration(600).delay(1400)} style={styles.sectionContainer}>
          <SoundscapePlayer />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <CompatibilityModal
        visible={showCompatibility}
        onClose={() => setShowCompatibility(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: CONTENT_PADDING, paddingBottom: 120 },

  // Major Section Headers
  majorSectionHeader: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading2,
    color: colors.textPrimary,
    letterSpacing: 0.3,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  // Header
  headerContainer: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  headerTitle: {
    fontFamily: typography.fonts.display, fontSize: typography.sizes.display1,
    color: colors.textPrimary, letterSpacing: 0.3, marginBottom: 4,
  },
  headerSubtext: {
    fontFamily: typography.fonts.displayItalic, fontSize: typography.sizes.bodySmall,
    color: colors.textMuted, letterSpacing: 0.3,
  },
  
  // Feature Discovery Guide
  featureGuide: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  featureGuideTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  featureGuideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.xs,
  },
  featureGuideItem: {
    alignItems: 'center',
    width: '30%',
    paddingVertical: spacing.xs,
  },
  featureGuideEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureGuideLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.textSecondary,
  },
  featureGuideHint: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Shared section
  sectionContainer: { marginBottom: spacing.xl },
  sectionLabel: {
    fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny,
    color: colors.textMuted, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading2,
    color: colors.textPrimary, letterSpacing: 0.2, marginBottom: spacing.md,
  },

  // Shared card
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: colors.cardBorder,
    ...Platform.select({
      ios: { shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },

  // Birth chart
  chartCard: {
    borderRadius: borderRadius.xxl, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: 'rgba(212, 165, 71, 0.15)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 24 },
      android: { elevation: 5 },
    }),
  },
  chartCardGradient: {
    borderRadius: borderRadius.xxl, borderWidth: 1, borderColor: 'rgba(212, 165, 71, 0.15)',
    paddingTop: spacing.lg, paddingBottom: spacing.lg, alignItems: 'center',
  },
  miniChartWrapper: {
    width: MINI_CHART_SIZE + 60, height: MINI_CHART_SIZE + 60,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  miniChartGlow: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bigThreePillsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  bigThreePill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full,
    borderWidth: 1, borderColor: colors.cardBorder, gap: 4,
  },
  bigThreePillSymbol: { fontSize: 14, color: colors.accentGold },
  bigThreePillSign: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.caption, color: colors.textPrimary, letterSpacing: 0.2 },
  viewFullChartRow: { flexDirection: 'row', alignItems: 'center' },
  viewFullChartText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.primary, letterSpacing: 0.2 },
  viewFullChartArrow: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.primary },

  // Full chart modal
  fullChartModal: { flex: 1, backgroundColor: colors.background },
  fullChartHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.md,
  },
  fullChartTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary },
  fullChartCloseBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  fullChartCloseText: { fontSize: 20, color: colors.textMuted },
  houseSystemToggle: {
    flexDirection: 'row', alignSelf: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.full, padding: 3, marginBottom: spacing.lg,
  },
  houseSystemOption: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full },
  houseSystemOptionActive: {
    backgroundColor: colors.white,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, android: { elevation: 1 } }),
  },
  houseSystemOptionText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted },
  houseSystemOptionTextActive: { color: colors.textPrimary },
  fullChartScrollContent: { alignItems: 'center', paddingHorizontal: spacing.lg },
  fullChartSvgContainer: { marginBottom: spacing.lg },
  planetInfoCard: {
    width: '100%', backgroundColor: colors.white, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  planetInfoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  planetInfoDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
  planetInfoName: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.body, color: colors.textPrimary, marginRight: spacing.xs },
  planetInfoSign: { fontFamily: typography.fonts.displayItalic, fontSize: typography.sizes.bodySmall, color: colors.textMuted },
  planetInfoText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, lineHeight: typography.sizes.bodySmall * 1.6 },
  chartHintText: { fontFamily: typography.fonts.displayItalic, fontSize: typography.sizes.bodySmall, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  explainChartButton: { borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.lg },
  explainChartGradient: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center' },
  explainChartText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.body, color: colors.white, letterSpacing: 0.3 },

  // Compatibility
  compatCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.xxl, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.cardBorder,
    ...Platform.select({
      ios: { shadowColor: 'rgba(232, 120, 138, 0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  compatGradientStrip: { height: 3 },
  compatCardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  compatTextArea: { flex: 1 },
  compatCardTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, lineHeight: typography.sizes.heading3 * 1.3, marginBottom: spacing.xs },
  compatCardHint: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted, marginBottom: spacing.md },
  compatStartButton: { alignSelf: 'flex-start', borderRadius: borderRadius.md, overflow: 'hidden' },
  compatStartGradient: { paddingVertical: spacing.xs, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
  compatStartText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.white, letterSpacing: 0.3 },
  compatIllustration: { marginLeft: spacing.sm },
  compatLastResult: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.04)', borderTopWidth: 1, borderTopColor: 'rgba(139, 92, 246, 0.06)',
  },
  compatLastResultDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: spacing.xs, opacity: 0.6 },
  compatLastResultText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny, color: colors.textSecondary, flex: 1 },
  compatLastResultDate: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted },

  // Tarot
  tarotCardContainer: { alignItems: 'center', marginBottom: spacing.lg },
  tarotCardArea: { alignItems: 'center' },
  tarotFlipContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotFlipSide: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  tarotRevealedCard: {
    backgroundColor: '#FFF6E9',
    borderRadius: borderRadius.lg,
    borderWidth: 1.2,
    borderColor: colors.tarotGold,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotRevealedCardFull: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  tarotRevealedCardCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  tarotRevealedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tarotCardEmoji: {
    fontSize: 44,
    marginBottom: spacing.xs,
  },
  tarotCardName: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.heading3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tarotCardMeaning: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.bodySmall * 1.5,
    marginBottom: spacing.sm,
  },
  tarotKeywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  tarotKeywordTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 168, 76, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.35)',
  },
  tarotKeywordText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.textPrimary,
  },
  tarotReversedLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.tiny,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tarotRevealHint: { fontFamily: typography.fonts.displayItalic, fontSize: typography.sizes.bodySmall, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, letterSpacing: 0.3 },
  tarotReadingArea: { width: '100%', marginTop: spacing.md, alignItems: 'center' },
  tarotAiButton: { borderRadius: borderRadius.md, overflow: 'hidden', alignSelf: 'stretch' },
  tarotAiGradient: { paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  tarotAiButtonText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.white, letterSpacing: 0.4 },
  tarotAiReadingCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  tarotAiReadingText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.bodySmall * 1.5,
  },
  tarotSpreadContainer: { alignItems: 'center' },
  tarotSpreadRow: { flexDirection: 'row', gap: spacing.sm },
  tarotSpreadItem: { alignItems: 'center' },
  tarotSpreadLabel: {
    marginTop: spacing.xs,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  tarotCelticContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  tarotCelticText: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.bodySmall,
    color: colors.textMuted,
  },
  spreadOptions: { gap: spacing.xs },
  spreadOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder,
  },
  spreadOptionActive: {
    borderColor: 'rgba(201, 168, 76, 0.6)',
    backgroundColor: 'rgba(255, 247, 234, 0.6)',
  },
  spreadOptionLocked: { backgroundColor: 'rgba(245, 240, 232, 0.5)', borderColor: 'rgba(212, 165, 71, 0.08)' },
  spreadOptionLeft: { flex: 1 },
  spreadOptionName: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, marginBottom: 2 },
  spreadOptionNameLocked: { color: colors.textMuted },
  spreadOptionDetail: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted },
  lockBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentGoldLight, alignItems: 'center', justifyContent: 'center' },
  lockIcon: { fontSize: 12 },
  spreadArrow: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.body, color: colors.primary },

  // Moon tracker
  moonCard: { padding: spacing.lg },
  moonCardContent: {},
  moonTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  moonContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  moonInfo: { flex: 1 },
  moonPhaseName: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, marginBottom: 2 },
  moonPhaseSign: { fontFamily: typography.fonts.displayItalic, fontSize: typography.sizes.body, color: colors.textSecondary, marginBottom: spacing.sm },
  moonDivider: { width: 32, height: 1, backgroundColor: colors.accentGold, opacity: 0.3, marginBottom: spacing.sm },
  moonNextPhase: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted },
  moonWeekContainer: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs, backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: spacing.md,
  },
  moonWeekDay: { alignItems: 'center', flex: 1, paddingVertical: spacing.xs },
  moonWeekDayToday: { backgroundColor: colors.white, borderRadius: borderRadius.sm },
  moonWeekDayLabel: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, color: colors.textMuted, marginBottom: 4 },
  moonWeekDayLabelToday: { color: colors.accentGold },
  moonRitualHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xs, backgroundColor: 'rgba(212, 165, 71, 0.06)', borderRadius: borderRadius.sm,
  },
  moonRitualHintText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.accentGold },
  moonRitualHintArrow: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.accentGold },

  // Transit calendar
  calendarCard: { padding: spacing.md },
  calendarWeekdayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  calendarWeekdayCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  calendarWeekdayText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, color: colors.textMuted, letterSpacing: 0.5 },
  calendarWeekRow: { flexDirection: 'row' },
  calendarDayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, minHeight: 44, borderRadius: borderRadius.sm },
  calendarDayCellSelected: { backgroundColor: colors.primary, borderRadius: borderRadius.md },
  calendarDayCellToday: { backgroundColor: 'rgba(212, 165, 71, 0.08)', borderRadius: borderRadius.md },
  calendarDayText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, marginBottom: 2 },
  calendarDayTextSelected: { color: colors.white, fontFamily: typography.fonts.bodySemiBold },
  calendarDayTextToday: { color: colors.accentGold, fontFamily: typography.fonts.bodySemiBold },
  calendarDotRow: { flexDirection: 'row', gap: 2, height: 6 },
  calendarDot: { width: 4, height: 4, borderRadius: 2 },
  calendarDetailCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.sm },
  calendarDetailDate: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.caption, color: colors.textPrimary, marginBottom: spacing.xs },
  calendarDetailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  calendarDetailDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginRight: spacing.xs },
  calendarDetailText: { flex: 1 },
  calendarDetailPlanet: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.caption, color: colors.textPrimary, marginBottom: 2 },
  calendarDetailDesc: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textSecondary, lineHeight: typography.sizes.tiny * 1.4 },
  calendarLegend: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0, 0, 0, 0.04)',
  },
  calendarLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calendarLegendDot: { width: 6, height: 6, borderRadius: 3 },
  calendarLegendText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted },

  // Ask VEYa card
  askVeyaCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  askVeyaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  askVeyaEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  askVeyaTextWrap: {
    flex: 1,
  },
  askVeyaTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.displaySemiBold,
    color: '#FFFFFF',
    marginBottom: 3,
  },
  askVeyaSubtitle: {
    fontSize: 13,
    fontFamily: typography.fonts.body,
    color: 'rgba(255,255,255,0.75)',
  },

  // Planetary Hours
  planetaryHoursCard: { padding: spacing.lg },
  currentHourHero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  currentHourIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  currentHourSymbol: {
    fontSize: 28,
    fontWeight: '600',
  },
  currentHourInfo: {
    flex: 1,
  },
  currentHourLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  currentHourPlanet: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading3,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  currentHourTime: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  dayRulerBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  dayRulerSymbol: {
    fontSize: 20,
    marginBottom: 2,
  },
  dayRulerLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
  },
  sunTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  sunTimeItem: {
    flex: 1,
    alignItems: 'center',
  },
  sunTimeEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  sunTimeLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    marginBottom: 2,
  },
  sunTimeValue: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
  },
  sunTimeDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  scheduleToggle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  scheduleToggleText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    color: colors.primary,
  },
  fullScheduleContainer: {
    marginBottom: spacing.md,
  },
  scheduleSection: {
    marginBottom: spacing.md,
  },
  scheduleSectionLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  scheduleItem: {
    width: '23%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  scheduleItemCurrent: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  scheduleSymbol: {
    fontSize: 16,
    marginBottom: 2,
  },
  schedulePlanet: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.tiny,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  scheduleTime: {
    fontFamily: typography.fonts.body,
    fontSize: 9,
    color: colors.textMuted,
  },
  planetaryGuide: {
    backgroundColor: 'rgba(212, 165, 71, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  planetaryGuideTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planetaryGuideText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    lineHeight: typography.sizes.caption * 1.5,
  },

  // Retrograde Tracker
  retrogradeCard: { padding: spacing.lg },
  retrogradeStatus: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  retrogradeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  retrogradeStatusClear: {
    backgroundColor: 'rgba(74, 157, 110, 0.15)',
  },
  retrogradeStatusModerate: {
    backgroundColor: 'rgba(212, 148, 44, 0.15)',
  },
  retrogradeStatusHeavy: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  retrogradeStatusIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  retrogradeStatusText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.bodySmall,
    color: colors.textPrimary,
  },
  retrogradeMessage: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.caption * 1.5,
    paddingHorizontal: spacing.md,
  },
  retrogradeSection: {
    marginBottom: spacing.md,
  },
  retrogradeSectionLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  retrogradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  retrogradeItemUpcoming: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderStyle: 'dashed',
  },
  retrogradeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retrogradeSymbolWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  retrogradeSymbolUpcoming: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  retrogradeSymbol: {
    fontSize: 18,
    fontWeight: '600',
  },
  retrogradeSymbolMuted: {
    fontSize: 18,
    color: colors.textMuted,
  },
  retrogradeItemInfo: {},
  retrogradeItemName: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  retrogradeItemNameMuted: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.body,
    color: colors.textMuted,
    marginBottom: 2,
  },
  retrogradeItemSign: {
    fontFamily: typography.fonts.displayItalic,
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  retrogradeEndDate: {
    alignItems: 'flex-end',
  },
  retrogradeEndLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.tiny,
    color: colors.textMuted,
    marginBottom: 2,
  },
  retrogradeEndValue: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    color: colors.primary,
  },
  noRetrogrades: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noRetrogradesEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  noRetrogradesText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
