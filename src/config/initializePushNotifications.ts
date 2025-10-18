/**
 * Push Notification Initialization
 * 푸시 알림 초기화 로직
 */

import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/src/utils/pushNotifications';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import { useRefreshStore } from '@/src/store/useRefreshStore';

/**
 * 푸시 알림 핸들러 설정
 * 앱이 foreground일 때 알림 표시 방식 설정
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 푸시 토큰 등록
 * 권한 요청 및 토큰 획득 후 스토어에 저장
 */
export async function registerPushToken(): Promise<void> {
  try {
    const pushToken = await registerForPushNotificationsAsync();

    if (!pushToken || typeof pushToken !== 'string' || pushToken.length === 0) {
      console.error('[Push] Invalid token - check permissions');
      return;
    }

    // Force evaluation to prevent JS engine optimization
    void pushToken.length;

    // Set token in store
    useAuthStore.getState().setPushToken(pushToken);
    console.log('[Push] Token registered successfully');
  } catch (error) {
    console.error('[Push] Failed to register token:', error);
  }
}

/**
 * 알림 수신 리스너 등록
 * 앱이 foreground일 때 알림을 받으면 실행
 */
function setupNotificationReceivedListener() {
  return Notifications.addNotificationReceivedListener((notification) => {
    console.log('=============================================');
    console.log('📩 [Notification Received - Foreground]');
    console.log('Title:', notification.request.content.title);
    console.log('Body:', notification.request.content.body);
    console.log('Data:', JSON.stringify(notification.request.content.data));
    console.log('=============================================');

    // 서버에서 최신 안읽은 알림 개수 조회 (상단 알림 뱃지)
    const { fetchUnreadCount } = useNotificationStore.getState();
    fetchUnreadCount();

    // 전역 새로고침 트리거
    // - TrainerHome: 운영 일정, 자동 스케줄링, 취소 요청 등
    // - TabLayout: 담당자 요청 목록 (하단 회원관리 탭 뱃지)
    const { triggerRefresh } = useRefreshStore.getState();
    triggerRefresh();

    console.log('🔄 [Notification] Triggered global refresh (TrainerHome + TabLayout)');
  });
}

/**
 * 알림 응답 리스너 등록
 * 사용자가 알림을 탭했을 때 실행
 */
function setupNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('=============================================');
    console.log('👆 [Notification Tapped - User Response]');
    console.log('Title:', response.notification.request.content.title);
    console.log('Body:', response.notification.request.content.body);
    console.log('Data:', JSON.stringify(response.notification.request.content.data));
    console.log('Action Identifier:', response.actionIdentifier);
    console.log('=============================================');

    // TODO: 알림 데이터에 따라 특정 화면으로 네비게이션
    // const data = response.notification.request.content.data;
    // if (data.type === 'training_schedule') {
    //   router.push(`/training-schedule/${data.scheduleId}`);
    // }
  });
}

/**
 * 푸시 알림 리스너 초기화
 * 알림 수신 및 응답 리스너 등록
 * @returns cleanup 함수 (리스너 제거용)
 */
export function setupNotificationListeners(): () => void {
  const notificationListener = setupNotificationReceivedListener();
  const responseListener = setupNotificationResponseListener();

  console.log('[Push] Notification listeners registered');

  // Cleanup 함수 반환
  return () => {
    notificationListener.remove();
    responseListener.remove();
    console.log('[Push] Notification listeners removed');
  };
}

/**
 * 푸시 알림 전체 초기화
 * 핸들러 설정 + 토큰 등록 + 리스너 등록
 * @returns cleanup 함수
 */
export async function initializePushNotifications(): Promise<() => void> {
  // 1. 핸들러 설정 (foreground 알림 표시 방식)
  setupNotificationHandler();

  // 2. 푸시 토큰 등록 (비동기로 백그라운드 실행)
  await registerPushToken();

  // 3. 리스너 등록 및 cleanup 함수 반환
  return setupNotificationListeners();
}
