import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { LessonRating, LessonRatingSummary } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { LessonRatingValue, UserRole } from '@shared/types';
import { useLessonRating } from 'src/frontend/hooks/useLessonRating';
import { useAuthStore } from 'src/frontend/store/auth';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const ratingSummary = (overrides: Partial<LessonRatingSummary> = {}): LessonRatingSummary => ({
  lessonId: overrides.lessonId ?? 'lesson-1',
  average: overrides.average ?? 4.5,
  totalRatings: overrides.totalRatings ?? 10,
  userRating: overrides.userRating ?? 5,
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

describe('useLessonRating', () => {
  it('fetches summary and updates after submitting rating', async () => {
    const initialSummary = ratingSummary({ average: 4, totalRatings: 5, userRating: 4 });
    const updatedSummary = ratingSummary({ average: 4.2, totalRatings: 5, userRating: 5 });
    let currentSummary = initialSummary;

    server.use(
      http.get('/api/academy/lessons/lesson-1/rating', () => HttpResponse.json(successResponse(currentSummary))),
      http.post('/api/academy/lessons/lesson-1/rating', async ({ request }) => {
        const body = (await request.json()) as { value: LessonRatingValue };
        expect(body.value).toBe(5);
        currentSummary = updatedSummary;
        const rating: LessonRating = {
          id: 'rating-1',
          lessonId: 'lesson-1',
          userId: 'user-1',
          value: body.value,
          createdAt: new Date().toISOString(),
        };
        return HttpResponse.json(successResponse(rating));
      }),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonRating({ lessonId: 'lesson-1' }), { wrapper });

    await waitFor(() => expect(result.current.summary).toEqual(initialSummary));

    await act(async () => {
      result.current.setRating(5);
    });

    await waitFor(() => expect(result.current.summary).toEqual(updatedSummary));
    expect(result.current.userRating).toBe(5);
  });

  it('does not run query when lessonId is null', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonRating({ lessonId: null }), { wrapper });

    expect(result.current.summary).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('rolls back optimistic update when submission fails', async () => {
    const initialSummary = ratingSummary({ average: 3.5, totalRatings: 2, userRating: 3 });

    server.use(
      http.get('/api/academy/lessons/lesson-1/rating', () => HttpResponse.json(successResponse(initialSummary))),
      http.post('/api/academy/lessons/lesson-1/rating', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'LESSON_RATING_UNAVAILABLE', message: 'Unavailable' },
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        ),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonRating({ lessonId: 'lesson-1' }), { wrapper });

    await waitFor(() => expect(result.current.summary).toEqual(initialSummary));

    await act(async () => {
      await expect(result.current.setRatingAsync(5)).rejects.toBeTruthy();
    });

    expect(result.current.summary).toEqual(initialSummary);
    expect(result.current.userRating).toBe(3);
  });
});
