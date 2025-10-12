/**
 * API Client
 * HTTP 요청을 위한 기본 클라이언트
 */

import { config } from '../../config/environment';

class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = config.API_URL;
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
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
      if (error instanceof Error && !error.message.includes(endpoint)) {
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
