import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { apiClient } from './api/client';
import calendarIntegrationService from "@/src/services/api/calendar-integration.service";

/**
 * Google Sign-In 초기 설정
 * 앱 시작 시 한 번 호출해야 함
 */
export const configureGoogleSignIn = () => {
    try {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            offlineAccess: true, // Refresh Token을 받기 위해 필수
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        console.log('[Google Calendar] Configuration completed');
    } catch (error) {
        console.error('[Google Calendar] Configuration failed:', error);
    }
};

/**
 * Google 로그인 및 토큰 획득
 * @returns { accessToken, refreshToken }
 */
export const signInWithGoogle = async () => {
    try {
        // Play Services 확인 (Android)
        if (Platform.OS === 'android') {
            await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
        }

        // Google 로그인
        const response = await GoogleSignin.signIn();

        if (response.type !== 'success') {
            throw new Error('Google sign-in was cancelled or failed');
        }
        return {
            authorizationCode: response.data.serverAuthCode
        };
    } catch (error: any) {
        console.error('[Google Calendar] Sign-in failed:', error);
        throw error;
    }
};

/**
 * 현재 로그인 상태 확인
 */
export const isSignedIn = async (): Promise<boolean> => {
    return await GoogleSignin.isSignedIn();
};

/**
 * Access Token 가져오기
 */
export const getAccessToken = async (): Promise<string> => {
    try {
        const tokens = await GoogleSignin.getTokens();
        return tokens.accessToken;
    } catch (error) {
        console.error('[Google Calendar] Failed to get access token:', error);
        throw error;
    }
};

/**
 * Google 로그아웃
 */
export const signOutFromGoogle = async () => {
    try {
        await GoogleSignin.signOut();
        console.log('[Google Calendar] Sign-out successful');
    } catch (error) {
        console.error('[Google Calendar] Sign-out failed:', error);
        throw error;
    }
};

/**
 * 서버로 Google 토큰 전송
 * 서버에서 serverAuthCode를 사용해 Refresh Token을 교환하고 저장함
 */
export const sendTokensToServer = async (
    authorizationCode: string,
) => {
    try {
        await calendarIntegrationService.connectGoogleCalendar(authorizationCode)
        console.log('[Google Calendar] Tokens sent to server successfully');
    } catch (error: any) {
        console.error('[Google Calendar] Failed to send tokens to server:', error.message);
        throw error;
    }
};

/**
 * 서버에서 Google Calendar 연동 해제
 */
export const disconnectFromServer = async (userAuthToken: string) => {
    try {
        // 임시로 토큰 설정
        const previousToken = (apiClient as any).authToken;
        apiClient.setAuthToken(userAuthToken);

        await apiClient.delete('/api/v1/google-calendar/disconnect');

        // 원래 토큰으로 복원
        apiClient.setAuthToken(previousToken);

        console.log('[Google Calendar] Disconnected from server');
    } catch (error: any) {
        console.error('[Google Calendar] Failed to disconnect:', error.message);
        throw error;
    }
};
