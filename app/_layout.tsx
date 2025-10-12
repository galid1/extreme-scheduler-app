import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {Stack, useRouter, useSegments} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import 'react-native-reanimated';
import {useEffect, useState} from 'react';

import {useColorScheme} from '@/hooks/use-color-scheme';
import {useAuthStore} from '@/src/store/useAuthStore';
import {useConfigStore} from '@/src/store/useConfigStore';
import authService from '@/src/services/api/auth.service';
import apiClient from '@/src/services/api/client';
import {initializeAuth} from '@/src/config/initializeAuth';
import {initializePushNotifications} from '@/src/config/initializePushNotifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { setAccountData, token, account } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize auth on app start
  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
        setIsHydrated(true);
      } catch (error) {
        console.error('[App] Auth initialization failed:', error);
        setIsHydrated(true); // Continue even if auth fails
      }
    };

    init();
  }, []);

  // Initialize push notifications on app start
  useEffect(() => {
    const cleanup = initializePushNotifications();

    // Cleanup on unmount
    return cleanup;
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      console.log('Waiting for store hydration...');
      return;
    }

    const loadUserData = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const authStore = useAuthStore.getState();

      // 토큰과 계정 정보가 없고, 인증 화면에 있지 않은 경우
      if (!authStore.token && !authStore.account && !inAuthGroup) {
        // Redirect to auth if not authenticated
        setTimeout(() => router.replace('/(auth)/phone-auth'), 0);
      } else if (authStore.token) { // 인증을 통해, token이 존재하는 경우
        // Load user data if token exists but account data is not loaded
        if (!authStore.account && authStore.token) {
          // Skip API call if in mock mode or has mock token
            try {
              // Set token in API client
              await apiClient.setAuthToken(authStore.token);

              // Get current user data
              const userResponse = await authService.getCurrentUser();
              setAccountData({
                account: userResponse.account,
                trainer: userResponse.trainer,
                member: userResponse.member,
              });
            } catch (error) {
              console.error('Failed to load user data:', error);
              // If failed to load user data, might be invalid token
              // You may want to clear the token and redirect to login
            }
        }
        // 인증 처리가 되었고, 인증 화면에 있는 경우 탭 화면으로 리다이렉트
        if (inAuthGroup) {
          // Redirect to tabs if authenticated and in auth group
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
      }
    };

    loadUserData();
  }, [isHydrated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trainer-profile" options={{ headerShown: false }} />
        <Stack.Screen name="assignment-requests" options={{ headerShown: false }} />
        <Stack.Screen name="auto-scheduling" options={{ headerShown: false }} />
        <Stack.Screen name="training-schedule" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
