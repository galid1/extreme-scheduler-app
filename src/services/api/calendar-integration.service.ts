/**
 * Calendar Integration Service
 * 캘린더 연동 관련 API 호출 서비스
 */

import apiClient from './client';
import {
    ConnectGoogleCalendarRequest,
    ConnectGoogleCalendarResponse,
} from '../../types/api';

class CalendarIntegrationService {
    /**
     * Google Calendar 연동
     * @param authorizationCode - Google OAuth serverAuthCode
     * @returns 연동 결과
     */
    async connectGoogleCalendar(authorizationCode: string): Promise<ConnectGoogleCalendarResponse> {
        const request: ConnectGoogleCalendarRequest = {
            authorizationCode: authorizationCode,
        };

        try {
            const response = await apiClient.put<ConnectGoogleCalendarResponse>(
                '/api/v1/integrations/calendar/google/connect',
                request
            );
            return response;
        } catch (error) {
            console.error('[CalendarIntegrationService] Failed to connect Google Calendar:', error);
            throw error;
        }
    }

    /**
     * Google Calendar 연동 해제
     * @returns 연동 해제 결과
     */
    async disconnectGoogleCalendar(): Promise<void> {
        try {
            await apiClient.delete('/api/v1/integrations/calendar/google/disconnect');
            console.log('[CalendarIntegrationService] Google Calendar disconnected successfully');
        } catch (error) {
            console.error('[CalendarIntegrationService] Failed to disconnect Google Calendar:', error);
            throw error;
        }
    }
}

export const calendarIntegrationService = new CalendarIntegrationService();
export default calendarIntegrationService;
