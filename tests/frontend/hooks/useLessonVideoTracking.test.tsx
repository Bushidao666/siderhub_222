import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { LessonProgressSnapshot } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { UserRole } from '@shared/types';
import { useLessonVideoTracking } from 'src/frontend/hooks/useLessonVideoTracking';
import { useAuthStore } from 'src/frontend/store/auth';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const snapshotFactory = (overrides: Partial<LessonProgressSnapshot> = {}): LessonProgressSnapshot => ({
  lessonId: overrides.lessonId ?? 'lesson-1',
  userId: overrides.userId ?? 'user-1',
  courseId: overrides.courseId ?? 'course-1',
  lastPositionMs: overrides.lastPositionMs ?? 0,
  percentage: overrides.percentage ?? 0,
  completed: overrides.completed ?? false,
  updatedAt: overrides.updatedAt ?? new Date().toISOString(),
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
  resetAuthStore();
  authenticate();
});

afterEach(() => {
  queryClient?.clear();
  resetAuthStore();
});

describe('useLessonVideoTracking', () => {
  it('emits ticks manually and updates snapshot', async () => {
    let currentPosition = 5_000;
    const receivedPayloads: Array<{ positionMs: number; completed?: boolean }> = [];

    server.use(
      http.get('/api/academy/lessons/lesson-1/progress', () =>
        HttpResponse.json(successResponse(snapshotFactory())),
      ),
      http.post('/api/academy/lessons/lesson-1/progress-tick', async ({ request }) => {
        const body = (await request.json()) as { positionMs: number; completed?: boolean };
        receivedPayloads.push({ positionMs: body.positionMs, completed: body.completed });
        const snapshot = snapshotFactory({
          lastPositionMs: body.positionMs,
          percentage: (body.positionMs ?? 0) / 60_000,
          completed: Boolean(body.completed),
        });
        return HttpResponse.json(successResponse(snapshot));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useLessonVideoTracking({
          lessonId: 'lesson-1',
          courseId: 'course-1',
          durationMs: 60_000,
          getPositionMs: () => currentPosition,
          isPlaying: false,
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.progress).not.toBeNull());

    await act(async () => {
      result.current.sendTick({ force: true, positionMs: currentPosition });
      await waitFor(() => expect(receivedPayloads).toHaveLength(1));
    });
    expect(receivedPayloads[0]?.positionMs).toBe(5_000);

    currentPosition = 15_000;
    await act(async () => {
      result.current.sendTick({ force: true, positionMs: currentPosition });
      await waitFor(() => expect(receivedPayloads).toHaveLength(2));
    });
    expect(receivedPayloads[1]?.positionMs).toBe(15_000);
    expect(result.current.progress?.lastPositionMs).toBe(15_000);
  });

  it('forces completion tick when markCompleted is called', async () => {
    let currentPosition = 40_000;
    const receivedPayloads: Array<{ positionMs: number; completed?: boolean }> = [];

    server.use(
      http.get('/api/academy/lessons/lesson-1/progress', () =>
        HttpResponse.json(successResponse(snapshotFactory())),
      ),
      http.post('/api/academy/lessons/lesson-1/progress-tick', async ({ request }) => {
        const body = (await request.json()) as { positionMs: number; completed?: boolean };
        receivedPayloads.push({ positionMs: body.positionMs, completed: body.completed });
        const snapshot = snapshotFactory({
          lastPositionMs: body.positionMs,
          percentage: body.completed ? 1 : (body.positionMs ?? 0) / 60_000,
          completed: Boolean(body.completed),
        });
        return HttpResponse.json(successResponse(snapshot));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(
      () =>
        useLessonVideoTracking({
          lessonId: 'lesson-1',
          courseId: 'course-1',
          durationMs: 60_000,
          getPositionMs: () => currentPosition,
          isPlaying: false,
        }),
      { wrapper }
    );

    await act(async () => {
      result.current.sendTick({ force: true, positionMs: currentPosition });
      await waitFor(() => expect(receivedPayloads).toHaveLength(1));
    });

    currentPosition = 55_000;
    await act(async () => {
      result.current.markCompleted();
      await waitFor(() => expect(receivedPayloads).toHaveLength(2));
    });

    expect(receivedPayloads[1]?.completed).toBe(true);
  });
});
