import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CommentModerationItem, LessonCommentModerationStatus } from '../../shared/types';
import { UserRole } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, selectUser, useAuthStore } from '../store/auth';

const DEFAULT_STATUS: LessonCommentModerationStatus = 'pending';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

interface UseCommentModerationOptions {
  status?: LessonCommentModerationStatus;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface ModerateCommentInput {
  id: string;
  entityId: string;
  commentId: string;
  type: CommentModerationItem['type'];
  action: 'approve' | 'reject';
}

interface ModerateContext {
  previousItems?: CommentModerationItem[];
}

const adminApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const fetchModerationQueue = async (params: {
  status: LessonCommentModerationStatus;
  page: number;
  pageSize: number;
}): Promise<CommentModerationItem[]> => {
  const searchParams = new URLSearchParams({
    status: params.status,
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  });

  const response = await adminApiClient.get<CommentModerationItem[]>(
    `/admin/academy/comments/moderation?${searchParams.toString()}`,
  );
  assertSuccess<CommentModerationItem[]>(response);
  return response.data ?? [];
};

const buildModerationEndpoint = (input: ModerateCommentInput): string => {
  if (input.type === 'reply') {
    return `/admin/academy/comments/${input.commentId}/replies/${input.entityId}/moderation`;
  }
  return `/admin/academy/comments/${input.entityId}/moderation`;
};

const actionToStatus = (action: ModerateCommentInput['action']): LessonCommentModerationStatus =>
  action === 'approve' ? 'approved' : 'rejected';

export const useCommentModeration = ({
  status = DEFAULT_STATUS,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseCommentModerationOptions = {}) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const queryClient = useQueryClient();

  const isModerator = Boolean(
    user && [UserRole.Admin, UserRole.SuperAdmin, UserRole.Mentor].includes(user.role),
  );

  const filters = { status, page, pageSize } as const;
  const moderationKey = queryKeys.admin.commentModeration(filters);
  const canFetch = Boolean(enabled && isAuthenticated && isModerator);

  const moderationQuery = useQuery({
    queryKey: moderationKey,
    enabled: canFetch,
    queryFn: () => fetchModerationQueue(filters),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const moderateMutation = useMutation<CommentModerationItem, Error, ModerateCommentInput, ModerateContext>({
    mutationFn: async (input) => {
      const response = await adminApiClient.patch<CommentModerationItem, { status: LessonCommentModerationStatus }>(
        buildModerationEndpoint(input),
        { status: actionToStatus(input.action) },
      );
      assertSuccess<CommentModerationItem>(response);
      return response.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: moderationKey });
      const previousItems = queryClient.getQueryData<CommentModerationItem[]>(moderationKey) ?? [];

      queryClient.setQueryData<CommentModerationItem[]>(
        moderationKey,
        previousItems.filter((item) => item.id !== input.id),
      );

      return { previousItems };
    },
    onError: (error, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(moderationKey, context.previousItems);
      }
      console.error('Falha ao moderar comentário', mapApiError(error));
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<CommentModerationItem[]>(moderationKey, (cached = []) =>
        cached.filter((item) => item.id !== updatedItem.id),
      );
    },
    onSettled: () => {
      if (!canFetch) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: moderationKey }).catch(() => {
        // noop — invalidation best effort
      });
    },
  });

  const items = useMemo(() => moderationQuery.data ?? [], [moderationQuery.data]);

  const approve = (input: Omit<ModerateCommentInput, 'action'>) =>
    moderateMutation.mutate({ ...input, action: 'approve' });
  const approveAsync = (input: Omit<ModerateCommentInput, 'action'>) =>
    moderateMutation.mutateAsync({ ...input, action: 'approve' });

  const reject = (input: Omit<ModerateCommentInput, 'action'>) =>
    moderateMutation.mutate({ ...input, action: 'reject' });
  const rejectAsync = (input: Omit<ModerateCommentInput, 'action'>) =>
    moderateMutation.mutateAsync({ ...input, action: 'reject' });

  return {
    items,
    hasItems: items.length > 0,
    isLoading: moderationQuery.isLoading,
    isFetching: moderationQuery.isFetching,
    error: moderationQuery.error ?? moderateMutation.error,
    refetch: moderationQuery.refetch,
    approve,
    approveAsync,
    reject,
    rejectAsync,
    isModerating: moderateMutation.isPending,
  };
};

export type UseCommentModerationResult = ReturnType<typeof useCommentModeration>;
