import type { LessonComment, LessonCommentModerationStatus } from '@shared/types/academy.types';
import type { UUID } from '@shared/types';

export interface CreateLessonCommentInput {
  lessonId: UUID;
  userId: UUID;
  body: string;
  pendingModeration: boolean;
  moderationStatus: LessonCommentModerationStatus;
}

export interface ListLessonCommentsInput {
  lessonId: UUID;
  page: number;
  pageSize: number;
  after?: UUID;
}

export interface ListPendingLessonCommentsInput {
  page: number;
  pageSize: number;
  status?: LessonCommentModerationStatus;
}

export interface UpdateLessonCommentModerationInput {
  commentId: UUID;
  moderatorId: UUID;
  status: LessonCommentModerationStatus;
  moderatedAt: string;
}

export interface LessonCommentRepository {
  create(input: CreateLessonCommentInput): Promise<LessonComment>;
  listByLesson(input: ListLessonCommentsInput): Promise<LessonComment[]>;
  listPending(input: ListPendingLessonCommentsInput): Promise<LessonComment[]>;
  findById(commentId: UUID): Promise<LessonComment | null>;
  updateModeration(input: UpdateLessonCommentModerationInput): Promise<LessonComment>;
}
