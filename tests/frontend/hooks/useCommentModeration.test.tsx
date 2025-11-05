import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CommentModerationItem } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { UserRole } from '@shared/types';
import { useCommentModeration } from 'src/frontend/hooks/useCommentModeration';
import { useAuthStore } from 'src/frontend/store/auth';
import { http, HttpResponse, server } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const buildModerationItem = (overrides: Partial<CommentModerationItem> = {}): CommentModerationItem => ({
  id: overrides.id ?? 'queue-comment-1',
  entityId: overrides.entityId ?? 'comment-1',
  commentId: overrides.commentId ?? 'comment-1',
  lessonId: overrides.lessonId ?? 'lesson-1',
  courseId: overrides.courseId ?? 'course-1',
  lessonTitle: overrides.lessonTitle ?? 'Lesson 1',
  courseTitle: overrides.courseTitle ?? 'Course 1',
  userId: overrides.userId ?? 'member-1',
  userDisplayName: overrides.userDisplayName ?? 'Member One',
  body: overrides.body ?? 'Comentário aguardando revisão.',
  createdAt: overrides.createdAt ?? new Date('2025-11-02T08:00:00Z').toISOString(),
  pendingModeration: overrides.pendingModeration ?? true,
  moderationStatus: overrides.moderationStatus ?? 'pending',
  moderatedById: overrides.moderatedById ?? null,
  moderatedAt: overrides.moderatedAt ?? null,
  type: overrides.type ?? 'comment',
  depth: overrides.depth ?? 0,
});

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const resetAuthStore = () => {
  act(() => {
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
  });
};

const authenticateAs = (role: UserRole) => {
  act(() => {
    useAuthStore.setState((state) => ({
      ...state,
      user: {
        id: 'moderator-1',
        email: 'moderator@example.com',
        role,
        profile: {
          displayName: 'Moderador',
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
  });
};

beforeEach(() => {
  resetAuthStore();
  authenticateAs(UserRole.Admin);
});

afterEach(() => {
  queryClient?.clear();
  resetAuthStore();
});

describe('useCommentModeration', () => {
  it('fetches pending moderation items when moderator authenticated', async () => {
    const pendingItems = [
      buildModerationItem(),
      buildModerationItem({ id: 'queue-comment-2', entityId: 'comment-2', commentId: 'comment-2' }),
    ];

    server.use(
      http.get('/api/admin/academy/comments/moderation', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('status')).toBe('pending');
        expect(url.searchParams.get('page')).toBe('1');
        expect(url.searchParams.get('pageSize')).toBe('20');
        return HttpResponse.json(successResponse(pendingItems));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommentModeration(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toEqual(pendingItems);
    expect(result.current.hasItems).toBe(true);
  });

  it('removes item from list after approving um comentário', async () => {
    let pendingItems = [buildModerationItem()];

    server.use(
      http.get('/api/admin/academy/comments/moderation', () => HttpResponse.json(successResponse(pendingItems))),
      http.patch('/api/admin/academy/comments/comment-1/moderation', async ({ request }) => {
        const body = (await request.json()) as { status: string };
        expect(body.status).toBe('approved');
        const updatedItem = buildModerationItem({
          id: 'queue-comment-1',
          pendingModeration: false,
          moderationStatus: 'approved',
        });
        pendingItems = [];
        return HttpResponse.json(successResponse(updatedItem));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommentModeration(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      result.current.approve({
        id: 'queue-comment-1',
        entityId: 'comment-1',
        commentId: 'comment-1',
        type: 'comment',
      });
    });

    await waitFor(() => expect(result.current.isModerating).toBe(false));
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });

  it('modera replies usando o endpoint dedicado', async () => {
    let pendingItems = [
      buildModerationItem({
        id: 'queue-reply-1',
        entityId: 'reply-1',
        commentId: 'comment-1',
        type: 'reply',
        depth: 1,
      }),
    ];

    server.use(
      http.get('/api/admin/academy/comments/moderation', () => HttpResponse.json(successResponse(pendingItems))),
      http.patch('/api/admin/academy/comments/comment-1/replies/reply-1/moderation', async ({ request }) => {
        const body = (await request.json()) as { status: string };
        expect(body.status).toBe('rejected');
        const updatedItem = {
          ...pendingItems[0]!,
          pendingModeration: false,
          moderationStatus: 'rejected' as const,
        } satisfies CommentModerationItem;
        pendingItems = [];
        return HttpResponse.json(successResponse(updatedItem));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommentModeration(), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      result.current.reject({
        id: 'queue-reply-1',
        entityId: 'reply-1',
        commentId: 'comment-1',
        type: 'reply',
      });
    });

    await waitFor(() => expect(result.current.isModerating).toBe(false));
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });

  it('does not fetch when user lacks moderation privileges', () => {
    resetAuthStore();
    authenticateAs(UserRole.Member);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCommentModeration(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.hasItems).toBe(false);
  });
});
