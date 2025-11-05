import type { LessonComment, LessonCommentReply } from '../../shared/types/academy.types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess } from '../../shared/utils/errorHandler';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

const academyApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    const store = useAuthStore.getState();
    if (selectIsAuthenticated(store)) {
      void store.logout();
    }
  },
});

const commentModerationPath = (lessonId: string, commentId: string) =>
  `/academy/lessons/${lessonId}/comments/${commentId}`;

export const academyService = {
  async approveLessonComment(lessonId: string, commentId: string): Promise<LessonComment> {
    const response = await academyApiClient.post<LessonComment>(
      `${commentModerationPath(lessonId, commentId)}/approve`,
    );
    assertSuccess<LessonComment>(response);
    return response.data;
  },
  async rejectLessonComment(lessonId: string, commentId: string): Promise<LessonComment> {
    const response = await academyApiClient.post<LessonComment>(
      `${commentModerationPath(lessonId, commentId)}/reject`,
    );
    assertSuccess<LessonComment>(response);
    return response.data;
  },
  async approveLessonCommentReply(
    lessonId: string,
    commentId: string,
    replyId: string,
  ): Promise<LessonCommentReply> {
    const response = await academyApiClient.post<LessonCommentReply>(
      `${commentModerationPath(lessonId, commentId)}/replies/${replyId}/approve`,
    );
    assertSuccess<LessonCommentReply>(response);
    return response.data;
  },
  async rejectLessonCommentReply(
    lessonId: string,
    commentId: string,
    replyId: string,
  ): Promise<LessonCommentReply> {
    const response = await academyApiClient.post<LessonCommentReply>(
      `${commentModerationPath(lessonId, commentId)}/replies/${replyId}/reject`,
    );
    assertSuccess<LessonCommentReply>(response);
    return response.data;
  },
};

export type AcademyService = typeof academyService;
