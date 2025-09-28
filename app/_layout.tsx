import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/useAuthStore';
import authService from '@/src/services/api/auth.service';
import apiClient from '@/src/services/api/client';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTestToken } from '@/src/utils/setTestToken';
import { forceSetToken } from '@/src/utils/forceSetToken';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { setAccountData, token, account } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for store to hydrate from AsyncStorage
  useEffect(() => {
    // Force set token for testing
    const initializeAuth = async () => {
      try {
        console.log('=== Force Setting Token ===');
        await forceSetToken();
        setIsHydrated(true);
        console.log('===========================');
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

      console.log('=== Auth Debug (After Hydration) ===');
      console.log('isHydrated:', isHydrated);
      console.log('token:', authStore.token);
      console.log('inAuthGroup:', inAuthGroup);
      console.log('segments:', segments);
      console.log('account:', authStore.account);
      console.log('====================================');

      // Check if user is not authenticated (no token and no account)
      if (!authStore.token && !authStore.account && !inAuthGroup) {
        // Redirect to auth if not authenticated
        console.log('Redirecting to phone-auth...');
        setTimeout(() => router.replace('/(auth)/phone-auth'), 0);
      } else if (authStore.token) {
        // Load user data if token exists but account data is not loaded
        if (!authStore.account && authStore.token) {
          console.log('Loading user data from server...');
          try {
            // Set token in API client
            await apiClient.setAuthToken(authStore.token);

            // Get current user data
            const userResponse = await authService.getCurrentUser();
            console.log(`@@@@@################# : ${JSON.stringify(userResponse)}`)
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
        } else {
          console.log('Account data already exists or no token');
          console.log("Account:", JSON.stringify(authStore.account));
          console.log("Trainer:", JSON.stringify(authStore.trainer));
          console.log("Member:", JSON.stringify(authStore.member));
        }

        if (inAuthGroup) {
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
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
