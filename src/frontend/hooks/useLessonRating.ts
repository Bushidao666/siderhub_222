import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LessonRating, LessonRatingSummary, LessonRatingValue } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

interface UseLessonRatingOptions {
  lessonId: string | null;
  enabled?: boolean;
}

const academyApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const fetchLessonRating = async (lessonId: string): Promise<LessonRatingSummary> => {
  const response = await academyApiClient.get<LessonRatingSummary>(`/academy/lessons/${lessonId}/rating`);
  assertSuccess<LessonRatingSummary>(response);
  return response.data;
};

type LessonRatingRequest = { value: LessonRatingValue };

const submitLessonRating = async (lessonId: string, value: LessonRatingValue): Promise<LessonRating> => {
  const response = await academyApiClient.post<LessonRating, LessonRatingRequest>(
    `/academy/lessons/${lessonId}/rating`,
    { value }
  );
  assertSuccess<LessonRating>(response);
  return response.data;
};

export const useLessonRating = ({ lessonId, enabled = true }: UseLessonRatingOptions) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();

  const shouldEnableQuery = Boolean(isAuthenticated && enabled && lessonId);

  const ratingQuery = useQuery({
    queryKey: lessonId ? queryKeys.academy.lessonRating(lessonId) : ['academy', 'lessons', 'unknown', 'rating'],
    queryFn: () => fetchLessonRating(lessonId as string),
    enabled: shouldEnableQuery,
    staleTime: 30 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (value: LessonRatingValue) => {
      if (!lessonId) {
        return Promise.reject(new Error('lessonId is required to submit a rating'));
      }
      return submitLessonRating(lessonId, value);
    },
    onMutate: async (value) => {
      if (!lessonId) return { previousSummary: undefined };

      await queryClient.cancelQueries({ queryKey: queryKeys.academy.lessonRating(lessonId) });
      const previousSummary = queryClient.getQueryData<LessonRatingSummary>(
        queryKeys.academy.lessonRating(lessonId)
      );

      const nextSummary = (() => {
        if (!previousSummary) {
          return {
            lessonId,
            average: value,
            totalRatings: 1,
            userRating: value,
          } satisfies LessonRatingSummary;
        }

        const totalWithoutUser = previousSummary.userRating
          ? previousSummary.average * previousSummary.totalRatings - previousSummary.userRating
          : previousSummary.average * previousSummary.totalRatings;

        const newTotalRatings = previousSummary.userRating
          ? previousSummary.totalRatings
          : previousSummary.totalRatings + 1;

        const newAverage = newTotalRatings === 0 ? value : (totalWithoutUser + value) / newTotalRatings;

        return {
          ...previousSummary,
          average: newAverage,
          totalRatings: newTotalRatings,
          userRating: value,
        };
      })();

      queryClient.setQueryData(queryKeys.academy.lessonRating(lessonId), nextSummary);

      return { previousSummary };
    },
    onError: (error, _variables, context) => {
      if (lessonId && context?.previousSummary) {
        queryClient.setQueryData(queryKeys.academy.lessonRating(lessonId), context.previousSummary);
      }
      console.error('Falha ao registrar avaliação da aula', mapApiError(error));
    },
    onSuccess: () => {
      if (!lessonId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.academy.lessonRating(lessonId) }).catch(() => {
        // noop — invalidation best effort
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.hub.dashboard(), exact: true });
    },
  });

  const summary = useMemo(() => ratingQuery.data ?? null, [ratingQuery.data]);

  return {
    summary,
    averageRating: summary?.average ?? 0,
    totalRatings: summary?.totalRatings ?? 0,
    userRating: summary?.userRating ?? null,
    isLoading: ratingQuery.isLoading,
    isFetching: ratingQuery.isFetching,
    error: ratingQuery.error ?? mutation.error,
    refetch: ratingQuery.refetch,
    setRating: mutation.mutate,
    setRatingAsync: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    canRate: shouldEnableQuery,
  };
};
