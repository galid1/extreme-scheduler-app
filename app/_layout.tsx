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
import {forceSetToken} from '@/src/utils/forceSetToken';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { setAccountData, token, account } = useAuthStore();
  const { mockMode } = useConfigStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for store to hydrate from AsyncStorage
  useEffect(() => {
    // Force set token for testing
    const initializeAuth = async () => {
      try {
        await forceSetToken(); // 로그인, 회원가입을 건너 띄고 싶은 경우에 사용 (mock mode가 아님)
        console.log('=== Force Setting Token ===');
        setIsHydrated(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    // Run initialization immediately
    initializeAuth();
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
          if (mockMode || authStore.token.includes('mock-')) {
            console.log('Mock mode detected, skipping API call');
          } else {
            console.log('Loading user data from server...');
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
              console.log('User data loaded successfully');
            } catch (error) {
              console.error('Failed to load user data:', error);
              // If failed to load user data, might be invalid token
              // You may want to clear the token and redirect to login
            }
          }
        } else {
          console.log('Account data already exists or no token');
          console.log("Account:", JSON.stringify(authStore.account));
          console.log("Trainer:", JSON.stringify(authStore.trainer));
          console.log("Member:", JSON.stringify(authStore.member));
        }

        // 인증 처리가 되었고, 인증 화면에 있는 경우 탭 화면으로 리다이렉트
        if (!mockMode && inAuthGroup) {
          // Redirect to tabs if authenticated and in auth group
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
      }
    };

    loadUserData();
  }, [segments, router, token, account, isHydrated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="trainer-profile" options={{ headerShown: false }} />
        <Stack.Screen name="assignment-requests" options={{ headerShown: false }} />
        <Stack.Screen name="approved-members" options={{ headerShown: false }} />
        <Stack.Screen name="auto-scheduling" options={{ headerShown: false }} />
        <Stack.Screen name="training-schedule" options={{ headerShown: false }} />
        <Stack.Screen name="training-schedule-timeline" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
