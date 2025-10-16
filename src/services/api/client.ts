/**
 * API Client
 * HTTP 요청을 위한 기본 클라이언트
 */

import { config } from '../../config/environment';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { useRefreshStore } from '../../store/useRefreshStore';
import { Alert } from 'react-native';

// Custom timeout error class
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;
  private defaultTimeout: number = 4000; // 4초 기본 타임아웃

  constructor() {
    this.baseURL = config.API_URL;
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = this.defaultTimeout
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const defaultOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, defaultOptions),
        this.createTimeoutPromise(timeout)
      ]);

      console.log(`[API Response] ${endpoint}: status=${response.status}`);

      // Handle 401 Unauthorized - logout and redirect to auth
      if (response.status === 401) {
        console.error(`[401 Unauthorized] ${endpoint}: Session expired or invalid token`);

        // Logout user
        const { logout } = useAuthStore.getState();
        await logout();

        // Navigate to auth screen
        router.replace('/(auth)/phone-auth');

        throw new Error(`[${endpoint}] 인증이 만료되었습니다. 다시 로그인해주세요.`);
      }

      // Handle 409 Conflict - data already processed
      if (response.status === 409) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || '이미 처리된 요청입니다.';

        console.error(`[409 Conflict] ${endpoint}: ${errorMessage}`);

        // Trigger global refresh
        const { triggerRefresh } = useRefreshStore.getState();

        // Show alert to user (only this one, no error throw to prevent duplicate alerts)
        Alert.alert(
          '이미 처리된 요청',
          '해당 요청은 이미 처리되었습니다. 최신 정보를 확인하기 위해 새로고침합니다.',
          [
            {
              text: '확인',
              onPress: () => {
                // Trigger refresh
                triggerRefresh();

                // Navigate to home if not already there
                router.push('/(tabs)');
              }
            }
          ]
        );

        // Return empty response without throwing error (prevents duplicate alerts)
        return undefined as T;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `${response.status} ${response.statusText}`;
        throw new Error(
          `[ ${endpoint}] ${errorMessage}`
        );
      }

      // 204 No Content 또는 Content-Length가 0인 경우 (DELETE 요청 등)
      if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return undefined as T;
      }

      // 응답 body가 있는지 확인
      const text = await response.text();
      if (!text || text.trim() === '') {
        return undefined as T;
      }

      // JSON 파싱
      const data = JSON.parse(text);
      return data.data as T;
    } catch (error) {
      // Handle timeout error
      if (error instanceof TimeoutError) {
        console.error(`[Timeout Error] ${endpoint}:`, error.message);
        // Navigate to timeout error page
        router.push('/timeout-error');
        throw error;
      }

      if (error instanceof Error && !error.message.includes(endpoint)) {
        throw new Error(`[ ${endpoint}] ${error.message}`);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, timeout);
  }

  async post<T>(endpoint: string, data?: any, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, timeout);
  }

  async put<T>(endpoint: string, data?: any, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, timeout);
  }

  async delete<T>(endpoint: string, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, timeout);
  }

  async patch<T>(endpoint: string, data?: any, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, timeout);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
