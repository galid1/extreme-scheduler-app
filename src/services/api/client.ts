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
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
          `API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data as T;
    } catch (error) {
      console.error('API Request failed:', error);
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
