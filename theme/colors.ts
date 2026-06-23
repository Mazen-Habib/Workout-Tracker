// ==========================================
// SEMANTIC COLOR PALETTES
// Minimal monochrome surfaces + a single indigo accent.
// Neutral ramp = Zinc (cool grays) for an editorial, calm feel.
// ==========================================

export type ThemeColors = {
  // Surfaces
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;

  // Borders / dividers
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Accent (single brand color)
  accent: string;
  accentText: string;
  accentSoft: string;
  accentBorder: string;

  // Status
  danger: string;
  dangerSoft: string;
  dangerText: string;
  success: string;
  warning: string;

  // Misc
  overlay: string;
  shadow: string;
  skeleton: string;

  // Data-viz palette (distinct hues for charts/pie slices)
  chart: string[];
};

export const lightColors: ThemeColors = {
  background: '#F6F6F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F1F3',
  surfaceElevated: '#FFFFFF',

  border: '#EAEAEC',
  borderStrong: '#DCDCE0',

  text: '#18181B',
  textSecondary: '#5C5C66',
  textMuted: '#9A9AA3',
  textInverse: '#FFFFFF',

  accent: '#4F46E5',
  accentText: '#FFFFFF',
  accentSoft: '#EEEDFD',
  accentBorder: '#DAD7FB',

  danger: '#DC2626',
  dangerSoft: '#FCECEC',
  dangerText: '#B91C1C',
  success: '#16A34A',
  warning: '#D97706',

  overlay: 'rgba(9, 9, 11, 0.45)',
  shadow: '#0B0B16',
  skeleton: '#ECECEF',

  chart: ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
};

export const darkColors: ThemeColors = {
  background: '#09090B',
  surface: '#161618',
  surfaceMuted: '#1E1E22',
  surfaceElevated: '#202024',

  border: '#27272A',
  borderStrong: '#3A3A40',

  text: '#FAFAFA',
  textSecondary: '#A8A8B2',
  textMuted: '#6F6F78',
  textInverse: '#09090B',

  accent: '#7C75F0',
  accentText: '#FFFFFF',
  accentSoft: 'rgba(124, 117, 240, 0.16)',
  accentBorder: 'rgba(124, 117, 240, 0.36)',

  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  dangerText: '#FCA5A5',
  success: '#4ADE80',
  warning: '#FBBF24',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  skeleton: '#26262B',

  chart: ['#7C75F0', '#38BDF8', '#34D399', '#FBBF24', '#F87171', '#A78BFA'],
};
