// ==========================================
// THEME ASSEMBLY
// Combines color palette + tokens + computed shadows into one object.
// ==========================================

import { Platform, ViewStyle } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';
import { durations, radius, spacing, springs, typography } from './tokens';

export type ThemeMode = 'light' | 'dark';

const makeShadows = (colors: ThemeColors, mode: ThemeMode) => {
  // Shadows read softer on light; on dark we lean on elevation + borders.
  const opacity = mode === 'light' ? 1 : 1;
  const sm: ViewStyle = {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: mode === 'light' ? 0.05 : 0.4,
    shadowRadius: 3,
    elevation: 1,
  };
  const md: ViewStyle = {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: mode === 'light' ? 0.08 : 0.5,
    shadowRadius: 16,
    elevation: 4,
  };
  const lg: ViewStyle = {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: mode === 'light' ? 0.12 : 0.6,
    shadowRadius: 28,
    elevation: 10,
  };
  void opacity;
  return { none: {} as ViewStyle, sm, md, lg };
};

export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  durations: typeof durations;
  springs: typeof springs;
  shadow: ReturnType<typeof makeShadows>;
  // Platform-aware monospace-ish/system font family hook (kept system for now).
  fontFamily: string | undefined;
};

const baseFont = Platform.select({ ios: 'System', default: undefined });

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
  durations,
  springs,
  shadow: makeShadows(lightColors, 'light'),
  fontFamily: baseFont,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  typography,
  durations,
  springs,
  shadow: makeShadows(darkColors, 'dark'),
  fontFamily: baseFont,
};

export const getTheme = (mode: ThemeMode): Theme => (mode === 'dark' ? darkTheme : lightTheme);
