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

    // Store tokens
    await this.saveAuthData(response);

    return response;
  }

  /**
   * 회원가입
   */
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    const response = await apiClient.post<SignUpResponse>('/api/v1/auths/sign-up', request);

    // Store tokens
    await this.saveAuthData(response);

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
   * 저장된 인증 정보 가져오기
   */
  async getStoredAuthData() {
    try {
      const [accessToken, refreshToken, accountId, accountType, userName] = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
        'accountId',
        'accountType',
        'userName',
      ]);

      if (!accessToken[1]) {
        return null;
      }

      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1],
        accountId: accountId[1] ? parseInt(accountId[1]) : null,
        accountType: accountType[1],
        userName: userName[1],
      };
    } catch (error) {
      console.error('Failed to get stored auth data:', error);
      return null;
    }
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(refreshToken: string): Promise<SignInResponse> {
    const response = await apiClient.post<SignInResponse>('/api/v1/auths/refresh', {
      refreshToken,
    });

    await this.saveAuthData(response);

    return response;
  }

  /**
   * 인증 데이터 저장
   */
  private async saveAuthData(response: SignInResponse | SignUpResponse): Promise<void> {
    try {
      // Store tokens and user info
      await AsyncStorage.multiSet([
        ['accessToken', response.accessToken],
        ['refreshToken', response.refreshToken],
        ['accountId', response.accountId.toString()],
        ['accountType', response.accountType],
        ['userName', response.name],
      ]);

      // Set token in API client
      await apiClient.setAuthToken(response.accessToken);
    } catch (error) {
      console.error('Failed to save auth data:', error);
      throw error;
    }
  }

  /**
   * 인증 상태 확인
   */
  async isAuthenticated(): Promise<boolean> {
    const authData = await this.getStoredAuthData();
    return !!authData?.accessToken;
  }
}

export const authService = new AuthService();
export default authService;