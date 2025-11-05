import type {
  LessonCommentModerationStatus,
  LessonCommentReply,
} from '@shared/types/academy.types';
import type { Nullable, UUID } from '@shared/types';

export interface CreateLessonCommentReplyInput {
  commentId: UUID;
  userId: UUID;
  body: string;
  parentReplyId?: Nullable<UUID>;
  pendingModeration: boolean;
  moderationStatus: LessonCommentModerationStatus;
  moderatedById?: Nullable<UUID>;
  moderatedAt?: Nullable<string>;
}

export interface UpdateLessonCommentReplyModerationInput {
  replyId: UUID;
  moderatorId: UUID;
  status: LessonCommentModerationStatus;
  moderatedAt: string;
}

export interface LessonCommentReplyRepository {
  create(input: CreateLessonCommentReplyInput): Promise<LessonCommentReply>;
  listByComments(commentIds: UUID[]): Promise<LessonCommentReply[]>;
  findById(replyId: UUID): Promise<LessonCommentReply | null>;
  updateModeration(input: UpdateLessonCommentReplyModerationInput): Promise<LessonCommentReply>;
  listByStatus(input: { status: Extract<LessonCommentModerationStatus, 'pending' | 'rejected'>; page: number; pageSize: number }): Promise<LessonCommentReply[]>;
}
