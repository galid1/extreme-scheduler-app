/**
 * Notification Service
 * 알림 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  UnreadNotificationCountResponse,
  UnreadNotificationListResponse,
  ReadNotificationListResponse,
  ReadNotificationResponse,
} from '@/src/types/api';

class NotificationService {
  /**
   * 안읽은 알림 개수 조회
   * GET /api/v1/notifications/unread/count
   */
  async getUnreadCount(): Promise<UnreadNotificationCountResponse> {
    const response = await apiClient.get<UnreadNotificationCountResponse>(
      '/api/v1/notifications/unread/count'
    );
    return response;
  }

  /**
   * 안읽은 알림 목록 조회 (무한 스크롤)
   * GET /api/v1/notifications/unread
   * @param lastNotificationId - 마지막으로 조회한 알림 ID (무한 스크롤용)
   * @param size - 한 번에 가져올 알림 개수 (기본값: 20)
   */
  async getUnreadNotifications(
    lastNotificationId?: number | null,
    size: number = 20
  ): Promise<UnreadNotificationListResponse> {
    const params = new URLSearchParams();

    if (lastNotificationId) {
      params.append('lastNotificationId', lastNotificationId.toString());
    }
    params.append('size', size.toString());

    const response = await apiClient.get<any>(
      `/api/v1/notifications/unread?${params.toString()}`
    );

    // Add isRead: false to all unread notifications
    return {
      ...response,
      notifications: response.notifications.map((notification: any) => ({
        ...notification,
        isRead: false,
      })),
    };
  }

  /**
   * 읽은 알림 목록 조회 (무한 스크롤)
   * GET /api/v1/notifications/read
   * @param lastNotificationId - 마지막으로 조회한 알림 ID (무한 스크롤용)
   * @param size - 한 번에 가져올 알림 개수 (기본값: 20)
   */
  async getReadNotifications(
    lastNotificationId?: number | null,
    size: number = 20
  ): Promise<ReadNotificationListResponse> {
    const params = new URLSearchParams();

    if (lastNotificationId) {
      params.append('lastNotificationId', lastNotificationId.toString());
    }
    params.append('size', size.toString());

    const response = await apiClient.get<any>(
      `/api/v1/notifications/read?${params.toString()}`
    );

    // Add isRead: true to all read notifications
    return {
      ...response,
      notifications: response.notifications.map((notification: any) => ({
        ...notification,
        isRead: true,
      })),
    };
  }

  /**
   * 알림 읽음 처리
   * PUT /api/v1/notifications/{notificationId}/read
   * @param notificationId - 읽음 처리할 알림 ID
   */
  async markAsRead(notificationId: number): Promise<ReadNotificationResponse> {
    const response = await apiClient.put<ReadNotificationResponse>(
      `/api/v1/notifications/${notificationId}/read`,
      {}
    );
    return response;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
