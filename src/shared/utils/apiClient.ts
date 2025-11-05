import type { ApiResponse } from '../types/api.types';

interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  onUnauthenticated?: () => void;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiClient {
  private readonly baseUrl: string;

  private readonly getAccessToken?: () => string | null;

  private readonly onUnauthenticated?: () => void;

  constructor(options: ApiClientOptions = {}) {
    const envBase =
      (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) ||
      '/api';

    this.baseUrl = options.baseUrl ?? envBase;
    this.getAccessToken = options.getAccessToken;
    this.onUnauthenticated = options.onUnauthenticated;
  }

  async request<T>(path: string, method: HttpMethod, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getAccessToken?.();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (response.status === 401) {
      this.onUnauthenticated?.();
    }

    const payload = (await response.json()) as ApiResponse<T>;
    return payload;
  }

  get<T>(path: string) {
    return this.request<T>(path, 'GET');
  }

  post<T, B = unknown>(path: string, body?: B) {
    return this.request<T>(path, 'POST', body);
  }

  put<T, B = unknown>(path: string, body: B) {
    return this.request<T>(path, 'PUT', body);
  }

  patch<T, B = unknown>(path: string, body: B) {
    return this.request<T>(path, 'PATCH', body);
  }

  delete<T>(path: string) {
    return this.request<T>(path, 'DELETE');
  }
}

export const defaultApiClient = new ApiClient();
