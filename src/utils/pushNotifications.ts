/**
 * Push Notification Utilities
 * 푸시 알림 토큰 등록 및 관리
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

  // 2. 실제 디바이스 확인
  if (!Device.isDevice) {
    handleRegistrationError('Must use physical device for push notifications');
    return null;
  }

  // 3. 권한 확인 및 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
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
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

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
