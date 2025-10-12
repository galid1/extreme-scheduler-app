/**
 * Authentication Service
 * 인증 관련 API 호출 서비스
 */

import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SendSmsRequest,
    SignInRequest,
    SignInResponse,
    SignUpRequest,
    SignUpResponse,
    CurrentAccountRequest,
    CurrentAccountResponse,
} from '../../types/api';

class AuthService {
    /**
     * SMS 인증코드 발송
     */
    async sendSmsCode(phoneNumber: string, deviceId: string): Promise<void> {
        const request: SendSmsRequest = {
            phoneNumber,
            deviceId,
        };
        await apiClient.post('/api/v1/auths/sms/send', request);
    }

    /**
     * 로그인 (인증코드 확인)
     */
    async signIn(phoneNumber: string, identificationCode: string): Promise<SignInResponse> {
        const request: SignInRequest = {
            phoneNumber,
            identificationCode,
        };

        const response = await apiClient.post<SignInResponse>('/api/v1/auths/sign-in', request);
        return response;
    }

    /**
     * 회원가입
     */
    async signUp(request: SignUpRequest): Promise<SignUpResponse> {
        const response = await apiClient.post<SignUpResponse>('/api/v1/auths/sign-up', request);
        return response;
    }

    /**
     * 로그아웃
     */
    async signOut(): Promise<void> {
        try {
            // Clear stored data
            await AsyncStorage.multiRemove([
                'accessToken',
                'refreshToken',
                'accountId',
                'accountType',
                'userName',
            ]);

            // Clear token in API client
            await apiClient.setAuthToken(null);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * 토큰 갱신
     */
    async refreshToken(refreshToken: string): Promise<SignInResponse> {
        const response = await apiClient.post<SignInResponse>('/api/v1/auths/refresh', {
            refreshToken,
        });
        return response;
    }

    /**
     * 현재 사용자 정보 가져오기
     */
    async getCurrentUser(token?: string): Promise<CurrentAccountResponse> {
        const authToken = token ;

        if (!authToken) {
            throw new Error('No auth token available');
        }

        const request: CurrentAccountRequest = {
            authToken,
        };


        const response = await apiClient.post<CurrentAccountResponse>('/api/v1/auths/me', request);
        return response;
    }
}

export const authService = new AuthService();
export default authService;
