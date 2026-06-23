import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '@/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const theme = useTheme();

  const navTheme = {
    ...(theme.mode === 'dark' ? NavDarkTheme : NavLightTheme),
    colors: {
      ...(theme.mode === 'dark' ? NavDarkTheme : NavLightTheme).colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.accent,
    },
  };

  const headerOptions = {
    headerStyle: { backgroundColor: theme.colors.surface },
    headerTintColor: theme.colors.text,
    headerTitleStyle: { color: theme.colors.text, fontSize: 18, fontWeight: '600' as const },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background },
  };

  // Quick cross-fade between pushed screens — the snappy content "pop" comes
  // from each screen's own FadeIn/Appear entrances, not a heavy slide.
  const popOptions = { ...headerOptions, animation: 'fade' as const, animationDuration: 180 };

  return (
    <NavThemeProvider value={navTheme}>
      <Stack screenOptions={popOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ ...headerOptions, presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="select-category" options={{ ...popOptions, title: 'Select Category' }} />
        <Stack.Screen name="select-muscle" options={{ ...popOptions, title: 'Select Muscle Group' }} />
        <Stack.Screen name="select-exercise" options={{ ...popOptions, title: 'Select Exercise' }} />
        <Stack.Screen name="log-exercise" options={{ ...popOptions, title: 'Log Exercise' }} />
        <Stack.Screen name="exercise-history" options={{ ...popOptions, title: 'Exercise History' }} />
        <Stack.Screen name="edit-workout" options={{ ...popOptions, title: 'Edit Workout' }} />
      </Stack>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

// Themed root background prevents a white flash behind screen transitions.
function ThemedRoot() {
  const theme = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
