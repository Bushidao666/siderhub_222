import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import type {
  RenderHookOptions,
  RenderHookResult,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import { useAuthStore } from 'src/frontend/store/auth';
import type { LoginResponse, MemberAccessMap, SessionSummary, User } from '@shared/types/auth.types';
import { UserRole } from '@shared/types/common.types';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

type HookCallback<TProps, TResult> = (props: TProps) => TResult;

type RenderHookWithClientOptions<TProps> = RenderHookOptions<TProps> & {
  queryClient?: QueryClient;
};

export function renderHookWithClient<TProps, TResult>(
  hook: HookCallback<TProps, TResult>,
  { queryClient = createTestQueryClient(), ...options }: RenderHookWithClientOptions<TProps> = {},
): RenderHookResult<TProps, TResult> & { queryClient: QueryClient } {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const result = renderHook(hook, { wrapper, ...options });
  return Object.assign(result, { queryClient });
}

type RenderWithClientOptions = RenderOptions & {
  queryClient?: QueryClient;
};

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: RenderWithClientOptions = {},
): RenderResult & { queryClient: QueryClient } {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const result = render(ui, { wrapper, ...options });
  return Object.assign(result, { queryClient });
}

const baseUser: User = {
  id: 'user-1',
  email: 'member@example.com',
  role: UserRole.Member,
  profile: {
    displayName: 'Member Test',
    avatarUrl: null,
    bio: null,
    timezone: 'UTC',
    badges: [],
    socialLinks: [],
  },
  lastLoginAt: null,
  createdAt: new Date('2025-11-01T12:00:00.000Z').toISOString(),
  updatedAt: new Date('2025-11-01T12:00:00.000Z').toISOString(),
};

const defaultAccessMap: MemberAccessMap[] = [];
const defaultSessions: SessionSummary[] = [];

export const resetAuthStore = () => {
  useAuthStore.setState({
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

export const setAuthenticatedUser = (overrides: Partial<LoginResponse> = {}) => {
  const payload: LoginResponse = {
    user: overrides.user ?? baseUser,
    accessToken: overrides.accessToken ?? 'access-token',
    refreshToken: overrides.refreshToken ?? 'refresh-token',
    accessMap: overrides.accessMap ?? defaultAccessMap,
    activeSessions: overrides.activeSessions ?? defaultSessions,
  };

  useAuthStore.setState({
    user: payload.user,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    accessMap: payload.accessMap,
    activeSessions: payload.activeSessions,
    isAuthenticated: true,
    isLoading: false,
    hydratedAt: new Date().toISOString(),
    lastError: null,
  });
};
