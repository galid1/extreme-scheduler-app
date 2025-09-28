/**
 * API Client
 * HTTP 요청을 위한 기본 클라이언트
 */

import { config } from '../../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = config.API_URL;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.authToken = await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  public async setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      await AsyncStorage.setItem('accessToken', token);
    } else {
      await AsyncStorage.removeItem('accessToken');
    }
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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
      console.log(`🔄 API Request:  ${url}`);
      if (options?.body) {
        console.log('   Request Body:', options.body);
      }

      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || `${response.status} ${response.statusText}`;
        console.error(`❌ API Error [ ${endpoint}]: ${errorMessage}`);
        console.error('   Full URL:', url);
        console.error('   Status:', response.status);
        if (errorData) {
          console.error('   Error Data:', errorData);
        }
        throw new Error(
          `[ ${endpoint}] ${errorMessage}`
        );
      }

      const data = await response.json();
      console.log(`✅ API Success [ ${endpoint}]:`, data.data ? 'Data received' : 'No data');
      return data.data as T;
    } catch (error) {
      if (error instanceof Error && !error.message.includes(endpoint)) {
        console.error(`❌ API Network Error [ ${endpoint}]:`, error.message);
        throw new Error(`[ ${endpoint}] ${error.message}`);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
