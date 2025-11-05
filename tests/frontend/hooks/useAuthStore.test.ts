import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MemberAccessMap,
  SessionSummary,
  User,
} from '@shared/types';
import { FeatureAccessKey, UserRole } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { ApiClient, defaultApiClient } from 'src/shared/utils/apiClient';
import { useAuthStore } from 'src/frontend/store/auth';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const errorResponse = (code: string, message: string): ApiResponse<never> => ({
  success: false,
  error: { code, message },
  timestamp: new Date().toISOString(),
});

const defaultAccessMap: MemberAccessMap[] = [
  { feature: FeatureAccessKey.Academy, enabled: true, permissions: ['view'] },
];

const defaultSessions: SessionSummary[] = [
  {
    id: 'session-1',
    device: 'Chrome',
    ipAddress: '127.0.0.1',
    lastSeenAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    isCurrent: true,
  },
];

const userFactory = (): User => ({
  id: 'user-1',
  email: 'member@example.com',
  role: UserRole.Member,
  profile: {
    displayName: 'Member',
    avatarUrl: null,
    bio: null,
    timezone: 'UTC',
    badges: [],
    socialLinks: [],
  },
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const resetStore = () => {
  const state = useAuthStore.getState();
  useAuthStore.setState({
    ...state,
    user: null,
    accessToken: null,
    refreshToken: null,
    accessMap: [],
    activeSessions: [],
    isAuthenticated: false,
    isLoading: false,
    hydratedAt: null,
    lastError: null,
  });
};

beforeEach(() => {
  resetStore();
  window.localStorage.clear();
});

afterEach(() => {
  resetStore();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('useAuthStore', () => {
  it('stores tokens and access map after successful login', async () => {
    const loginResponse: LoginResponse = {
      user: userFactory(),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessMap: defaultAccessMap,
      activeSessions: defaultSessions,
    };

    const postSpy = vi
      .spyOn(defaultApiClient, 'post')
      .mockResolvedValue(successResponse(loginResponse));

    await useAuthStore.getState().login({ email: 'member@example.com', password: 'Secret123!' });

    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'member@example.com',
      password: 'Secret123!',
    } satisfies LoginRequest);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(loginResponse.user);
    expect(state.accessToken).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.accessMap).toEqual(defaultAccessMap);
    expect(state.activeSessions).toEqual(defaultSessions);
    expect(state.isAuthenticated).toBe(true);
    expect(state.lastError).toBeNull();
  });

  it('sets lastError when login fails', async () => {
    vi.spyOn(defaultApiClient, 'post').mockResolvedValue(
      errorResponse('AUTH_INVALID_CREDENTIALS', 'Credenciais inválidas'),
    );

    await expect(
      useAuthStore.getState().login({ email: 'member@example.com', password: 'WrongPass1' }),
    ).rejects.toThrow();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.lastError).toMatch(/credenciais inválidas/i);
    expect(state.accessToken).toBeNull();
  });

  it('refreshes tokens when refreshToken succeeds', async () => {
    useAuthStore.setState((state) => ({
      ...state,
      user: userFactory(),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    }));

    const refreshPayload = { accessToken: 'next-access-token', refreshToken: 'next-refresh-token' };
    const postSpy = vi
      .spyOn(ApiClient.prototype, 'post')
      .mockResolvedValue(successResponse(refreshPayload));

    await useAuthStore.getState().refreshTokens();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('next-access-token');
    expect(state.refreshToken).toBe('next-refresh-token');
    expect(state.isAuthenticated).toBe(true);
    expect(postSpy).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-token' });
  });

  it('clears state on logout even if request fails', async () => {
    useAuthStore.setState((state) => ({
      ...state,
      user: userFactory(),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    }));

    vi.spyOn(ApiClient.prototype, 'post').mockRejectedValue(new Error('logout failed'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    warnSpy.mockRestore();
  });
});
