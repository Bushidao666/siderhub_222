import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LessonComment, LessonCommentReply } from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, selectUser, useAuthStore } from '../store/auth';

interface UseLessonCommentsOptions {
  lessonId: string | null;
  enabled?: boolean;
}

interface CommentInput {
  body: string;
}

interface ReplyInput {
  commentId: string;
  parentReplyId?: string | null;
  body: string;
}

interface MutationContext {
  previousComments?: LessonComment[];
  optimisticId: string | null;
}

const USER_PLACEHOLDER = 'unknown-user';
const LESSON_PLACEHOLDER = 'unknown-lesson';
const COMMENT_PLACEHOLDER = 'unknown-comment';

const academyApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const createOptimisticId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const applyReplyDefaults = (rawReply: Partial<LessonCommentReply>): LessonCommentReply => {
  const timestamp = rawReply.createdAt ?? new Date().toISOString();
  const pendingModeration =
    rawReply.pendingModeration ?? (rawReply.moderationStatus ? rawReply.moderationStatus === 'pending' : false);
  const moderationStatus = rawReply.moderationStatus ?? (pendingModeration ? 'pending' : 'approved');
  const normalizedReplies = Array.isArray(rawReply.replies) ? rawReply.replies.map(applyReplyDefaults) : [];

  return {
    id: rawReply.id ?? createOptimisticId(),
    commentId: rawReply.commentId ?? COMMENT_PLACEHOLDER,
    parentReplyId: rawReply.parentReplyId ?? null,
    userId: rawReply.userId ?? USER_PLACEHOLDER,
    body: rawReply.body ?? '',
    createdAt: timestamp,
    pendingModeration,
    moderationStatus,
    moderatedById: rawReply.moderatedById ?? null,
    moderatedAt: rawReply.moderatedAt ?? null,
    replies: normalizedReplies,
  } satisfies LessonCommentReply;
};

const applyCommentDefaults = (rawComment: Partial<LessonComment>): LessonComment => {
  const timestamp = rawComment.createdAt ?? new Date().toISOString();
  const pendingModeration = rawComment.pendingModeration ?? false;
  const moderationStatus = rawComment.moderationStatus ?? (pendingModeration ? 'pending' : 'approved');
  const normalizedReplies = Array.isArray(rawComment.replies) ? rawComment.replies.map(applyReplyDefaults) : [];

  return {
    id: rawComment.id ?? createOptimisticId(),
    lessonId: rawComment.lessonId ?? LESSON_PLACEHOLDER,
    userId: rawComment.userId ?? USER_PLACEHOLDER,
    body: rawComment.body ?? '',
    createdAt: timestamp,
    updatedAt: rawComment.updatedAt ?? timestamp,
    pendingModeration,
    moderationStatus,
    moderatedById: rawComment.moderatedById ?? null,
    moderatedAt: rawComment.moderatedAt ?? null,
    replies: normalizedReplies,
  } satisfies LessonComment;
};

const fetchLessonComments = async (lessonId: string): Promise<LessonComment[]> => {
  const response = await academyApiClient.get<LessonComment[]>(`/academy/lessons/${lessonId}/comments`);
  assertSuccess<LessonComment[]>(response);
  const comments = response.data ?? [];
  return comments.map(applyCommentDefaults);
};

const createOptimisticComment = (lessonId: string, body: string, userId: string | null): LessonComment => {
  const timestamp = new Date().toISOString();
  return {
    id: createOptimisticId(),
    lessonId,
    userId: userId ?? USER_PLACEHOLDER,
    body,
    createdAt: timestamp,
    updatedAt: timestamp,
    pendingModeration: true,
    moderationStatus: 'pending',
    moderatedById: null,
    moderatedAt: null,
    replies: [],
  } satisfies LessonComment;
};

const createOptimisticReply = (
  commentId: string,
  parentReplyId: string | null,
  body: string,
  userId: string | null,
): LessonCommentReply => {
  const timestamp = new Date().toISOString();
  return {
    id: createOptimisticId(),
    commentId,
    parentReplyId,
    userId: userId ?? USER_PLACEHOLDER,
    body,
    createdAt: timestamp,
    pendingModeration: true,
    moderationStatus: 'pending',
    moderatedById: null,
    moderatedAt: null,
    replies: [],
  } satisfies LessonCommentReply;
};

const insertReplyIntoTree = (
  replies: LessonCommentReply[],
  reply: LessonCommentReply,
): { nextReplies: LessonCommentReply[]; inserted: boolean } => {
  if (!reply.parentReplyId) {
    return { nextReplies: [reply, ...replies], inserted: true };
  }

  let inserted = false;
  const nextReplies = replies.map((item) => {
    if (item.id === reply.parentReplyId) {
      inserted = true;
      return { ...item, replies: [reply, ...item.replies] };
    }

    if (item.replies.length) {
      const { nextReplies: childReplies, inserted: childInserted } = insertReplyIntoTree(item.replies, reply);
      if (childInserted) {
        inserted = true;
        return { ...item, replies: childReplies };
      }
    }

    return item;
  });

  if (!inserted) {
    return { nextReplies: [reply, ...replies], inserted: false };
  }

  return { nextReplies, inserted: true };
};

const addReplyToComments = (comments: LessonComment[], reply: LessonCommentReply): LessonComment[] =>
  comments.map((comment) => {
    if (comment.id !== reply.commentId) {
      return comment;
    }
    const { nextReplies } = insertReplyIntoTree(comment.replies, reply);
    return { ...comment, replies: nextReplies };
  });

const replaceReplyById = (
  replies: LessonCommentReply[],
  targetId: string,
  incoming: LessonCommentReply,
): LessonCommentReply[] =>
  replies.map((item) => {
    if (item.id === targetId) {
      return incoming;
    }
    if (item.replies.length) {
      const nested = replaceReplyById(item.replies, targetId, incoming);
      if (nested !== item.replies) {
        return { ...item, replies: nested };
      }
    }
    return item;
  });

const replaceReplyInComments = (
  comments: LessonComment[],
  targetId: string,
  incoming: LessonCommentReply,
): LessonComment[] =>
  comments.map((comment) => {
    if (comment.replies.length === 0) {
      return comment;
    }
    const nextReplies = replaceReplyById(comment.replies, targetId, incoming);
    if (nextReplies === comment.replies) {
      return comment;
    }
    return { ...comment, replies: nextReplies };
  });

export const useLessonComments = ({ lessonId, enabled = true }: UseLessonCommentsOptions) => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const queryClient = useQueryClient();

  const queryKey = lessonId
    ? queryKeys.academy.lessonComments(lessonId)
    : ['academy', 'lessons', 'unknown', 'comments'];
  const canFetch = Boolean(lessonId && enabled && isAuthenticated);

  const commentsQuery = useQuery({
    queryKey,
    queryFn: () => fetchLessonComments(lessonId as string),
    enabled: canFetch,
    staleTime: 30 * 1000,
  });

  const commentMutation = useMutation<LessonComment, Error, CommentInput, MutationContext>({
    mutationFn: async ({ body }) => {
      if (!lessonId) {
        throw new Error('lessonId é obrigatório para publicar comentários');
      }
      const response = await academyApiClient.post<LessonComment, CommentInput>(
        `/academy/lessons/${lessonId}/comments`,
        { body },
      );
      assertSuccess<LessonComment>(response);
      return applyCommentDefaults(response.data);
    },
    onMutate: async ({ body }) => {
      if (!lessonId) {
        return { previousComments: undefined, optimisticId: null };
      }

      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData<LessonComment[]>(queryKey) ?? [];
      const optimisticComment = createOptimisticComment(lessonId, body, user?.id ?? null);

      queryClient.setQueryData(queryKey, [optimisticComment, ...previousComments]);

      return { previousComments, optimisticId: optimisticComment.id };
    },
    onError: (error, _variables, context) => {
      if (lessonId && context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
      console.error('Falha ao publicar comentário da aula', mapApiError(error));
    },
    onSuccess: (comment, _variables, context) => {
      if (!lessonId) {
        return;
      }

      queryClient.setQueryData<LessonComment[]>(queryKey, (cached = []) => {
        if (!context?.optimisticId) {
          return [comment, ...cached];
        }
        return cached.map((item) => (item.id === context.optimisticId ? comment : item));
      });
    },
    onSettled: () => {
      if (!lessonId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey }).catch(() => {
        // noop — invalidation best effort
      });
    },
  });

  const replyMutation = useMutation<LessonCommentReply, Error, ReplyInput, MutationContext>({
    mutationFn: async ({ commentId, parentReplyId, body }) => {
      if (!lessonId) {
        throw new Error('lessonId é obrigatório para responder comentários');
      }
      const response = await academyApiClient.post<LessonCommentReply, Omit<ReplyInput, 'commentId'>>(
        `/academy/lessons/${lessonId}/comments/${commentId}/replies`,
        { body, parentReplyId: parentReplyId ?? null },
      );
      assertSuccess<LessonCommentReply>(response);
      return applyReplyDefaults(response.data);
    },
    onMutate: async ({ commentId, parentReplyId, body }) => {
      if (!lessonId) {
        return { previousComments: undefined, optimisticId: null };
      }

      await queryClient.cancelQueries({ queryKey });

      const previousComments = queryClient.getQueryData<LessonComment[]>(queryKey) ?? [];
      const optimisticReply = createOptimisticReply(commentId, parentReplyId ?? null, body, user?.id ?? null);

      queryClient.setQueryData<LessonComment[]>(queryKey, (cached = []) =>
        addReplyToComments(cached, optimisticReply)
      );

      return { previousComments, optimisticId: optimisticReply.id };
    },
    onError: (error, _variables, context) => {
      if (lessonId && context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
      console.error('Falha ao publicar resposta do comentário', mapApiError(error));
    },
    onSuccess: (reply, _variables, context) => {
      if (!lessonId) {
        return;
      }
      queryClient.setQueryData<LessonComment[]>(queryKey, (cached = []) => {
        const normalizedReply = applyReplyDefaults(reply);
        if (!context?.optimisticId) {
          return addReplyToComments(cached, normalizedReply);
        }
        return replaceReplyInComments(cached, context.optimisticId, normalizedReply);
      });
    },
    onSettled: () => {
      if (!lessonId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey }).catch(() => {
        // noop — invalidation best effort
      });
    },
  });

  const comments = useMemo(() => commentsQuery.data ?? [], [commentsQuery.data]);

  return {
    comments,
    hasComments: comments.length > 0,
    isLoading: commentsQuery.isLoading,
    isFetching: commentsQuery.isFetching,
    error: commentsQuery.error ?? commentMutation.error ?? replyMutation.error,
    refetch: commentsQuery.refetch,
    addComment: commentMutation.mutate,
    addCommentAsync: commentMutation.mutateAsync,
    addReply: replyMutation.mutate,
    addReplyAsync: replyMutation.mutateAsync,
    isSubmitting: commentMutation.isPending,
    isReplying: replyMutation.isPending,
  };
};
