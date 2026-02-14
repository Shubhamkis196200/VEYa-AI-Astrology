/**
 * VEYa — MoonPhase
 *
 * Realistic moon phase SVG visualization extracted from explore.tsx.
 * Renders a moon at a given illumination level with optional glow animation.
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Path,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '@/theme/colors';

interface MoonPhaseProps {
  /** 0..1 illumination fraction */
  illumination: number;
  /** Size of the SVG container. Default 120. */
  size?: number;
  /** Whether to animate a gentle glow pulse. Default true. */
  animated?: boolean;
}

export default function MoonPhase({
  illumination,
  size = 120,
  animated = true,
}: MoonPhaseProps) {
  const CENTER = size / 2;
  const RADIUS = size * (50 / 120); // Proportional to original 120-size design

  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [animated]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.9, 1]),
  }));

  const phase = illumination;

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, animated ? glowStyle : undefined]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="moonSurface" cx="40%" cy="35%" r="60%">
            <Stop offset="0%" stopColor="#F5F0E8" />
            <Stop offset="40%" stopColor="#E8E0D4" />
            <Stop offset="100%" stopColor="#D4C8B8" />
          </RadialGradient>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="70%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0.12" />
          </RadialGradient>
        </Defs>

        {/* Outer glow */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS + 6} fill="url(#moonGlow)" />

        {/* Moon surface */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#moonSurface)" />

        {/* Craters */}
        <Circle cx={CENTER - 12} cy={CENTER - 8} r={8} fill="rgba(180, 170, 155, 0.2)" />
        <Circle cx={CENTER + 15} cy={CENTER + 12} r={5} fill="rgba(180, 170, 155, 0.15)" />
        <Circle cx={CENTER - 5} cy={CENTER + 18} r={6} fill="rgba(180, 170, 155, 0.12)" />
        <Circle cx={CENTER + 8} cy={CENTER - 16} r={4} fill="rgba(180, 170, 155, 0.1)" />
        <Circle cx={CENTER - 18} cy={CENTER + 5} r={3.5} fill="rgba(180, 170, 155, 0.15)" />

        {/* Shadow overlay for phase */}
        {phase < 1 && (
          <Path
            d={`M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 0 ${CENTER} ${CENTER + RADIUS} A ${RADIUS * Math.abs(2 * phase - 1)} ${RADIUS} 0 0 ${phase > 0.5 ? 1 : 0} ${CENTER} ${CENTER - RADIUS} Z`}
            fill="rgba(45, 40, 55, 0.65)"
          />
        )}

        {/* Subtle rim */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="rgba(245, 240, 232, 0.3)" strokeWidth={1} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
