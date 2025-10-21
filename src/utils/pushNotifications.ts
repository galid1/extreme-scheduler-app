/**
 * Push Notification Utilities
 * 푸시 알림 토큰 등록 및 관리
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Linking } from 'react-native';

/**
 * 에러 핸들러
 */
function handleRegistrationError(errorMessage: string): void {
  console.error('[Push Notification Error]', errorMessage);
}

/**
 * 푸시 알림 토큰 등록
 * @returns PushTokenInfo 또는 null (실패 시)
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // 1. Android 알림 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 2. 실제 디바이스 확인 (시뮬레이터에서는 조용히 스킵)
  if (!Device.isDevice) {
    console.log('[Push] Skipping push notifications - running on simulator/emulator');
    return null;
  }

  // 3. 권한 확인 및 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 권한이 없는 경우에만 요청 (첫 실행 시)
  if (existingStatus !== 'granted') {
    // iOS/Android: 이미 거절한 경우 팝업이 뜨지 않고 이전 상태 반환
    // 따라서 사용자가 명시적으로 거절한 경우 조용히 실패
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission denied - user needs to enable in Settings');
    handleRegistrationError('Permission not granted to get push token for push notification!');
    return null;
  }

  // 4. 프로젝트 ID 확인
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  if (!projectId) {
    handleRegistrationError('Project ID not found');
    return null;
  }

  // 5. Expo 푸시 토큰 생성
  try {
    const tokenObject = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Force evaluation to prevent optimization
    const pushTokenString = tokenObject?.data ?? null;

    if (!pushTokenString || typeof pushTokenString !== 'string' || pushTokenString.length === 0) {
      handleRegistrationError('Token string is empty or invalid');
      return null;
    }

    console.log('[Push Token]', pushTokenString);
    return pushTokenString;
  } catch (e: unknown) {
    handleRegistrationError(`${e}`);
    return null;
  }
}

/**
 * 푸시 알림 권한 상태 확인
 */
export async function checkPushNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * 앱 설정으로 이동
 * 권한 거절 후 재허용을 위해 사용
 */
export async function openAppSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('[Settings] Failed to open settings:', error);
  }
}
