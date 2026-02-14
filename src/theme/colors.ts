export const colors = {
  // Backgrounds
  background: '#FDFBF7',        // Warm Cream (NOT pure white)
  surface: '#F5F0E8',            // Warm Linen (cards)
  surfaceAlt: '#EDE7DB',         // Warm Sand (secondary cards)

  // Text
  textPrimary: '#1A1A2E',        // Deep Indigo (NOT pure black)
  textSecondary: '#6B6B80',      // Muted Indigo
  textMuted: '#9B9BAD',          // Soft Gray

  // Primary (Cosmic Purple)
  primary: '#8B5CF6',
  primaryLight: '#EDE9FE',       // Lavender Mist
  primaryDark: '#7C3AED',
  primaryHover: '#9D6FF8',

  // Secondary (Celestial Cyan)
  secondary: '#06B6D4',
  secondaryLight: '#E0F7FA',

  // Accents
  accentGold: '#D4A547',         // Warm Gold (jewelry tone)
  accentGoldLight: '#FDF4E3',    // Golden Cream
  accentRose: '#E8788A',         // Soft Rose
  accentRoseLight: '#FDF0F2',    // Rose Cream

  // Zodiac Elements
  fire: '#E8664D',               // Warm Terracotta
  earth: '#6B8E6B',              // Sage
  air: '#D4A547',                // Gold
  water: '#5B8DB8',              // Dusty Blue

  // Status
  success: '#4CAF7D',            // Sage Green
  warning: '#E5A53D',            // Amber
  error: '#D4574E',              // Soft Red
  info: '#5B8DB8',               // Dusty Blue

  // Borders
  border: '#E5DFD5',             // Warm light gray
  borderDark: '#D4CBBB',

  // Overlays
  overlay: 'rgba(26, 26, 46, 0.7)',
  scrim: 'rgba(253, 251, 247, 0.95)',

  // White (for text on colored backgrounds)
  white: '#FFFFFF',
  black: '#1A1A2E',
} as const;

export type ColorToken = keyof typeof colors;
