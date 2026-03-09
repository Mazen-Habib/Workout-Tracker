import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="select-category" options={{ title: 'Select Category', headerStyle: { backgroundColor: '#1a1a1a' }, headerTintColor: '#ffffff', headerTitleStyle: { color: '#ffffff' } }} />
        <Stack.Screen name="select-muscle-group" options={{ title: 'Select Muscle Group', headerStyle: { backgroundColor: '#1a1a1a' }, headerTintColor: '#ffffff', headerTitleStyle: { color: '#ffffff' } }} />
        <Stack.Screen name="select-exercise" options={{ title: 'Select Exercise', headerStyle: { backgroundColor: '#1a1a1a' }, headerTintColor: '#ffffff', headerTitleStyle: { color: '#ffffff' } }} />
        <Stack.Screen name="log-exercise" options={{ title: 'Log Exercise', headerStyle: { backgroundColor: '#1a1a1a' }, headerTintColor: '#ffffff', headerTitleStyle: { color: '#ffffff' } }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
