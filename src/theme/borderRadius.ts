export const borderRadius = {
  none: 0,
  xs: 4,      // Small elements
  sm: 8,      // Buttons, inputs
  md: 12,     // Cards
  lg: 16,     // Large cards
  xl: 20,     // Hero cards
  xxl: 24,    // Modals
  full: 9999, // Fully rounded (badges, pills)
} as const;

export type BorderRadiusToken = keyof typeof borderRadius;
