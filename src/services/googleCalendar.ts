import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {Platform} from 'react-native';
import calendarIntegrationService from "@/src/services/api/calendar-integration.service";
import {CalendarPlatformType} from "@/src/types/enums";

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

        const serverAuthCode = response.data.serverAuthCode;
        if (!serverAuthCode) {
            throw new Error('Failed to get server auth code from Google');
        }

        return {
            authorizationCode: serverAuthCode
        };
    } catch (error: any) {
        console.error('[Google Calendar] Sign-in failed:', error);
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
        await calendarIntegrationService.integrateGoogleCalendar(authorizationCode, CalendarPlatformType.GOOGLE_CALENDAR)
        console.log('[Google Calendar] Tokens sent to server successfully');
    } catch (error: any) {
        console.error('[Google Calendar] Failed to send tokens to server:', error.message);
        throw error;
    }
};

/**
 * 서버에서 Google Calendar 연동 해제
 */
export const disconnectFromServer = async () => {
    try {
        await calendarIntegrationService.disconnectCalendar(CalendarPlatformType.GOOGLE_CALENDAR);
        console.log('[Google Calendar] Disconnected from server');
    } catch (error: any) {
        console.error('[Google Calendar] Failed to disconnect:', error.message);
        throw error;
    }
};
