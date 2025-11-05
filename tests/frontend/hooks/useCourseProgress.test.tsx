import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CourseProgress } from '@shared/types';
import { UserRole } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { useCourseProgress, useCoursesProgressMap } from 'src/frontend/hooks/useCourseProgress';
import { useAuthStore } from 'src/frontend/store/auth';
import { server, http, HttpResponse } from '../setup/msw-server';

const COURSE_ID = 'course-1';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const progressFactory = (overrides: Partial<CourseProgress> = {}): CourseProgress => ({
  courseId: COURSE_ID,
  userId: 'user-1',
  completedLessonIds: ['lesson-1'],
  percentage: 50,
  lastLessonId: 'lesson-1',
  updatedAt: new Date('2025-11-02T12:00:00Z').toISOString(),
  ...overrides,
});

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const resetAuth = () => {
  useAuthStore.setState((state) => ({
    ...state,
    user: null,
    accessToken: null,
    refreshToken: null,
    accessMap: [],
    activeSessions: [],
    isAuthenticated: false,
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
    accessToken: 'token',
    refreshToken: 'refresh',
    isAuthenticated: true,
  }));
};

beforeEach(() => {
  resetAuth();
  authenticate();
});

afterEach(() => {
  queryClient?.clear();
  resetAuth();
  vi.restoreAllMocks();
});

describe('useCourseProgress', () => {
  it('loads course progress when authenticated', async () => {
    const initialProgress = progressFactory();

    server.use(
      http.get(`/api/academy/courses/${COURSE_ID}/progress`, () =>
        HttpResponse.json(successResponse(initialProgress)),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseProgress(COURSE_ID), { wrapper });

    await waitFor(() => expect(result.current.progress).toEqual(initialProgress));
    expect(result.current.isCompleted).toBe(false);
  });

  it('updates progress via mutation and syncs cache', async () => {
    const initialProgress = progressFactory({ percentage: 40, completedLessonIds: [] });
    const nextProgress = progressFactory({
      percentage: 80,
      completedLessonIds: ['lesson-1', 'lesson-2'],
      lastLessonId: 'lesson-2',
    });

    server.use(
      http.get(`/api/academy/courses/${COURSE_ID}/progress`, () =>
        HttpResponse.json(successResponse(initialProgress)),
      ),
      http.patch(`/api/academy/courses/${COURSE_ID}/progress`, async ({ request }) => {
        const body = (await request.json()) as Partial<CourseProgress>;
        expect(body).toMatchObject({ percentage: nextProgress.percentage });
        return HttpResponse.json(successResponse(nextProgress));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseProgress(COURSE_ID), { wrapper });

    await waitFor(() => expect(result.current.progress).toEqual(initialProgress));

    await result.current.updateProgressAsync({
      percentage: nextProgress.percentage,
      completedLessonIds: nextProgress.completedLessonIds,
      lastLessonId: nextProgress.lastLessonId,
    });

    await waitFor(() => expect(result.current.progress).toEqual(nextProgress));
  });

  it('logs error when mutation fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    server.use(
      http.get(`/api/academy/courses/${COURSE_ID}/progress`, () =>
        HttpResponse.json(successResponse(progressFactory())),
      ),
      http.patch(`/api/academy/courses/${COURSE_ID}/progress`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'PROGRESS_UPDATE_FAILED', message: 'failed' },
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        ),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseProgress(COURSE_ID), { wrapper });

    await waitFor(() => expect(result.current.progress).not.toBeNull());

    await expect(
      result.current.updateProgressAsync({
        percentage: 60,
        completedLessonIds: ['lesson-1'],
        lastLessonId: 'lesson-1',
      }),
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('useCoursesProgressMap', () => {
  it('aggregates multiple course progress queries', async () => {
    const progressA = progressFactory({ courseId: 'course-1', percentage: 30 });
    const progressB = progressFactory({ courseId: 'course-2', percentage: 90 });

    server.use(
      http.get('/api/academy/courses/course-1/progress', () =>
        HttpResponse.json(successResponse(progressA)),
      ),
      http.get('/api/academy/courses/course-2/progress', () =>
        HttpResponse.json(successResponse(progressB)),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCoursesProgressMap(['course-1', 'course-2']), { wrapper });

    await waitFor(() => expect(Object.keys(result.current.progressMap)).toHaveLength(2));
    expect(result.current.progressMap['course-2']).toEqual(progressB);
  });
});
