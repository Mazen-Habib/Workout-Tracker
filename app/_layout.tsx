import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';


export const unstable_settings = {
  anchor: '(tabs)',
};

const lightHeaderOptions = {
  headerStyle: {
    backgroundColor: '#ffffff',
  },
  headerTintColor: '#0f172a',
  headerTitleStyle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '600' as const,
  },
};

export default function RootLayout() {
  const customTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#f8fafc',
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ThemeProvider value={customTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: '#f8fafc' },
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#0f172a',
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
            ...lightHeaderOptions,
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
              backgroundColor: '#f8fafc',
            },
            ...lightHeaderOptions,
          }}
        />

        <Stack.Screen
          name="select-muscle"
          options={{
            presentation: 'modal',
            animation: 'none',
            title: 'Select Muscle Group',
            contentStyle: {
              backgroundColor: '#f8fafc',
            },
            ...lightHeaderOptions,
          }}
        />

        <Stack.Screen
          name="select-exercise"
          options={{
            presentation: 'modal',
            animation: 'none',
            title: 'Select Exercise',
            contentStyle: {
              backgroundColor: '#f8fafc',
            },
            ...lightHeaderOptions,
          }}
        />

        <Stack.Screen
          name="log-exercise"
          options={{
            presentation: 'modal',
            animation: 'none',
            title: 'Log Exercise',
            contentStyle: {
              backgroundColor: '#f8fafc',
            },
            ...lightHeaderOptions,
          }}
        />

        <Stack.Screen
          name="exercise-history"
          options={{
            title: 'Exercise History',
            presentation: 'card',
            contentStyle: {
              backgroundColor: '#f8fafc',
            },
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#0f172a',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </View>
  );
}
