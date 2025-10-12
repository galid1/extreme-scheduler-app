/**
 * Notification Store
 * 알림 상태 관리
 */

import {create} from 'zustand';
import {NotificationDto} from '@/src/types/api';
import notificationService from '@/src/services/api/notification.service';

interface NotificationState {
  // 알림 데이터
  unreadNotifications: NotificationDto[];
  readNotifications: NotificationDto[];
  unreadCount: number;

  // 무한 스크롤 상태
  unreadHasNext: boolean;
  unreadLastId: number | null;
  readHasNext: boolean;
  readLastId: number | null;

  // 로딩 상태
  isLoadingUnread: boolean;
  isLoadingRead: boolean;
  isRefreshingUnread: boolean;
  isRefreshingRead: boolean;

  // Actions
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  fetchUnreadNotifications: (refresh?: boolean) => Promise<void>;
  fetchReadNotifications: (refresh?: boolean) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  unreadNotifications: [],
  readNotifications: [],
  unreadCount: 0,
  unreadHasNext: true,
  unreadLastId: null,
  readHasNext: true,
  readLastId: null,
  isLoadingUnread: false,
  isLoadingRead: false,
  isRefreshingUnread: false,
  isRefreshingRead: false,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  /**
   * 안읽은 알림 개수 조회 (서버 API 호출)
   */
  fetchUnreadCount: async () => {
    try {
      const response = await notificationService.getUnreadCount();
      set({ unreadCount: response.unreadCount });
    } catch (error) {
      console.error('[Notification] Failed to fetch unread count:', error);
    }
  },

  /**
   * 안읽은 알림 개수 직접 설정
   */
  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  /**
   * 안읽은 알림 목록 조회
   * @param refresh - true면 처음부터 다시 로드, false면 다음 페이지 로드
   */
  fetchUnreadNotifications: async (refresh = false) => {
    const { unreadHasNext, unreadLastId, isLoadingUnread, isRefreshingUnread } = get();

    // 이미 로딩 중이거나, 다음 페이지가 없으면 중단
    if (isLoadingUnread || isRefreshingUnread || (!refresh && !unreadHasNext)) {
      return;
    }

    if (refresh) {
      set({ isRefreshingUnread: true });
    } else {
      set({ isLoadingUnread: true });
    }

    try {
      const lastId = refresh ? null : unreadLastId;
      const response = await notificationService.getUnreadNotifications(lastId, 20);

      set((state) => ({
        unreadNotifications: refresh
          ? response.notifications
          : [...state.unreadNotifications, ...response.notifications],
        unreadHasNext: response.hasNext,
        unreadLastId: response.lastNotificationId,
      }));
    } catch (error) {
      console.error('[Notification] Failed to fetch unread notifications:', error);
    } finally {
      set({ isLoadingUnread: false, isRefreshingUnread: false });
    }
  },

  /**
   * 읽은 알림 목록 조회
   * @param refresh - true면 처음부터 다시 로드, false면 다음 페이지 로드
   */
  fetchReadNotifications: async (refresh = false) => {
    const { readHasNext, readLastId, isLoadingRead, isRefreshingRead } = get();

    // 이미 로딩 중이거나, 다음 페이지가 없으면 중단
    if (isLoadingRead || isRefreshingRead || (!refresh && !readHasNext)) {
      return;
    }

    if (refresh) {
      set({ isRefreshingRead: true });
    } else {
      set({ isLoadingRead: true });
    }

    try {
      const lastId = refresh ? null : readLastId;
      const response = await notificationService.getReadNotifications(lastId, 20);

      set((state) => ({
        readNotifications: refresh
          ? response.notifications
          : [...state.readNotifications, ...response.notifications],
        readHasNext: response.hasNext,
        readLastId: response.lastNotificationId,
      }));
    } catch (error) {
      console.error('[Notification] Failed to fetch read notifications:', error);
    } finally {
      set({ isLoadingRead: false, isRefreshingRead: false });
    }
  },

  /**
   * 알림 읽음 처리
   * @param notificationId - 읽음 처리할 알림 ID
   */
  markAsRead: async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);

      // 로컬 상태 업데이트: unread에서 read로 이동
      set((state) => {
        const notification = state.unreadNotifications.find(
          (n) => n.notificationId === notificationId
        );

        if (!notification) return state;

        return {
          unreadNotifications: state.unreadNotifications.filter(
            (n) => n.notificationId !== notificationId
          ),
          readNotifications: [
            { ...notification, isRead: true, readAt: new Date().toISOString() },
            ...state.readNotifications,
          ],
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });
    } catch (error) {
      console.error('[Notification] Failed to mark as read:', error);
      throw error;
    }
  },

  /**
   * 스토어 초기화
   */
  reset: () => {
    set(initialState);
  },
}));
