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
}

const initialState = {
  unreadNotifications: [],
  readNotifications: [],
  unreadCount: 0,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,
}));
