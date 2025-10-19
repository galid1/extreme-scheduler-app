/**
 * Push Notification Initialization
 * 푸시 알림 초기화 로직
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { registerForPushNotificationsAsync } from '@/src/utils/pushNotifications';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import { useRefreshStore } from '@/src/store/useRefreshStore';
import { useTrainingStore } from '@/src/store/useTrainingStore';
import { NotificationType } from '@/src/types/api';
import { getCurrentWeek } from '@/src/utils/dateUtils';

/**
 * Android Notification Channel 설정
 * Android 8.0 (API 26) 이상에서 필요
 */
async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
    console.log('[Push] Android notification channel configured');
  }
}

/**
 * 푸시 알림 핸들러 설정
 * 앱이 foreground일 때 알림 표시 방식 설정
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      // Android notification priority
      priority: Notifications.AndroidNotificationPriority.HIGH,
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
 * Notification Type에 따라 적절한 화면으로 네비게이션
 */
function handleNotificationNavigation(data: any): void {
  const notificationType = data?.notificationType as NotificationType | undefined;

  if (!notificationType) {
    console.warn('[Navigation] No notification type found, navigating to notifications list');
    router.push('/notifications');
    return;
  }

  console.log(`[Navigation] Handling notification type: ${notificationType}`);

  try {
    switch (notificationType) {
      // 트레이너 배정 요청 (트레이너가 받는 알림)
      case NotificationType.TRAINER_ASSIGNMENT_REQUEST:
        router.push('/assignment-requests');
        break;

      // 트레이너 배정 수락됨 (회원이 받는 알림)
      case NotificationType.TRAINER_ASSIGNMENT_ACCEPTED:
        router.push('/trainer-profile');
        break;

      // 트레이너 배정 거절됨 (회원이 받는 알림)
      case NotificationType.TRAINER_ASSIGNMENT_REJECTED:
        router.push('/notifications');
        break;

      // 스케줄 변경
      case NotificationType.SCHEDULE_CHANGED:
        const nextWeekForScheduleChange = getCurrentWeek() + 1;
        useTrainingStore.getState().setCurrentWeek(nextWeekForScheduleChange);
        router.push('/training-schedule');
        break;

      // 자동 스케줄링 확정
      case NotificationType.AUTO_SCHEDULE_FIXED:
        // 다음 주차로 설정하고 training-schedule로 이동
        const nextWeek = getCurrentWeek() + 1;
        useTrainingStore.getState().setCurrentWeek(nextWeek);
        router.push('/training-schedule');
        break;

      // 자동 스케줄링 취소됨
      case NotificationType.AUTO_SCHEDULE_CANCELLED:
        // 계정 타입에 따라 홈 화면으로
        const accountType = useAuthStore.getState().account?.accountType;
        if (accountType === 'TRAINER') {
          router.push('/(tabs)/trainer/TrainerHome');
        } else {
          router.push('/(tabs)/member/MemberHome');
        }
        break;

      // 취소 요청 승인/거절
      case NotificationType.CANCEL_REQUEST_APPROVED:
      case NotificationType.CANCEL_REQUEST_REJECTED:
        const nextWeekForCancelRequest = getCurrentWeek() + 1;
        useTrainingStore.getState().setCurrentWeek(nextWeekForCancelRequest);
        router.push('/training-schedule');
        break;

      // 알 수 없는 타입은 알림 목록으로
      default:
        console.warn(`[Navigation] Unknown notification type: ${notificationType}`);
        router.push('/notifications');
        break;
    }
  } catch (error) {
    console.error('[Navigation] Failed to navigate:', error);
    router.push('/notifications');
  }
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

    // 알림 데이터에 따라 특정 화면으로 네비게이션
    const data = response.notification.request.content.data;
    handleNotificationNavigation(data);
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
 * 핸들러 설정 + Android 채널 설정 + 토큰 등록 + 리스너 등록
 * @returns cleanup 함수
 */
export async function initializePushNotifications(): Promise<() => void> {
  // 1. Android Notification Channel 설정
  await setupAndroidNotificationChannel();

  // 2. 핸들러 설정 (foreground 알림 표시 방식)
  setupNotificationHandler();

  // 3. 푸시 토큰 등록 (비동기로 백그라운드 실행)
  await registerPushToken();

  // 4. 리스너 등록 및 cleanup 함수 반환
  return setupNotificationListeners();
}
