/**
 * VEYa — TarotCard
 *
 * Luxury tarot card back design extracted from explore.tsx.
 * SVG-based card with geometric patterns and shimmer animation.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
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
  G,
  Line,
  Rect,
  Defs,
  RadialGradient,
  Stop,
  Text as SvgText,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import AnimatedPressable from '@/components/ui/AnimatedPressable';

const TAROT_COLORS = {
  gold: '#C9A84C',
  deepPurple: '#2D1B4E',
  midPurple: '#4A2D6E',
};

interface TarotCardProps {
  width?: number;
  height?: number;
  onPress?: () => void;
}

export default function TarotCard({
  width = 140,
  height = 210,
  onPress,
}: TarotCardProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.85, 1]),
  }));

  return (
    <AnimatedPressable onPress={onPress} style={[styles.card, shimmerStyle]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgLinearGradient id="tarotBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={TAROT_COLORS.deepPurple} />
            <Stop offset="50%" stopColor={TAROT_COLORS.midPurple} />
            <Stop offset="100%" stopColor={TAROT_COLORS.deepPurple} />
          </SvgLinearGradient>
          <RadialGradient id="tarotCenterGlow" cx="50%" cy="50%" r="40%">
            <Stop offset="0%" stopColor="#D4A547" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} rx={12} fill="url(#tarotBg)" />

        {/* Borders */}
        <Rect x={3} y={3} width={width - 6} height={height - 6} rx={10}
          fill="none" stroke={TAROT_COLORS.gold} strokeWidth={1.2} opacity={0.6} />
        <Rect x={8} y={8} width={width - 16} height={height - 16} rx={8}
          fill="none" stroke={TAROT_COLORS.gold} strokeWidth={0.5} opacity={0.35} />

        {/* Center glow */}
        <Circle cx={width / 2} cy={height / 2} r={50} fill="url(#tarotCenterGlow)" />

        {/* Diamond patterns */}
        <Path
          d={`M ${width / 2} 35 L ${width - 25} ${height / 2} L ${width / 2} ${height - 35} L 25 ${height / 2} Z`}
          fill="none" stroke={TAROT_COLORS.gold} strokeWidth={0.7} opacity={0.4}
        />
        <Path
          d={`M ${width / 2} 55 L ${width - 40} ${height / 2} L ${width / 2} ${height - 55} L 40 ${height / 2} Z`}
          fill="none" stroke={TAROT_COLORS.gold} strokeWidth={0.5} opacity={0.3}
        />

        {/* Star rays */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45) * (Math.PI / 180);
          return (
            <Line key={`star-${i}`}
              x1={width / 2 + 10 * Math.cos(angle)} y1={height / 2 + 10 * Math.sin(angle)}
              x2={width / 2 + 22 * Math.cos(angle)} y2={height / 2 + 22 * Math.sin(angle)}
              stroke={TAROT_COLORS.gold} strokeWidth={0.8} opacity={0.55}
            />
          );
        })}

        {/* Center circles */}
        <Circle cx={width / 2} cy={height / 2} r={10} fill="none" stroke={TAROT_COLORS.gold} strokeWidth={0.7} opacity={0.5} />
        <Circle cx={width / 2} cy={height / 2} r={3} fill={TAROT_COLORS.gold} opacity={0.4} />

        {/* Corner crosses */}
        {[
          { x: 20, y: 20 },
          { x: width - 20, y: 20 },
          { x: 20, y: height - 20 },
          { x: width - 20, y: height - 20 },
        ].map((corner, i) => (
          <G key={`corner-${i}`}>
            <Line x1={corner.x - 5} y1={corner.y} x2={corner.x + 5} y2={corner.y}
              stroke={TAROT_COLORS.gold} strokeWidth={0.6} opacity={0.4} />
            <Line x1={corner.x} y1={corner.y - 5} x2={corner.x} y2={corner.y + 5}
              stroke={TAROT_COLORS.gold} strokeWidth={0.6} opacity={0.4} />
            <Circle cx={corner.x} cy={corner.y} r={1.5} fill={TAROT_COLORS.gold} opacity={0.35} />
          </G>
        ))}

        {/* Star decorations */}
        <SvgText x={width / 2} y={48} textAnchor="middle" fontSize={8}
          fill={TAROT_COLORS.gold} opacity={0.5} letterSpacing={3}>★ ★ ★</SvgText>
        <SvgText x={width / 2} y={height - 38} textAnchor="middle" fontSize={8}
          fill={TAROT_COLORS.gold} opacity={0.5} letterSpacing={3}>★ ★ ★</SvgText>

        {/* Cardinal zodiac symbols */}
        {['♈', '♋', '♎', '♑'].map((symbol, i) => {
          const angle = (i * 90 + 45) * (Math.PI / 180);
          const sr = 35;
          return (
            <SvgText key={`ts-${i}`}
              x={width / 2 + sr * Math.cos(angle)} y={height / 2 + sr * Math.sin(angle) + 4}
              textAnchor="middle" fontSize={9} fill={TAROT_COLORS.gold} opacity={0.3}>
              {symbol}
            </SvgText>
          );
        })}
      </Svg>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(45, 27, 78, 0.35)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
});
