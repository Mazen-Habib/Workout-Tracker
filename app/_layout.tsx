import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
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
  
  const customTheme = colorScheme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#1a1a1a',
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#1a1a1a',
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <ThemeProvider value={customTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: '#1a1a1a' },
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#ffffff',
          }}
        >
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
            animation: 'none',
            title: 'Select Category',
            contentStyle: {
              backgroundColor: '#1a1a1a',
            },
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="select-muscle"
          options={{
            presentation: 'modal',
            animation: 'none',
            title: 'Select Muscle Group',
            contentStyle: {
              backgroundColor: '#1a1a1a',
            },
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="select-exercise"
          options={{
            presentation: 'modal',
            animation: 'none',
            title: 'Select Exercise',
            contentStyle: {
              backgroundColor: '#1a1a1a',
            },
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="log-exercise"
          options={{
            presentation: 'modal',
            animation: 'none',
            title: 'Log Exercise',
            contentStyle: {
              backgroundColor: '#1a1a1a',
            },
            ...darkHeaderOptions,
          }}
        />

        <Stack.Screen
          name="exercise-history"
          options={{
            title: 'Exercise History',
            presentation: 'card',
            contentStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#ffffff',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </View>
  );
}
