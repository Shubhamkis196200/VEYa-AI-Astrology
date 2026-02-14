/**
 * VEYa — Centralized Design Tokens
 *
 * Re-exports from the theme directory so screens can do a single import.
 * Also provides extended tokens (e.g. card border, cosmic colors) used
 * across multiple screens but not in the base theme.
 */

export { colors } from '@/theme/colors';
export { typography, textStyles } from '@/theme/typography';
export { spacing } from '@/theme/spacing';
export { shadows } from '@/theme/shadows';
export { borderRadius } from '@/theme/borderRadius';
export { theme } from '@/theme';

/**
 * Extended color tokens used across many screens but not in the base palette.
 * These are derived from the core theme colors.
 */
export const extendedColors = {
  // Card styling
  cardBorder: 'rgba(212, 165, 71, 0.12)',
  cardShadow: 'rgba(139, 92, 246, 0.08)',

  // Cosmic palette
  cosmicPurple: '#8B5CF6',
  cosmicPurpleDim: 'rgba(139, 92, 246, 0.25)',
  accentGoldDim: 'rgba(212, 165, 71, 0.3)',

  // Tarot
  tarotGold: '#C9A84C',
  tarotDeepPurple: '#2D1B4E',
  tarotMidPurple: '#4A2D6E',

  // Transit
  transitOpportunity: '#4A9D6E',
  transitChallenge: '#D4942C',
  transitTransformation: '#8B5CF6',

  // Moon
  moonSurface: '#E8E0D4',
  moonShadow: '#C4B8A8',
  moonHighlight: '#F5F0E8',

  // Premium
  premiumGold: '#C9A84C',
  premiumGoldDark: '#B8923E',

  // Ritual
  sunriseOrange: '#F4A261',
  streakFlame: '#FF6B35',
  streakFlameBg: 'rgba(255, 107, 53, 0.08)',
  doGreen: '#4A9D6E',
  doGreenBg: '#F0F9F4',
  journalCream: '#FFF8F0',

  // UI
  tabInactive: '#B8B8C8',
  switchTrack: '#E0D8CC',
  switchTrackActive: 'rgba(139, 92, 246, 0.3)',
  inputBorder: '#DDD8CE',
  inputBorderFocused: '#D4A547',
  disabled: '#C5C0B6',
  pickerHighlight: 'rgba(212, 165, 71, 0.08)',
  pickerBorder: 'rgba(212, 165, 71, 0.25)',
} as const;

/**
 * Element colors for zodiac signs.
 */
export const ELEMENT_COLORS: Record<string, string> = {
  fire: '#E8664D',
  earth: '#6B8E6B',
  air: '#D4A547',
  water: '#5B8DB8',
};
