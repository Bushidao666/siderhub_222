import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaginatedResponse } from '@shared/types/common.types';
import { ResourceType, Visibility } from '@shared/types/common.types';
import type { Resource, ResourceDownloadReceipt } from '@shared/types/cybervault.types';
import type { ApiResponse } from '@shared/types/api.types';
import { UserRole } from '@shared/types';
import { useResourceDownload } from 'src/frontend/hooks/useResourceDownload';
import { useAuthStore } from 'src/frontend/store/auth';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const receiptFactory = (overrides: Partial<ResourceDownloadReceipt> = {}): ResourceDownloadReceipt => ({
  ok: true,
  totalDownloads: overrides.totalDownloads ?? 43,
  lastDownloadedAt: overrides.lastDownloadedAt ?? new Date().toISOString(),
});

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const resetAuthStore = () => {
  useAuthStore.setState((state) => ({
    ...state,
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    accessMap: [],
    activeSessions: [],
    isLoading: false,
    lastError: null,
  }));
};

const authenticate = () => {
  useAuthStore.setState((state) => ({
    ...state,
    user: {
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
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    isAuthenticated: true,
  }));
};

beforeEach(() => {
  act(() => {
    resetAuthStore();
    authenticate();
  });
});

afterEach(() => {
  queryClient?.clear();
  act(() => {
    resetAuthStore();
  });
});

describe('useResourceDownload', () => {
  it('registers downloads successfully', async () => {
    const receipt = receiptFactory();

    server.use(
      http.post('/api/cybervault/resources/resource-1/download', () => HttpResponse.json(successResponse(receipt))),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useResourceDownload(), { wrapper });

    await act(async () => {
      const response = await result.current.triggerDownloadAsync('resource-1');
      expect(response).toEqual(receipt);
    });

    expect(result.current.isDownloading).toBe(false);
  });

  it('updates cached resource lists with new download total', async () => {
    const receipt = receiptFactory({ totalDownloads: 101 });
    const initialList: PaginatedResponse<Resource> = {
      items: [
        {
          id: 'resource-1',
          slug: 'playbook-neon',
          title: 'Playbook Neon',
          description: 'Descrição',
          type: ResourceType.Playbook,
          categoryId: 'cat-1',
          tags: [],
          thumbnailUrl: null,
          visibility: Visibility.Members,
          featured: false,
          downloadCount: 42,
          viewCount: 100,
          createdBy: 'author-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assets: [],
        },
      ],
      page: 1,
      pageSize: 12,
      totalItems: 1,
      totalPages: 1,
    };

    const wrapper = createWrapper();
    queryClient.setQueryData<PaginatedResponse<Resource>>(['cybervault', 'resources', 'library'], initialList);

    server.use(
      http.post('/api/cybervault/resources/resource-1/download', () => HttpResponse.json(successResponse(receipt))),
    );

    const { result } = renderHook(() => useResourceDownload(), { wrapper });

    await act(async () => {
      await result.current.triggerDownloadAsync('resource-1');
    });

    const cached = queryClient.getQueryData<PaginatedResponse<Resource>>(['cybervault', 'resources', 'library']);
    expect(cached?.items[0]?.downloadCount).toBe(101);
  });

  it('exposes errors when download fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    server.use(
      http.post('/api/cybervault/resources/resource-1/download', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'CYBERVAULT_DOWNLOAD_FORBIDDEN', message: 'Forbidden' },
            timestamp: new Date().toISOString(),
          },
          { status: 403 },
        ),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useResourceDownload(), { wrapper });

    await act(async () => {
      await expect(result.current.triggerDownloadAsync('resource-1')).rejects.toBeTruthy();
    });

    expect(result.current.error).toBeTruthy();
    consoleSpy.mockRestore();
  });
});
