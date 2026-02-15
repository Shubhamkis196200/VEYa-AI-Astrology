/**
 * VEYa — NatalChart
 *
 * Configurable SVG birth chart component extracted from explore.tsx and chart-reveal.tsx.
 * Supports mini (preview) and full (interactive) sizes via the `size` prop.
 *
 * Usage:
 *   <NatalChart size={260} />           // mini preview
 *   <NatalChart size={360} interactive  // full with tap-to-select
 *     onSelectPlanet={(planet) => ...} />
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  G,
  Line,
  Defs,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '@/theme/colors';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface Planet {
  name: string;
  symbol: string;
  degree: number;
  color: string;
  glowColor: string;
  size: number;
}

// ─────────────────────────────────────────────────────────────
// CHART DATA
// ─────────────────────────────────────────────────────────────

export const ZODIAC_SIGNS = [
  { name: 'Aries',       symbol: '♈', element: 'fire',  startDegree: 0 },
  { name: 'Taurus',      symbol: '♉', element: 'earth', startDegree: 30 },
  { name: 'Gemini',      symbol: '♊', element: 'air',   startDegree: 60 },
  { name: 'Cancer',      symbol: '♋', element: 'water', startDegree: 90 },
  { name: 'Leo',         symbol: '♌', element: 'fire',  startDegree: 120 },
  { name: 'Virgo',       symbol: '♍', element: 'earth', startDegree: 150 },
  { name: 'Libra',       symbol: '♎', element: 'air',   startDegree: 180 },
  { name: 'Scorpio',     symbol: '♏', element: 'water', startDegree: 210 },
  { name: 'Sagittarius', symbol: '♐', element: 'fire',  startDegree: 240 },
  { name: 'Capricorn',   symbol: '♑', element: 'earth', startDegree: 270 },
  { name: 'Aquarius',    symbol: '♒', element: 'air',   startDegree: 300 },
  { name: 'Pisces',      symbol: '♓', element: 'water', startDegree: 330 },
] as const;

export const ELEMENT_COLORS: Record<string, string> = {
  fire: colors.fire,
  earth: colors.earth,
  air: colors.air,
  water: colors.water,
};

export const DEFAULT_PLANETS: Planet[] = [
  { name: 'Sun',     symbol: '☉', degree: 225, color: '#D4A547', glowColor: 'rgba(212, 165, 71, 0.5)',  size: 5 },
  { name: 'Moon',    symbol: '☽', degree: 345, color: '#C4B5E0', glowColor: 'rgba(196, 181, 224, 0.5)', size: 4.5 },
  { name: 'Mercury', symbol: '☿', degree: 235, color: '#A8947A', glowColor: 'rgba(168, 148, 122, 0.4)', size: 3 },
  { name: 'Venus',   symbol: '♀', degree: 190, color: '#E8788A', glowColor: 'rgba(232, 120, 138, 0.45)', size: 3.5 },
  { name: 'Mars',    symbol: '♂', degree: 155, color: '#E8664D', glowColor: 'rgba(232, 102, 77, 0.45)',  size: 3.5 },
  { name: 'Jupiter', symbol: '♃', degree: 40,  color: '#8B5CF6', glowColor: 'rgba(139, 92, 246, 0.4)',  size: 4 },
  { name: 'Saturn',  symbol: '♄', degree: 285, color: '#6B8E6B', glowColor: 'rgba(107, 142, 107, 0.4)', size: 3.5 },
  { name: 'Uranus',  symbol: '♅', degree: 70,  color: '#5B8DB8', glowColor: 'rgba(91, 141, 184, 0.4)',  size: 3 },
  { name: 'Neptune', symbol: '♆', degree: 355, color: '#7B9FCC', glowColor: 'rgba(123, 159, 204, 0.45)', size: 3 },
  { name: 'Pluto',   symbol: '⯓', degree: 300, color: '#9B7A5A', glowColor: 'rgba(155, 122, 90, 0.35)', size: 2.5 },
];

export const HOUSE_CUSPS = [120, 148, 178, 210, 242, 268, 300, 328, 358, 30, 62, 88];

// ─────────────────────────────────────────────────────────────
// GEOMETRY HELPERS (exported for reuse in modals)
// ─────────────────────────────────────────────────────────────

export function astroToSvgAngle(astroDegree: number): number {
  return (180 - astroDegree) * (Math.PI / 180);
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  astroDegree: number,
): { x: number; y: number } {
  const angle = astroToSvgAngle(astroDegree);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  };
}

// ─────────────────────────────────────────────────────────────
// ANIMATED CIRCLE (for native ring draw animation)
// ─────────────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const IS_WEB = Platform.OS === 'web';
// In Expo Go (native without dev-client), animatedProps on SVG crashes.
// Use static Circle on native, AnimatedCircle only on web where it works.
const USE_STATIC_SVG = !IS_WEB;
const SafeCircle = USE_STATIC_SVG ? Circle : AnimatedCircle;

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

interface NatalChartProps {
  /** Total SVG size in logical pixels */
  size?: number;
  /** Planet placements. Defaults to mock Scorpio/Pisces/Leo chart. */
  planets?: Planet[];
  /** House cusp degrees. */
  houseCusps?: number[];
  /** Show zodiac symbols around the ring */
  showZodiacSymbols?: boolean;
  /** Enable interactive planet selection */
  interactive?: boolean;
  /** Called when a planet dot is tapped (interactive mode) */
  onSelectPlanet?: (planet: Planet) => void;
  /** Currently selected planet name */
  selectedPlanetName?: string | null;
  /** Show house numbers */
  showHouseNumbers?: boolean;
  /** Show ASC / MC labels */
  showAxisLabels?: boolean;
  /** Enable breathing scale animation */
  breathe?: boolean;
  /** Show outer glow halo */
  showGlow?: boolean;
}

export default function NatalChart({
  size: propSize,
  planets = DEFAULT_PLANETS,
  houseCusps = HOUSE_CUSPS,
  showZodiacSymbols = true,
  interactive = false,
  onSelectPlanet,
  selectedPlanetName,
  showHouseNumbers = false,
  showAxisLabels = false,
  breathe = true,
  showGlow = true,
}: NatalChartProps) {
  // Default size: smaller for mini, or caller-specified
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const size = propSize ?? Math.min(SCREEN_WIDTH - 80, 260);

  const CENTER = size / 2;
  const OUTER_RADIUS = size / 2 - (size > 300 ? 8 : 6);
  const ZODIAC_INNER = OUTER_RADIUS - (size > 300 ? 28 : 20);
  const HOUSE_INNER = OUTER_RADIUS * 0.28;

  // Determine font sizes based on chart size
  const zodiacFontSize = size > 300 ? 12 : 9;
  const houseNumFontSize = size > 300 ? 8 : 6;
  const axisFontSize = size > 300 ? 7 : 5;

  // ── Animations ──
  const breatheScale = useSharedValue(1);
  const ringProgress = useSharedValue(0);

  useEffect(() => {
    if (IS_WEB) {
      ringProgress.value = 1;
      return;
    }
    ringProgress.value = withDelay(
      300,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    if (breathe) {
      breatheScale.value = withDelay(
        1800,
        withRepeat(
          withSequence(
            withTiming(1.01, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        ),
      );
    }
    
    // Cancel animations on unmount to prevent memory leaks
    return () => {
      cancelAnimation(breatheScale);
      cancelAnimation(ringProgress);
    };
  }, [breathe]);

  const outerCircumference = 2 * Math.PI * OUTER_RADIUS;
  const innerCircumference = 2 * Math.PI * ZODIAC_INNER;

  // Always call hooks (React rules) — on web we just ignore the result
  const outerRingProps = useAnimatedProps(() => ({
    strokeDashoffset: outerCircumference * (1 - ringProgress.value),
  }));
  const innerRingProps = useAnimatedProps(() => ({
    strokeDashoffset: innerCircumference * (1 - ringProgress.value),
  }));

  const chartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  // ── Zodiac symbols ──
  const zodiacElements = showZodiacSymbols
    ? ZODIAC_SIGNS.map((sign, i) => {
        const midDeg = sign.startDegree + 15;
        const labelR = (OUTER_RADIUS + ZODIAC_INNER) / 2;
        const pos = polarToCartesian(CENTER, CENTER, labelR, midDeg);
        return (
          <SvgText
            key={`z-${i}`}
            x={pos.x}
            y={pos.y + (size > 300 ? 5 : 4)}
            textAnchor="middle"
            fontSize={zodiacFontSize}
            fill={ELEMENT_COLORS[sign.element]}
            opacity={0.8}
            fontWeight={size > 300 ? '400' : undefined}
          >
            {sign.symbol}
          </SvgText>
        );
      })
    : null;

  // ── Zodiac division ticks ──
  const zodiacTicks = ZODIAC_SIGNS.map((sign, i) => {
    const outer = polarToCartesian(CENTER, CENTER, OUTER_RADIUS, sign.startDegree);
    const inner = polarToCartesian(CENTER, CENTER, ZODIAC_INNER, sign.startDegree);
    return (
      <Line
        key={`zt-${i}`}
        x1={outer.x} y1={outer.y}
        x2={inner.x} y2={inner.y}
        stroke={colors.accentGold}
        strokeWidth={size > 300 ? 0.8 : 0.6}
        opacity={0.6}
      />
    );
  });

  // ── House lines ──
  const houseLines = houseCusps.map((cusp, i) => {
    const outer = polarToCartesian(CENTER, CENTER, ZODIAC_INNER, cusp);
    const inner = polarToCartesian(CENTER, CENTER, HOUSE_INNER, cusp);
    const isCardinal = i === 0 || i === 3 || i === 6 || i === 9;
    return (
      <Line
        key={`h-${i}`}
        x1={outer.x} y1={outer.y}
        x2={inner.x} y2={inner.y}
        stroke={isCardinal ? colors.accentGold : 'rgba(212, 165, 71, 0.35)'}
        strokeWidth={isCardinal ? (size > 300 ? 1 : 0.8) : (size > 300 ? 0.5 : 0.4)}
      />
    );
  });

  // ── House numbers ──
  const houseNumberElements = showHouseNumbers
    ? houseCusps.map((cusp, i) => {
        const nextCusp = houseCusps[(i + 1) % 12];
        const midDeg = cusp + (((nextCusp - cusp + 360) % 360) / 2);
        const labelR = (ZODIAC_INNER + HOUSE_INNER) / 2;
        const pos = polarToCartesian(CENTER, CENTER, labelR, midDeg);
        return (
          <SvgText
            key={`hn-${i}`}
            x={pos.x}
            y={pos.y + 3.5}
            textAnchor="middle"
            fontSize={houseNumFontSize}
            fill={colors.textMuted}
            opacity={0.4}
          >
            {i + 1}
          </SvgText>
        );
      })
    : null;

  // ── ASC / MC labels ──
  const axisLabels = showAxisLabels
    ? (() => {
        const ascPos = polarToCartesian(CENTER, CENTER, ZODIAC_INNER + 16, houseCusps[0]);
        const mcPos = polarToCartesian(CENTER, CENTER, ZODIAC_INNER + 16, houseCusps[9]);
        return (
          <>
            <SvgText x={ascPos.x} y={ascPos.y + 3} textAnchor="middle"
              fontSize={axisFontSize} fill={colors.accentGold} fontWeight="600" letterSpacing={1}>
              ASC
            </SvgText>
            <SvgText x={mcPos.x} y={mcPos.y + 3} textAnchor="middle"
              fontSize={axisFontSize} fill={colors.accentGold} fontWeight="600" letterSpacing={1}>
              MC
            </SvgText>
          </>
        );
      })()
    : null;

  // ── Planet dots ──
  const planetR = (ZODIAC_INNER + HOUSE_INNER) / 2 + (size > 300 ? 12 : 8);
  const planetDots = planets.map((planet, i) => {
    const pos = polarToCartesian(CENTER, CENTER, planetR, planet.degree);
    const isSelected = selectedPlanetName === planet.name;
    return (
      <G key={`p-${i}`}>
        <Circle
          cx={pos.x} cy={pos.y}
          r={planet.size + (size > 300 ? 3 : 2)}
          fill={planet.glowColor}
          opacity={isSelected ? 1 : 0.7}
        />
        <Circle
          cx={pos.x} cy={pos.y}
          r={planet.size + (isSelected ? 1.5 : 0)}
          fill={planet.color}
        />
        <Circle
          cx={pos.x - 0.5} cy={pos.y - 0.5}
          r={planet.size * (size > 300 ? 0.35 : 0.3)}
          fill="#FFFFFF"
          opacity={size > 300 ? 0.5 : 0.45}
        />
        {interactive && (
          <Circle
            cx={pos.x} cy={pos.y}
            r={16}
            fill="transparent"
            onPress={() => onSelectPlanet?.(planet)}
          />
        )}
      </G>
    );
  });

  // Glow wrapper dimensions
  const glowSize = size + 60;

  return (
    <Animated.View style={[styles.wrapper, { width: glowSize, height: glowSize }, chartStyle]}>
      {showGlow && (
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={['rgba(212, 165, 71, 0.1)', 'rgba(212, 165, 71, 0.03)', 'transparent']}
            style={{ width: glowSize, height: glowSize, borderRadius: glowSize / 2 }}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 0 }}
          />
        </View>
      )}
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="chartGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.08" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background glow fill */}
        <Circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill="url(#chartGlow)" />

        {/* Outer & inner rings */}
        {(IS_WEB || USE_STATIC_SVG) ? (
          <>
            <Circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS}
              stroke={colors.accentGold} strokeWidth={size > 300 ? 1.2 : 1} fill="none"
              strokeDasharray={`${outerCircumference}`} strokeDashoffset={0} strokeLinecap="round" />
            <Circle cx={CENTER} cy={CENTER} r={ZODIAC_INNER}
              stroke={colors.accentGold} strokeWidth={size > 300 ? 0.6 : 0.5} fill="none" opacity={size > 300 ? 0.7 : 0.6}
              strokeDasharray={`${innerCircumference}`} strokeDashoffset={0} />
          </>
        ) : (
          <>
            <SafeCircle cx={CENTER} cy={CENTER} r={OUTER_RADIUS}
              stroke={colors.accentGold} strokeWidth={size > 300 ? 1.2 : 1} fill="none"
              strokeDasharray={`${outerCircumference}`} animatedProps={outerRingProps} strokeLinecap="round" />
            <SafeCircle cx={CENTER} cy={CENTER} r={ZODIAC_INNER}
              stroke={colors.accentGold} strokeWidth={size > 300 ? 0.6 : 0.5} fill="none" opacity={size > 300 ? 0.7 : 0.6}
              strokeDasharray={`${innerCircumference}`} animatedProps={innerRingProps} />
          </>
        )}

        {/* Inner house circle */}
        <Circle cx={CENTER} cy={CENTER} r={HOUSE_INNER}
          stroke={size > 300 ? 'rgba(212, 165, 71, 0.18)' : 'rgba(212, 165, 71, 0.15)'}
          strokeWidth={size > 300 ? 0.4 : 0.3} fill="none" />

        {/* Center dot */}
        <Circle cx={CENTER} cy={CENTER} r={size > 300 ? 3 : 2.5}
          fill={colors.accentGold} opacity={size > 300 ? 0.4 : 0.35} />

        {zodiacTicks}
        {zodiacElements}
        {houseLines}
        {houseNumberElements}
        {axisLabels}
        {planetDots}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
