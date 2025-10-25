/**
 * Calendar Integration Service
 * 캘린더 연동 관련 API 호출 서비스
 */

import apiClient from './client';
import {
    GoogleCalendarIntegrationRequest,
    GoogleCalendarIntegrationResponse,
    NaverCalendarIntegrationRequest,
    NaverCalendarIntegrationResponse,
    GetActiveCalendarIntegrationsResponse,
} from '../../types/api';
import {CalendarPlatformType} from "@/src/types/enums";

class CalendarIntegrationService {
    /**
     * Google Calendar 연동
     * @param authorizationCode - Google OAuth serverAuthCode
     * @returns 연동 결과
     */
    async integrateGoogleCalendar(
        authorizationCode: string,
    ): Promise<GoogleCalendarIntegrationResponse> {
        const request: GoogleCalendarIntegrationRequest = {
            authorizationCode: authorizationCode,
        };

        try {
            const response = await apiClient.put<GoogleCalendarIntegrationResponse>(
                '/api/v1/integrations/calendar/google/integrate',
                request
            );
            return response;
        } catch (error) {
            console.error('[CalendarIntegrationService] Failed to connect Google Calendar:', error);
            throw error;
        }
    }

    /**
     * Naver Calendar 연동
     * @param accessToken - Naver access token
     * @param refreshToken - Naver refresh token
     * @param expiresAt - Token expiration time (ISO 8601 format)
     * @returns 연동 결과
     */
    async integrateNaverCalendar(
        accessToken: string,
        refreshToken: string,
        expiresAt: string
    ): Promise<NaverCalendarIntegrationResponse> {
        const request: NaverCalendarIntegrationRequest = {
            accessToken,
            refreshToken,
            expiresAt,
        };

        try {
            const response = await apiClient.put<NaverCalendarIntegrationResponse>(
                '/api/v1/integrations/calendar/naver/integrate',
                request
            );
            return response;
        } catch (error) {
            console.error('[CalendarIntegrationService] Failed to connect Naver Calendar:', error);
            throw error;
        }
    }

    /**
     * Calendar 연동 해제
     * @param calendarPlatformType - 해제할 캘린더 플랫폼 타입
     * @returns 연동 해제 결과
     */
    async disconnectCalendar(calendarPlatformType: CalendarPlatformType): Promise<void> {
        try {
            await apiClient.delete('/api/v1/integrations/calendar/disconnect', {
                calendarPlatformType: calendarPlatformType
            });
            console.log('[CalendarIntegrationService] Calendar disconnected successfully:', calendarPlatformType);
        } catch (error) {
            console.error('[CalendarIntegrationService] Failed to disconnect calendar:', error);
            throw error;
        }
    }

    /**
     * 현재 활성화된 캘린더 연동 정보 조회
     * @returns 활성화된 캘린더 연동 정보
     */
    async getActiveCalendarIntegrations(): Promise<GetActiveCalendarIntegrationsResponse> {
        try {
            const response = await apiClient.get<GetActiveCalendarIntegrationsResponse>(
                '/api/v1/integrations/calendar'
            );
            console.log('[CalendarIntegrationService] Active calendar integration retrieved:', response);
            return response;
        } catch (error) {
            console.error('[CalendarIntegrationService] Failed to get active calendar integrations:', error);
            throw error;
        }
    }
}

export const calendarIntegrationService = new CalendarIntegrationService();
export default calendarIntegrationService;
