import { colors } from './colors';

export const typography = {
  // Font Families
  fonts: {
    display: 'PlayfairDisplay-Bold',
    displaySemiBold: 'PlayfairDisplay-SemiBold',
    displayRegular: 'PlayfairDisplay-Regular',
    displayItalic: 'PlayfairDisplay-Italic',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
    bodyBold: 'Inter-Bold',
  },

  // Font Sizes
  sizes: {
    display1: 34,    // Large headlines
    display2: 28,    // Section headlines
    heading1: 26,    // Screen titles
    heading2: 22,    // Card titles
    heading3: 18,    // Small headings
    body: 16,        // Primary reading text
    bodySmall: 14,   // Secondary text
    caption: 13,     // Labels
    tiny: 11,        // Metadata
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// Preset Text Styles
export const textStyles = {
  displayLarge: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display1,
    lineHeight: typography.sizes.display1 * typography.lineHeights.tight,
    color: colors.textPrimary,
  },
  heading: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading1,
    lineHeight: typography.sizes.heading1 * typography.lineHeights.normal,
    color: colors.textPrimary,
  },
  heading2: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading2,
    lineHeight: typography.sizes.heading2 * typography.lineHeights.normal,
    color: colors.textPrimary,
  },
  heading3: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: typography.sizes.heading3,
    lineHeight: typography.sizes.heading3 * typography.lineHeights.normal,
    color: colors.textPrimary,
  },
  bodyReading: {
    fontFamily: typography.fonts.displayRegular,
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    color: colors.textPrimary,
  },
  bodyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.bodySmall,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: typography.letterSpacing.wide,
  },
  caption: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
    color: colors.textMuted,
  },
  tiny: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.tiny,
    lineHeight: typography.sizes.tiny * typography.lineHeights.normal,
    color: colors.textMuted,
  },
} as const;
