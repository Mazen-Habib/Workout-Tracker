// ==========================================
// THEME PROVIDER + HOOKS
// Holds the user's theme preference ('light' | 'dark' | 'system'),
// resolves it against the OS scheme, and persists the choice.
// ==========================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ImageStyle, StyleSheet, TextStyle, useColorScheme, ViewStyle } from 'react-native';
import { getTheme, Theme, ThemeMode } from './theme';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@theme-preference';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode; // resolved mode actually in use
  preference: ThemePreference; // what the user picked
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void; // quick light <-> dark switch
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setPreferenceState(stored);
        }
      } catch {
        // fall back to system default
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
  }, []);

  const mode: ThemeMode = useMemo(() => {
    if (preference === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return preference;
  }, [preference, systemScheme]);

  const toggle = useCallback(() => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setPreference]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, preference, setPreference, toggle, ready }),
    [theme, mode, preference, setPreference, toggle, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}

/** Access the resolved theme object (colors, spacing, typography, ...). */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Create a theme-aware StyleSheet factory. Mirrors StyleSheet.create's generic
 * constraint so style-literal types (e.g. alignItems) narrow correctly.
 *
 *   const useStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));
 *   // inside component:
 *   const styles = useStyles();
 */
export function makeStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: Theme) => T
) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
