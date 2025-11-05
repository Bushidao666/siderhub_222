import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CourseTree } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { CourseStatus, LessonType, Visibility, UserRole } from '@shared/types';
import { useCourseTree } from 'src/frontend/hooks/useCourseTree';
import { queryKeys } from 'src/frontend/lib/queryClient';
import { useAuthStore } from 'src/frontend/store/auth';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const COURSE_TREE: CourseTree = {
  id: 'course-1',
  slug: 'curso-estrategias',
  title: 'Estratégias avançadas',
  subtitle: 'Domine o funil neon',
  description: 'Curso completo com módulos e aulas práticas.',
  coverImage: null,
  level: 'advanced',
  status: CourseStatus.Published,
  visibility: Visibility.Members,
  estimatedDurationMinutes: 320,
  totalLessons: 24,
  tags: ['hidra', 'growth'],
  releaseDate: null,
  isFeatured: true,
  recommendationScore: 0.92,
  createdAt: new Date('2025-10-01T09:00:00Z').toISOString(),
  updatedAt: new Date('2025-10-02T09:00:00Z').toISOString(),
  modules: [
    {
      id: 'module-1',
      courseId: 'course-1',
      order: 1,
      title: 'Introdução',
      description: 'Visão geral do curso.',
      durationMinutes: 45,
      dripReleaseAt: null,
      dripDaysAfter: null,
      dripAfterModuleId: null,
      lessons: [
        {
          id: 'lesson-1',
          moduleId: 'module-1',
          order: 1,
          title: 'Boas-vindas',
          summary: 'Conheça a estrutura do programa.',
          type: LessonType.Video,
          content: {
            type: LessonType.Video,
            video: {
              videoUrl: 'https://cdn.siderhub.dev/videos/intro.mp4',
              durationSeconds: 420,
              captionsUrl: null,
              transcript: null,
            },
          },
          durationMinutes: 7,
          isPreview: true,
          releaseAt: null,
        },
      ],
    },
  ],
};

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

describe('useCourseTree', () => {
  it('loads the course tree on demand', async () => {
    server.use(
      http.get('/api/academy/courses/course-1/tree', () => HttpResponse.json(successResponse(COURSE_TREE))),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseTree({ courseId: 'course-1', enabled: false }), {
      wrapper,
    });

    expect(result.current.courseTree).toBeNull();

    await act(async () => {
      await result.current.load();
    });

    await waitFor(() => expect(result.current.courseTree).toEqual(COURSE_TREE));
    expect(result.current.hasContent).toBe(true);
    expect(result.current.modules).toHaveLength(1);
  });

  it('prefetches the course tree without triggering immediate fetch', async () => {
    server.use(
      http.get('/api/academy/courses/course-1/tree', () => HttpResponse.json(successResponse(COURSE_TREE))),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCourseTree({ courseId: 'course-1', enabled: false }), {
      wrapper,
    });

    await act(async () => {
      await result.current.prefetch();
    });

    const cached = queryClient.getQueryData<CourseTree>(queryKeys.academy.courseTree('course-1'));
    expect(cached).toEqual(COURSE_TREE);

    expect(result.current.courseTree).toBeNull();

    await act(async () => {
      await result.current.load();
    });

    await waitFor(() => expect(result.current.courseTree).toEqual(COURSE_TREE));
  });
});
