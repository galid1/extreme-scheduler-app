import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const authenticated = checkAuth();

    if (!authenticated && !inAuthGroup) {
      // Redirect to auth if not authenticated
      setTimeout(() => router.replace('/(auth)/phone-auth'), 0);
    } else if (authenticated && inAuthGroup) {
      // Redirect to tabs if authenticated
      setTimeout(() => router.replace('/(tabs)'), 0);
    }
  }, [segments, isAuthenticated, checkAuth, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
