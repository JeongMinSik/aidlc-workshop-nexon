import { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('table_token');
  }

  private async request<T>(url: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {} } = options;
    const token = this.getToken();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${url}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401) {
        localStorage.removeItem('table_token');
        window.location.href = '/setup/';
        return { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 만료되었습니다.' } };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || { code: 'ERROR', message: '요청 처리 중 오류가 발생했습니다.' },
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: '네트워크 연결을 확인해주세요.' },
      };
    }
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url);
  }

  async post<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'POST', body });
  }

  async put<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'PUT', body });
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
