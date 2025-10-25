import NaverLogin from '@react-native-seoul/naver-login';
import {Platform} from 'react-native';
import calendarIntegrationService from "@/src/services/api/calendar-integration.service";
import {CalendarPlatformType} from "@/src/types/enums";

/**
 * Naver Login 초기 설정
 * 앱 시작 시 한 번 호출해야 함
 */
export const configureNaverLogin = () => {
    try {
        NaverLogin.initialize({
            appName: 'Extreme Scheduler',
            consumerKey: process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY || '',
            consumerSecret: process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET || '',
            serviceUrlSchemeIOS: process.env.EXPO_PUBLIC_NAVER_URL_SCHEME_IOS || 'extremescheduler',
            disableNaverAppAuthIOS: true,
        });
        console.log('[Naver Calendar] Configuration completed');
    } catch (error) {
        console.error('[Naver Calendar] Configuration failed:', error);
    }
};

/**
 * Naver 로그인 및 토큰 획득
 * @returns { accessToken, refreshToken }
 */
export const signInWithNaver = async () => {
    try {
        const response = await NaverLogin.login();

        if (!response.successResponse) {
            throw new Error('Naver sign-in failed');
        }

        const { accessToken, refreshToken } = response.successResponse;

        if (!accessToken) {
            throw new Error('Failed to get access token from Naver');
        }

        return {
            accessToken,
            refreshToken,
        };
    } catch (error: any) {
        console.error('[Naver Calendar] Sign-in failed:', error);
        throw error;
    }
};

/**
 * Naver 로그아웃
 */
export const signOutFromNaver = async () => {
    try {
        await NaverLogin.logout();
        console.log('[Naver Calendar] Sign-out successful');
    } catch (error) {
        console.error('[Naver Calendar] Sign-out failed:', error);
        throw error;
    }
};

/**
 * Naver 계정 연동 해제
 */
export const deleteNaverToken = async () => {
    try {
        await NaverLogin.deleteToken();
        console.log('[Naver Calendar] Token deleted successfully');
    } catch (error) {
        console.error('[Naver Calendar] Token deletion failed:', error);
        throw error;
    }
};

/**
 * 서버로 Naver 토큰 전송
 * @param accessToken - Naver access token
 * @param refreshToken - Naver refresh token
 * @param expiresIn - Token expiration time in seconds (optional, defaults to 1 hour)
 */
export const sendTokensToServer = async (
    accessToken: string,
    refreshToken: string,
    expiresIn?: number
) => {
    try {
        // Calculate expiresAt (ISO 8601 format)
        const expiresInMs = (expiresIn || 3600) * 1000; // Default 1 hour
        const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

        await calendarIntegrationService.integrateNaverCalendar(
            accessToken,
            refreshToken,
            expiresAt
        );
        console.log('[Naver Calendar] Tokens sent to server successfully');
    } catch (error: any) {
        console.error('[Naver Calendar] Failed to send tokens to server:', error.message);
        throw error;
    }
};

/**
 * 서버에서 Naver Calendar 연동 해제
 */
export const disconnectFromServer = async () => {
    try {
        await calendarIntegrationService.disconnectCalendar(CalendarPlatformType.NAVER_CALENDAR);
        console.log('[Naver Calendar] Disconnected from server');
    } catch (error: any) {
        console.error('[Naver Calendar] Failed to disconnect:', error.message);
        throw error;
    }
};

/**
 * Naver OAuth API를 직접 호출하여 토큰 갱신
 * @param refreshToken - Naver refresh token
 * @returns { accessToken, refreshToken, expiresIn }
 */
export const refreshNaverToken = async (refreshToken: string) => {
    try {
        const clientId = process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY || '';
        const clientSecret = process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET || '';

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        });

        const response = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            refreshToken: refreshToken, // 갱신 토큰은 변경되지 않음
            expiresIn: data.expires_in || 3600, // 기본 1시간
        };
    } catch (error: any) {
        console.error('[Naver Calendar] Token refresh failed:', error);
        throw error;
    }
};

/**
 * Naver 사용자 프로필 조회
 * @param accessToken - Naver access token
 */
export const getNaverProfile = async (accessToken: string) => {
    try {
        const profile = await NaverLogin.getProfile(accessToken);
        console.log('[Naver Calendar] Profile:', profile);
        return profile;
    } catch (error: any) {
        console.error('[Naver Calendar] Get profile failed:', error);
        throw error;
    }
};
