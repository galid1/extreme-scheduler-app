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
import {registerForPushNotificationsAsync} from '@/src/utils/pushNotifications';
import * as Notifications from 'expo-notifications';

// 푸시 알림 핸들러 설정 (앱이 foreground일 때 알림 표시 방식)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { setAccountData, token, account, setPushTokenInfo } = useAuthStore();
  const { mockMode } = useConfigStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for store to hydrate from AsyncStorage
  useEffect(() => {
    // Force set token for testing
    const initializeAuth = async () => {
      try {
        await forceSetToken(); // 로그인, 회원가입을 건너 띄고 싶은 경우에 사용 (mock mode가 아님)
        setIsHydrated(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    // Run initialization immediately
    initializeAuth();
  }, []);

  // Register for push notifications on app start
  useEffect(() => {
    const registerPushToken = async () => {
      try {
        const pushTokenInfo = await registerForPushNotificationsAsync();
        if (pushTokenInfo) {
          setPushTokenInfo(pushTokenInfo);
          console.log('[App] Push token registered and saved to store');
        } else {
          console.error('[App] Push token is null - check permissions!');
        }
      } catch (error) {
        console.error('[App] Failed to register push token:', error);
      }
    };

    registerPushToken();

    // 알림 수신 리스너 (앱이 foreground일 때)
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("=============================================");
      console.log("📩 [Notification Received - Foreground]");
      console.log("Title:", notification.request.content.title);
      console.log("Body:", notification.request.content.body);
      console.log("Data:", JSON.stringify(notification.request.content.data));
      console.log("Full Notification:", JSON.stringify(notification, null, 2));
      console.log("=============================================");
    });

    // 알림 응답 리스너 (사용자가 알림을 탭했을 때)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("=============================================");
      console.log("👆 [Notification Tapped - User Response]");
      console.log("Title:", response.notification.request.content.title);
      console.log("Body:", response.notification.request.content.body);
      console.log("Data:", JSON.stringify(response.notification.request.content.data));
      console.log("Action Identifier:", response.actionIdentifier);
      console.log("Full Response:", JSON.stringify(response, null, 2));
      console.log("=============================================");
    });

    // Cleanup: 컴포넌트 언마운트 시 리스너 제거
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
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
        }
        // 인증 처리가 되었고, 인증 화면에 있는 경우 탭 화면으로 리다이렉트
        if (!mockMode && inAuthGroup) {
          // Redirect to tabs if authenticated and in auth group
          setTimeout(() => router.replace('/(tabs)'), 0);
        }
      }
    };

    loadUserData();
  }, [isHydrated, mockMode]);

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
