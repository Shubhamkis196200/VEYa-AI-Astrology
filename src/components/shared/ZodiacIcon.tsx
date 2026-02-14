/**
 * VEYa — ZodiacIcon
 *
 * Zodiac sign icon/emoji helper used in multiple places.
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '🐏',
  Taurus: '🐂',
  Gemini: '👯',
  Cancer: '🦀',
  Leo: '🦁',
  Virgo: '🌾',
  Libra: '⚖️',
  Scorpio: '🦂',
  Sagittarius: '🏹',
  Capricorn: '🐐',
  Aquarius: '🏺',
  Pisces: '🐟',
};

interface ZodiacIconProps {
  sign: string;
  /** 'symbol' for ♈-style, 'emoji' for 🐏-style */
  variant?: 'symbol' | 'emoji';
  size?: number;
  color?: string;
  style?: TextStyle;
}

export default function ZodiacIcon({
  sign,
  variant = 'symbol',
  size = 16,
  color,
  style,
}: ZodiacIconProps) {
  const map = variant === 'emoji' ? ZODIAC_EMOJIS : ZODIAC_SYMBOLS;
  const char = map[sign] || '✦';

  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {char}
    </Text>
  );
}

/** Utility: get the zodiac symbol for a sign name */
export function getZodiacSymbol(sign: string): string {
  return ZODIAC_SYMBOLS[sign] || '✦';
}

/** Utility: get the zodiac emoji for a sign name */
export function getZodiacEmoji(sign: string): string {
  return ZODIAC_EMOJIS[sign] || '✦';
}

export { ZODIAC_SYMBOLS, ZODIAC_EMOJIS };
