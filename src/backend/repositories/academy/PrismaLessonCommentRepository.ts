import type { LessonComment, LessonCommentModerationStatus } from '@shared/types/academy.types';
import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateLessonCommentInput,
  LessonCommentRepository,
  ListLessonCommentsInput,
  ListPendingLessonCommentsInput,
  UpdateLessonCommentModerationInput,
} from './LessonCommentRepository';

type PrismaLessonComment = Prisma.LessonCommentGetPayload<Record<string, never>>;

function mapPrismaComment(comment: PrismaLessonComment): LessonComment {
  return {
    id: comment.id,
    lessonId: comment.lessonId,
    userId: comment.userId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    pendingModeration: comment.pendingModeration,
    moderationStatus: comment.moderationStatus as LessonCommentModerationStatus,
    moderatedById: comment.moderatedById,
    moderatedAt: comment.moderatedAt?.toISOString() ?? null,
    replies: [],
  } satisfies LessonComment;
}

export class PrismaLessonCommentRepository implements LessonCommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateLessonCommentInput): Promise<LessonComment> {
    const comment = await this.prisma.lessonComment.create({
      data: {
        lessonId: input.lessonId,
        userId: input.userId,
        body: input.body,
        pendingModeration: input.pendingModeration,
        moderationStatus: input.moderationStatus,
      },
    });

    return mapPrismaComment(comment);
  }

  async listByLesson(input: ListLessonCommentsInput): Promise<LessonComment[]> {
    const { lessonId, page, pageSize, after } = input;
    const baseQuery = {
      where: { lessonId },
      orderBy: { createdAt: 'desc' as const },
      take: pageSize,
    };

    let comments;
    if (after) {
      comments = await this.prisma.lessonComment.findMany({
        ...baseQuery,
        cursor: { id: after },
        skip: 1,
      });
    } else {
      const skip = (page - 1) * pageSize;
      comments = await this.prisma.lessonComment.findMany({
        ...baseQuery,
        skip,
      });
    }

    return comments.map(mapPrismaComment);
  }

  async listPending(input: ListPendingLessonCommentsInput): Promise<LessonComment[]> {
    const status = (input.status ?? 'pending') as Prisma.LessonCommentModerationStatus;
    const skip = (input.page - 1) * input.pageSize;
    const records = await this.prisma.lessonComment.findMany({
      where: { moderationStatus: status },
      orderBy: { createdAt: 'asc' },
      skip,
      take: input.pageSize,
    });
    return records.map(mapPrismaComment);
  }

  async findById(commentId: string): Promise<LessonComment | null> {
    const record = await this.prisma.lessonComment.findUnique({ where: { id: commentId } });
    return record ? mapPrismaComment(record) : null;
  }

  async updateModeration(input: UpdateLessonCommentModerationInput): Promise<LessonComment> {
    const record = await this.prisma.lessonComment.update({
      where: { id: input.commentId },
      data: {
        moderationStatus: input.status,
        pendingModeration: input.status === 'pending',
        moderatedById: input.status === 'pending' ? null : input.moderatorId,
        moderatedAt: input.status === 'pending' ? null : new Date(input.moderatedAt),
      },
    });
    return mapPrismaComment(record);
  }
}
