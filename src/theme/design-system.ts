/**
 * VEYa — Unified Design System
 * 
 * SINGLE SOURCE OF TRUTH for all design tokens.
 * ALL screens MUST import from here for consistency.
 * 
 * Theme: Premium Light (Warm Cream + Gold accents)
 * Inspired by: Glossier, Aesop, luxury journals
 */

// ─────────────────────────────────────────────────────────────
// COLORS — Light Premium Theme
// ─────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  background: '#FDFBF7',        // Warm Cream (primary background)
  surface: '#F5F0E8',           // Warm Linen (cards, inputs)
  surfaceAlt: '#EDE7DB',        // Warm Sand (secondary cards)
  surfaceElevated: '#FFFFFF',   // White (elevated cards)

  // Text
  textPrimary: '#1A1A2E',       // Deep Indigo (headings)
  textSecondary: '#6B6B80',     // Muted Indigo (body)
  textMuted: '#9B9BAD',         // Soft Gray (captions)
  textOnDark: '#FFFFFF',        // White (on colored backgrounds)
  textOnPrimary: '#FFFFFF',     // White (on primary buttons)

  // Primary (Cosmic Purple)
  primary: '#8B5CF6',
  primaryLight: '#EDE9FE',
  primaryDark: '#7C3AED',
  primaryMuted: 'rgba(139, 92, 246, 0.1)',

  // Accent Gold (Premium touch)
  accentGold: '#D4A547',
  accentGoldLight: '#FDF4E3',
  accentGoldMuted: 'rgba(212, 165, 71, 0.15)',

  // Accent Rose
  accentRose: '#E8788A',
  accentRoseLight: '#FDF0F2',

  // Zodiac Elements
  fire: '#E8664D',
  earth: '#6B8E6B',
  air: '#D4A547',
  water: '#5B8DB8',

  // Status
  success: '#4CAF7D',
  warning: '#E5A53D',
  error: '#D4574E',
  info: '#5B8DB8',

  // Borders
  border: '#E5DFD5',
  borderFocused: '#D4A547',
  borderMuted: 'rgba(229, 223, 213, 0.5)',

  // Overlays
  overlay: 'rgba(26, 26, 46, 0.5)',
  scrim: 'rgba(253, 251, 247, 0.95)',

  // Input states
  inputBackground: '#FFFFFF',
  inputBorder: '#E5DFD5',
  inputBorderFocused: '#D4A547',
  inputPlaceholder: '#9B9BAD',

  // Disabled states
  disabled: 'rgba(26, 26, 46, 0.3)',
  disabledBackground: '#F5F0E8',
} as const;

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────

export const typography = {
  fonts: {
    // Display (headings, titles)
    display: 'PlayfairDisplay-Bold',
    displaySemiBold: 'PlayfairDisplay-SemiBold',
    displayRegular: 'PlayfairDisplay-Regular',
    displayItalic: 'PlayfairDisplay-Italic',

    // Body (everything else)
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
    bodyBold: 'Inter-Bold',
  },
  sizes: {
    // Display sizes
    display1: 34,
    display2: 28,
    display3: 24,

    // Heading sizes
    heading1: 22,
    heading2: 20,
    heading3: 18,

    // Body sizes
    body: 16,
    bodySmall: 14,

    // Caption sizes
    caption: 13,
    tiny: 11,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// ANIMATION DURATIONS
// ─────────────────────────────────────────────────────────────

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

// ─────────────────────────────────────────────────────────────
// COMMON STYLES
// ─────────────────────────────────────────────────────────────

export const commonStyles = {
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Card styles
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },

  cardMuted: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },

  // Button styles
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  buttonGold: {
    backgroundColor: colors.accentGold,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Input styles
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.body,
    fontFamily: typography.fonts.body,
    color: colors.textPrimary,
  },

  inputFocused: {
    borderColor: colors.inputBorderFocused,
    borderWidth: 2,
  },

  // Text styles
  textDisplay: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display1,
    color: colors.textPrimary,
    lineHeight: typography.sizes.display1 * typography.lineHeights.tight,
  },

  textHeading: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading1,
    color: colors.textPrimary,
  },

  textBody: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
  },

  textCaption: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// ZODIAC COLORS
// ─────────────────────────────────────────────────────────────

export const zodiacColors: Record<string, string> = {
  Aries: colors.fire,
  Leo: colors.fire,
  Sagittarius: colors.fire,
  Taurus: colors.earth,
  Virgo: colors.earth,
  Capricorn: colors.earth,
  Gemini: colors.air,
  Libra: colors.air,
  Aquarius: colors.air,
  Cancer: colors.water,
  Scorpio: colors.water,
  Pisces: colors.water,
};

export const elementColors = {
  Fire: colors.fire,
  Earth: colors.earth,
  Air: colors.air,
  Water: colors.water,
};

// ─────────────────────────────────────────────────────────────
// PROGRESS INDICATOR STYLES
// ─────────────────────────────────────────────────────────────

export const progressDots = {
  container: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accentGold,
  },
  dotCompleted: {
    backgroundColor: colors.primary,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  commonStyles,
  zodiacColors,
  elementColors,
  progressDots,
};
