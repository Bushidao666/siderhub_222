import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LessonProgressSnapshot, LessonProgressTickPayload } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

interface UseLessonVideoTrackingOptions {
  lessonId: string | null;
  courseId: string | null;
  durationMs: number | null;
  getPositionMs: () => number;
  isPlaying: boolean;
  tickIntervalMs?: number;
  completionThreshold?: number;
  enabled?: boolean;
  onCompleted?: () => void;
  onError?: (message: string) => void;
}

interface EmitTickOptions {
  force?: boolean;
  completed?: boolean;
  positionMs?: number;
}

const DEFAULT_TICK_INTERVAL_MS = 10_000;
const DEFAULT_COMPLETION_THRESHOLD = 0.9;

const academyApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const fetchLessonProgressSnapshot = async (lessonId: string): Promise<LessonProgressSnapshot | null> => {
  const response = await academyApiClient.get<LessonProgressSnapshot>(`/academy/lessons/${lessonId}/progress`);
  if (response.success !== true) {
    return null;
  }
  return response.data;
};

type LessonProgressTickRequest = Omit<LessonProgressTickPayload, 'userId'>;

const recordLessonProgressTick = async (
  lessonId: string,
  payload: LessonProgressTickRequest
): Promise<LessonProgressSnapshot> => {
  const response = await academyApiClient.post<LessonProgressSnapshot, LessonProgressTickRequest>(
    `/academy/lessons/${lessonId}/progress-tick`,
    payload
  );
  assertSuccess<LessonProgressSnapshot>(response);
  return response.data;
};

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const useLessonVideoTracking = ({
  lessonId,
  courseId,
  durationMs,
  getPositionMs,
  isPlaying,
  tickIntervalMs = DEFAULT_TICK_INTERVAL_MS,
  completionThreshold = DEFAULT_COMPLETION_THRESHOLD,
  enabled = true,
  onCompleted,
  onError,
}: UseLessonVideoTrackingOptions) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();

  const [isVisible, setIsVisible] = useState(() => (!isBrowser ? true : document.visibilityState === 'visible'));

  const lastTickAtRef = useRef<number>(0);
  const lastKnownPositionRef = useRef<number>(0);
  const wasCompletedRef = useRef<boolean>(false);

  const canTrack = Boolean(
    lessonId && courseId && durationMs && durationMs > 0 && isAuthenticated && enabled
  );

  const progressQuery = useQuery({
    queryKey: lessonId ? queryKeys.academy.lessonProgress(lessonId) : ['academy', 'lessons', 'unknown', 'progress'],
    queryFn: () => fetchLessonProgressSnapshot(lessonId as string),
    enabled: canTrack,
    staleTime: 30 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (payload: EmitTickOptions) => {
      if (!lessonId || !courseId || !durationMs) {
        return Promise.reject(new Error('lessonId, courseId e durationMs são obrigatórios'));
      }

      const now = new Date().toISOString();
      const rawPosition = payload.positionMs ?? getPositionMs();
      const clampedPosition = Math.max(0, Math.min(rawPosition, durationMs));
      lastKnownPositionRef.current = clampedPosition;

      const completedByThreshold = clampedPosition / durationMs >= completionThreshold;
      const completed = payload.completed ?? completedByThreshold;

      const tickPayload: LessonProgressTickRequest = {
        lessonId,
        courseId,
        durationMs,
        positionMs: Math.round(clampedPosition),
        completed,
        emittedAt: now,
      };

      return recordLessonProgressTick(lessonId, tickPayload);
    },
    onSuccess: (snapshot) => {
      if (!lessonId) return;

      queryClient.setQueryData(queryKeys.academy.lessonProgress(lessonId), snapshot);
      lastKnownPositionRef.current = snapshot.lastPositionMs;

      if (snapshot.completed && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.academy.progress(courseId) });
        if (!wasCompletedRef.current) {
          wasCompletedRef.current = true;
          onCompleted?.();
        }
      } else if (!snapshot.completed) {
        wasCompletedRef.current = false;
      }
    },
    onError: (error) => {
      lastTickAtRef.current = 0;
      const message = mapApiError(error);
      console.error('Falha ao registrar progresso da aula', message);
      onError?.(message);
    },
  });

  const emitTick = useCallback(
    (options: EmitTickOptions = {}) => {
      if (!canTrack) return;

      const now = Date.now();
      if (!options.force && now - lastTickAtRef.current < tickIntervalMs) {
        return;
      }

      lastTickAtRef.current = now;
      mutation.mutate(options);
    },
    [canTrack, mutation, tickIntervalMs]
  );

  const markCompleted = useCallback(() => {
    if (!canTrack) return;
    const positionMs = durationMs ?? lastKnownPositionRef.current;
    emitTick({ force: true, completed: true, positionMs });
  }, [canTrack, durationMs, emitTick]);

  useEffect(() => {
    if (!isBrowser) return undefined;

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const snapshot = progressQuery.data;

    if (snapshot && typeof snapshot.lastPositionMs === 'number') {
      lastKnownPositionRef.current = snapshot.lastPositionMs;
    }

    if (snapshot?.completed) {
      if (!wasCompletedRef.current) {
        wasCompletedRef.current = true;
        onCompleted?.();
      }
    } else {
      wasCompletedRef.current = false;
    }
  }, [progressQuery.data, onCompleted]);

  useEffect(() => {
    if (!canTrack || !isPlaying || !isVisible || progressQuery.isLoading) {
      return undefined;
    }

    emitTick({ force: true });

    const intervalId = window.setInterval(() => {
      emitTick();
    }, tickIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canTrack, emitTick, isPlaying, isVisible, progressQuery.isLoading, tickIntervalMs]);

  const progress = useMemo(() => progressQuery.data ?? null, [progressQuery.data]);

  return {
    progress,
    isTracking: canTrack,
    isLoadingSnapshot: progressQuery.isLoading,
    isSendingTick: mutation.isPending,
    lastError: progressQuery.error ?? mutation.error ?? null,
    sendTick: emitTick,
    markCompleted,
    refetchSnapshot: progressQuery.refetch,
  };
};
