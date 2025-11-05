import type { LessonCommentModerationStatus, LessonCommentReply } from '@shared/types/academy.types';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateLessonCommentReplyInput,
  LessonCommentReplyRepository,
  UpdateLessonCommentReplyModerationInput,
} from './LessonCommentReplyRepository';

const mapReply = (
  reply: Prisma.LessonCommentReplyGetPayload<Record<string, never>>,
): LessonCommentReply => ({
  id: reply.id,
  commentId: reply.commentId,
  parentReplyId: reply.parentReplyId ?? null,
  userId: reply.userId,
  body: reply.body,
  createdAt: reply.createdAt.toISOString(),
  pendingModeration: reply.pendingModeration,
  moderationStatus: reply.moderationStatus as LessonCommentModerationStatus,
  moderatedById: reply.moderatedById ?? null,
  moderatedAt: reply.moderatedAt?.toISOString() ?? null,
  replies: [],
});

export class PrismaLessonCommentReplyRepository implements LessonCommentReplyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateLessonCommentReplyInput): Promise<LessonCommentReply> {
    const record = await this.prisma.lessonCommentReply.create({
      data: {
        commentId: input.commentId,
        userId: input.userId,
        body: input.body,
        parentReplyId: input.parentReplyId ?? null,
        pendingModeration: input.pendingModeration,
        moderationStatus: input.moderationStatus,
        moderatedById: input.moderatedById ?? null,
        moderatedAt: input.moderatedAt ? new Date(input.moderatedAt) : null,
      },
    });

    return mapReply(record);
  }

  async listByComments(commentIds: string[]): Promise<LessonCommentReply[]> {
    if (commentIds.length === 0) {
      return [];
    }

    const records = await this.prisma.lessonCommentReply.findMany({
      where: { commentId: { in: commentIds } },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(mapReply);
  }

  async findById(replyId: string): Promise<LessonCommentReply | null> {
    const record = await this.prisma.lessonCommentReply.findUnique({ where: { id: replyId } });
    return record ? mapReply(record) : null;
  }

  async updateModeration(input: UpdateLessonCommentReplyModerationInput): Promise<LessonCommentReply> {
    const record = await this.prisma.lessonCommentReply.update({
      where: { id: input.replyId },
      data: {
        moderationStatus: input.status,
        pendingModeration: input.status === 'pending',
        moderatedById: input.status === 'pending' ? null : input.moderatorId,
        moderatedAt: input.status === 'pending' ? null : new Date(input.moderatedAt),
      },
    });
    return mapReply(record);
  }

  async listByStatus(input: { status: 'pending' | 'rejected'; page: number; pageSize: number }): Promise<LessonCommentReply[]> {
    const skip = (input.page - 1) * input.pageSize;
    const records = await this.prisma.lessonCommentReply.findMany({
      where: { moderationStatus: input.status as Prisma.LessonCommentModerationStatus },
      orderBy: { createdAt: 'asc' },
      skip,
      take: input.pageSize,
    });
    return records.map(mapReply);
  }
}
