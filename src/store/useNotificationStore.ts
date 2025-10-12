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

  // Actions
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

const initialState = {
  unreadNotifications: [],
  readNotifications: [],
  unreadCount: 0,
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
      console.log('[Notification] Unread count updated:', response.unreadCount);
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
}));
