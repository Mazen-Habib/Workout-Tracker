// ==========================================
// DESIGN TOKENS
// Mode-agnostic scales shared across light & dark themes.
// Inspired by NativeWind/Tailwind spacing + type discipline.
// ==========================================

import { TextStyle } from 'react-native';

// 4pt spacing scale
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 999,
} as const;

// Animation timings (ms) — keep snappy + premium
export const durations = {
  instant: 120,
  fast: 180,
  base: 260,
  slow: 420,
} as const;

// Spring presets for Reanimated / Moti
export const springs = {
  // Subtle press feedback
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  // Content entrances
  gentle: { damping: 20, stiffness: 180, mass: 0.9 },
  // Bouncy emphasis (PR badges, FAB)
  pop: { damping: 12, stiffness: 260, mass: 0.8 },
} as const;

export type TypographyVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline'
  | 'button';

type VariantStyle = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'textTransform'
>;

export const typography: Record<TypographyVariant, VariantStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: 0.1 },
};
