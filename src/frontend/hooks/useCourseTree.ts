import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { CourseModule, CourseTree } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

interface UseCourseTreeOptions {
  courseId: string | null;
  enabled?: boolean;
  staleTimeMs?: number;
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000;

const academyApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const fetchCourseTree = async (courseId: string): Promise<CourseTree> => {
  const response = await academyApiClient.get<CourseTree>(`/academy/courses/${courseId}/tree`);
  assertSuccess<CourseTree>(response);
  return response.data;
};

export const useCourseTree = ({ courseId, enabled = false, staleTimeMs = DEFAULT_STALE_TIME }: UseCourseTreeOptions) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();

  const queryKey = courseId ? queryKeys.academy.courseTree(courseId) : ['academy', 'courses', 'unknown', 'tree'];
  const canFetch = Boolean(courseId && enabled && isAuthenticated);

  const courseTreeQuery = useQuery({
    queryKey,
    queryFn: () => fetchCourseTree(courseId as string),
    enabled: canFetch,
    staleTime: staleTimeMs,
    gcTime: staleTimeMs * 6,
  });

  const prefetch = useCallback(async () => {
    if (!courseId) {
      return;
    }
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => fetchCourseTree(courseId),
        staleTime: staleTimeMs,
      });
    } catch (error) {
      console.error('Falha ao prefetch do course tree', mapApiError(error));
    }
  }, [courseId, queryClient, queryKey, staleTimeMs]);

  const load = useCallback(async () => {
    if (!courseId) {
      throw new Error('courseId é obrigatório para carregar o course tree');
    }
    return queryClient.fetchQuery({
      queryKey,
      queryFn: () => fetchCourseTree(courseId),
      staleTime: staleTimeMs,
    });
  }, [courseId, queryClient, queryKey, staleTimeMs]);

  const courseTree = useMemo(() => courseTreeQuery.data ?? null, [courseTreeQuery.data]);
  const modules: CourseModule[] = useMemo(() => courseTree?.modules ?? [], [courseTree]);
  const hasContent = modules.length > 0;

  return {
    courseTree,
    modules,
    hasContent,
    isLoading: courseTreeQuery.isLoading,
    isFetching: courseTreeQuery.isFetching,
    error: courseTreeQuery.error,
    refetch: courseTreeQuery.refetch,
    prefetch,
    load,
  };
};

