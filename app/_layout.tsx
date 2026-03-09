import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Header options for dark theme
const darkHeaderOptions = {
  headerStyle: {
    backgroundColor: '#1a1a1a',
  },
  headerTintColor: '#ffffff',
  headerTitleStyle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main Tab Navigation */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Modal Screen */}
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
            ...darkHeaderOptions,
          }}
        />

        {/* Workout Logging Flow - Modal Presentation Style */}
        <Stack.Screen
          name="select-category"
          options={{
            presentation: 'modal',
            title: 'Select Category',
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="select-muscle"
          options={{
            presentation: 'modal',
            title: 'Select Muscle Group',
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="select-exercise"
          options={{
            presentation: 'modal',
            title: 'Select Exercise',
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="log-exercise"
          options={{
            presentation: 'modal',
            title: 'Log Exercise',
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="exercise-history"
          options={{
            title: 'Exercise History',
            presentation: 'card',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#ffffff',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
