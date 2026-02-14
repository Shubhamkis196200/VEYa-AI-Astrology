export { colors } from './colors';
export { typography, textStyles } from './typography';
export { spacing } from './spacing';
export { shadows } from './shadows';
export { borderRadius } from './borderRadius';

// Convenience re-export as single theme object
import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { borderRadius } from './borderRadius';

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  shadows,
  borderRadius,
} as const;

export type Theme = typeof theme;
