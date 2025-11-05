import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import {
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type RegisterResponse,
  type RefreshTokenResponse,
  type LogoutRequest,
  type MemberAccessMap,
  type SessionSummary,
  type User,
} from '../../shared/types';
import { ApiClient, defaultApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';

const STORAGE_KEY = 'siderhub-auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessMap: MemberAccessMap[];
  activeSessions: SessionSummary[];
  isAuthenticated: boolean;
  isLoading: boolean;
  hydratedAt: string | null;
  lastError: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: (request?: LogoutRequest) => Promise<void>;
  refreshTokens: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  setAccessMap: (accessMap: MemberAccessMap[]) => void;
  setActiveSessions: (sessions: SessionSummary[]) => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  accessMap: [],
  activeSessions: [],
  isAuthenticated: false,
  isLoading: false,
  hydratedAt: null,
  lastError: null,
};

const storage = typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      const clearState = (keepHydrated: boolean) =>
        set((state) => ({
          ...state,
          ...initialState,
          isLoading: false,
          hydratedAt: keepHydrated ? new Date().toISOString() : state.hydratedAt,
          lastError: null,
        }));

      const applyAuthPayload = (payload: LoginResponse | RegisterResponse) => {
        const baseAccessMap: MemberAccessMap[] = 'accessMap' in payload ? payload.accessMap : [];
        const baseSessions: SessionSummary[] = 'activeSessions' in payload ? payload.activeSessions : [];

        set((state) => ({
          ...state,
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          accessMap: baseAccessMap,
          activeSessions: baseSessions,
          isAuthenticated: true,
          isLoading: false,
          lastError: null,
          hydratedAt: new Date().toISOString(),
        }));
      };

      const authenticatedClient = new ApiClient({
        getAccessToken: () => get().accessToken,
        onUnauthenticated: () => clearState(true),
      });

      return {
        ...initialState,
        login: async (credentials) => {
          set({ isLoading: true, lastError: null });
          try {
            const response = await defaultApiClient.post<LoginResponse, LoginRequest>('/auth/login', credentials);
            assertSuccess<LoginResponse>(response);
            applyAuthPayload(response.data);
          } catch (error) {
            const message = mapApiError(error);
            set({ isLoading: false, lastError: message, isAuthenticated: false });
            throw error;
          }
        },
        register: async (input) => {
          set({ isLoading: true, lastError: null });
          try {
            const response = await defaultApiClient.post<RegisterResponse, RegisterRequest>('/auth/register', input);
            assertSuccess<RegisterResponse>(response);
            applyAuthPayload(response.data);
          } catch (error) {
            const message = mapApiError(error);
            set({ isLoading: false, lastError: message, isAuthenticated: false });
            throw error;
          }
        },
        logout: async (request) => {
          const hasSession = Boolean(get().accessToken);
          try {
            if (hasSession) {
              await authenticatedClient.post<void, LogoutRequest>('/auth/logout', request ?? {});
            }
          } catch (error) {
            console.warn('logout request failed', error);
          } finally {
            clearState(true);
          }
        },
        refreshTokens: async () => {
          const refreshToken = get().refreshToken;
          if (!refreshToken) {
            clearState(true);
            return;
          }

          try {
            const response = await authenticatedClient.post<RefreshTokenResponse, { refreshToken: string }>(
              '/auth/refresh',
              { refreshToken }
            );
            assertSuccess<RefreshTokenResponse>(response);
            const { accessToken: nextAccessToken, refreshToken: nextRefreshToken } = response.data;
            set((state) => ({
              ...state,
              accessToken: nextAccessToken,
              refreshToken: nextRefreshToken,
              isAuthenticated: Boolean(state.user && nextAccessToken),
              lastError: null,
            }));
          } catch (error) {
            const message = mapApiError(error);
            set({ lastError: message });
            clearState(true);
            throw error;
          }
        },
        hydrateFromStorage: async () => {
          if (typeof window === 'undefined') {
            set({ hydratedAt: new Date().toISOString(), isLoading: false });
            return;
          }

          set({ isLoading: true });
          try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
              clearState(true);
              return;
            }

            const parsed = JSON.parse(raw) as { state?: Partial<AuthState> } | null;
            const stored = parsed?.state ?? {};

            set((state) => ({
              ...state,
              user: stored.user ?? null,
              accessToken: stored.accessToken ?? null,
              refreshToken: stored.refreshToken ?? null,
              accessMap: stored.accessMap ?? [],
              activeSessions: stored.activeSessions ?? [],
              isAuthenticated: Boolean(stored.user && stored.accessToken),
              hydratedAt: stored.hydratedAt ?? new Date().toISOString(),
              isLoading: false,
              lastError: null,
            }));
          } catch (error) {
            console.error('auth store hydration failed', error);
            window.localStorage.removeItem(STORAGE_KEY);
            clearState(true);
          }
        },
        setAccessMap: (accessMap) => set((state) => ({ ...state, accessMap })),
        setActiveSessions: (sessions) => set((state) => ({ ...state, activeSessions: sessions })),
      };
    },
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessMap: state.accessMap,
        activeSessions: state.activeSessions,
        hydratedAt: state.hydratedAt,
      }),
      skipHydration: true,
      version: 1,
    }
  )
);

export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectUser = (state: AuthStore) => state.user;
export const selectAccessMap = (state: AuthStore) => state.accessMap;
export const selectActiveSessions = (state: AuthStore) => state.activeSessions;
export const selectAuthLoading = (state: AuthStore) => state.isLoading;
export const selectAuthError = (state: AuthStore) => state.lastError;
