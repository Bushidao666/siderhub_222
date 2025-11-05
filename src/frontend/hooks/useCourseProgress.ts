import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';

import type { CourseProgress } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

const academyApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

type CourseProgressUpdatePayload = Pick<
  CourseProgress,
  'completedLessonIds' | 'lastLessonId' | 'percentage'
>;

export const fetchCourseProgress = async (courseId: string): Promise<CourseProgress> => {
  const response = await academyApiClient.get<CourseProgress>(`/academy/courses/${courseId}/progress`);
  assertSuccess<CourseProgress>(response);
  return response.data;
};

const updateCourseProgress = async (
  courseId: string,
  payload: CourseProgressUpdatePayload
): Promise<CourseProgress> => {
  const response = await academyApiClient.patch<CourseProgress, CourseProgressUpdatePayload>(
    `/academy/courses/${courseId}/progress`,
    payload
  );
  assertSuccess<CourseProgress>(response);
  return response.data;
};

export const useCourseProgress = (courseId: string | null) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.academy.progress(courseId ?? 'unknown'),
    queryFn: () => fetchCourseProgress(courseId as string),
    enabled: Boolean(isAuthenticated && courseId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: (payload: CourseProgressUpdatePayload) => {
      if (!courseId) {
        return Promise.reject(new Error('courseId is required to update progress'));
      }
      return updateCourseProgress(courseId, payload);
    },
    onSuccess: (nextProgress) => {
      if (!courseId) return;
      queryClient.setQueryData(queryKeys.academy.progress(courseId), nextProgress);
    },
    onError: (error) => {
      console.error('Falha ao atualizar progresso do curso', mapApiError(error));
    },
  });

  const isCompleted = useMemo(() => query.data?.percentage === 100, [query.data?.percentage]);

  return {
    progress: query.data ?? null,
    isCompleted,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    error: query.error,
    updateProgress: mutation.mutate,
    updateProgressAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
};

export const useCoursesProgressMap = (courseIds: string[] | null | undefined) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const normalizedIds = useMemo(() => {
    if (!courseIds?.length) return [] as string[];
    return Array.from(new Set(courseIds.filter((id): id is string => Boolean(id))));
  }, [courseIds]);

  const queries = useQueries({
    queries: normalizedIds.map((courseId) => ({
      queryKey: queryKeys.academy.progress(courseId),
      queryFn: () => fetchCourseProgress(courseId),
      enabled: Boolean(isAuthenticated && courseId),
      staleTime: 2 * 60 * 1000,
      retry: 1,
    })),
  });

  const progressMap = normalizedIds.reduce<Partial<Record<string, CourseProgress>>>((acc, courseId, index) => {
    const result = queries[index];
    if (result?.data) {
      acc[courseId] = result.data;
    }
    return acc;
  }, {});

  const isLoading = queries.some((result) => result.isLoading);
  const isFetching = queries.some((result) => result.isFetching);
  const errors = queries
    .map((result) => result.error)
    .filter((error): error is unknown => Boolean(error));

  const refetchAll = async () => {
    await Promise.all(queries.map((result) => result.refetch()));
  };

  return {
    progressMap,
    isLoading,
    isFetching,
    errors,
    refetchAll,
  };
};
