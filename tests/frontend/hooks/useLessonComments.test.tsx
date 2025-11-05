import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { LessonComment, LessonCommentReply } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { UserRole } from '@shared/types';
import { useLessonComments } from 'src/frontend/hooks/useLessonComments';
import { useAuthStore } from 'src/frontend/store/auth';
import { http, HttpResponse, server } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const randomId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

const createReply = (overrides: Partial<LessonCommentReply> = {}): LessonCommentReply => ({
  id: overrides.id ?? `reply-${randomId()}`,
  commentId: overrides.commentId ?? 'comment-1',
  parentReplyId: overrides.parentReplyId ?? null,
  userId: overrides.userId ?? 'user-reply',
  body: overrides.body ?? 'Resposta padrão',
  createdAt: overrides.createdAt ?? new Date('2025-11-02T11:00:00Z').toISOString(),
  pendingModeration: overrides.pendingModeration ?? false,
  moderationStatus: overrides.moderationStatus ?? 'approved',
  moderatedById: overrides.moderatedById ?? null,
  moderatedAt: overrides.moderatedAt ?? null,
  replies: overrides.replies ?? [],
});

const createComment = (overrides: Partial<LessonComment> = {}): LessonComment => ({
  id: overrides.id ?? 'comment-1',
  lessonId: overrides.lessonId ?? 'lesson-1',
  userId: overrides.userId ?? 'mentor-1',
  body: overrides.body ?? 'Primeiro! excelente aula.',
  createdAt: overrides.createdAt ?? new Date('2025-11-02T10:00:00Z').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2025-11-02T10:00:00Z').toISOString(),
  pendingModeration: overrides.pendingModeration ?? false,
  moderationStatus: overrides.moderationStatus ?? 'approved',
  moderatedById: overrides.moderatedById ?? null,
  moderatedAt: overrides.moderatedAt ?? null,
  replies: overrides.replies ?? [],
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

const authenticate = () => {
  act(() => {
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
  });
};

beforeEach(() => {
  resetAuthStore();
  authenticate();
});

afterEach(() => {
  queryClient?.clear();
  resetAuthStore();
});

describe('useLessonComments', () => {
  it('fetches nested comments with moderation metadata', async () => {
    const nestedReply = createReply({ id: 'reply-1' });
    const rootReply = createReply({ id: 'reply-root', replies: [nestedReply] });
    const comment = createComment({ replies: [rootReply] });

    server.use(
      http.get('/api/academy/lessons/lesson-1/comments', () =>
        HttpResponse.json(successResponse([comment])),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonComments({ lessonId: 'lesson-1' }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.comments).toHaveLength(1);
    const [fetchedComment] = result.current.comments;
    expect(fetchedComment.moderationStatus).toBe('approved');
    expect(fetchedComment.replies).toHaveLength(1);
    expect(fetchedComment.replies[0]?.replies[0]?.id).toBe('reply-1');
  });

  it('supports optimistic comment publishing and merges server payload', async () => {
    const serverComment = createComment({ id: 'comment-2', body: 'Conteúdo incrível!' });
    let currentComments: LessonComment[] = [];

    server.use(
      http.get('/api/academy/lessons/lesson-1/comments', () => HttpResponse.json(successResponse(currentComments))),
      http.post('/api/academy/lessons/lesson-1/comments', async ({ request }) => {
        const body = (await request.json()) as { body: string };
        expect(body.body).toBe('Conteúdo incrível!');
        currentComments = [serverComment];
        return HttpResponse.json(successResponse(serverComment));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonComments({ lessonId: 'lesson-1' }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.comments).toEqual([]);

    await act(async () => {
      result.current.addComment({ body: 'Conteúdo incrível!' });
    });

    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    const [comment] = result.current.comments;
    expect(comment.body).toBe('Conteúdo incrível!');
    expect(comment.pendingModeration).toBe(false);
  });

  it('supports optimistic reply publishing and replaces placeholder', async () => {
    let currentComments: LessonComment[] = [createComment()];
    const serverReply = createReply({ id: 'reply-server', body: 'Obrigado!', pendingModeration: false });

    server.use(
      http.get('/api/academy/lessons/lesson-1/comments', () => HttpResponse.json(successResponse(currentComments))),
      http.post('/api/academy/lessons/lesson-1/comments/comment-1/replies', async ({ request }) => {
        const body = (await request.json()) as { body: string; parentReplyId: string | null };
        expect(body.body).toBe('Obrigado!');
        expect(body.parentReplyId).toBeNull();
        currentComments = [
          createComment({
            replies: [serverReply],
          }),
        ];
        return HttpResponse.json(successResponse(serverReply));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonComments({ lessonId: 'lesson-1' }), { wrapper });

    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    await act(async () => {
      result.current.addReply({ commentId: 'comment-1', body: 'Obrigado!' });
    });

    await waitFor(() => expect(result.current.isReplying).toBe(false));

    const [comment] = result.current.comments;
    expect(comment.replies).toHaveLength(1);
    expect(comment.replies[0]?.id).toBe('reply-server');
    expect(comment.replies[0]?.moderationStatus).toBe('approved');
  });

  it('inserts replies at arbitrary depth', async () => {
    const childReply = createReply({ id: 'reply-child' });
    const rootReply = createReply({ id: 'reply-root', replies: [childReply] });
    let currentComments: LessonComment[] = [createComment({ replies: [rootReply] })];
    const nestedReply = createReply({
      id: 'reply-grandchild',
      parentReplyId: 'reply-child',
      body: 'Thread nivel 3',
    });

    server.use(
      http.get('/api/academy/lessons/lesson-1/comments', () => HttpResponse.json(successResponse(currentComments))),
      http.post('/api/academy/lessons/lesson-1/comments/comment-1/replies', async ({ request }) => {
        const { parentReplyId } = (await request.json()) as { parentReplyId: string };
        expect(parentReplyId).toBe('reply-child');
        currentComments = [
          createComment({
            replies: [
              createReply({
                ...rootReply,
                replies: [
                  createReply({
                    ...childReply,
                    replies: [nestedReply],
                  }),
                ],
              }),
            ],
          }),
        ];
        return HttpResponse.json(successResponse(nestedReply));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonComments({ lessonId: 'lesson-1' }), { wrapper });

    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    await act(async () => {
      result.current.addReply({ commentId: 'comment-1', parentReplyId: 'reply-child', body: 'Thread nivel 3' });
    });

    await waitFor(() => expect(result.current.isReplying).toBe(false));

    const [fetchedComment] = result.current.comments;
    const targetChild = fetchedComment.replies[0]?.replies.find((item) => item.id === 'reply-child');
    expect(targetChild?.replies.some((item) => item.id === 'reply-grandchild')).toBe(true);
  });

  it('does not start fetching when user is not authenticated', () => {
    resetAuthStore();
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonComments({ lessonId: 'lesson-1' }), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.comments).toEqual([]);
  });
});
