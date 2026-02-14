export const spacing = {
  xxxs: 2,    // 2px  - Hairline gaps
  xxs: 4,     // 4px  - Tiny spacing
  xs: 8,      // 8px  - Base unit
  sm: 12,     // 12px
  md: 16,     // 16px - Standard padding
  lg: 24,     // 24px - Card padding
  xl: 32,     // 32px - Section spacing
  xxl: 48,    // 48px - Large spacing
  xxxl: 64,   // 64px - Hero spacing

  // Semantic aliases
  cardPadding: 20,
  screenPadding: 20,
  sectionGap: 24,
} as const;

export type SpacingToken = keyof typeof spacing;
