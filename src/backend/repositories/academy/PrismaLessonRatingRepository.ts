import type { PrismaClient } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { LessonRating, LessonRatingSummary } from '@shared/types/academy.types';
import type { LessonRatingRepository, UpsertLessonRatingInput } from './LessonRatingRepository';

function mapPrismaRating(record: { id: string; lessonId: string; userId: string; value: number; createdAt: Date }): LessonRating {
  return {
    id: record.id,
    lessonId: record.lessonId as UUID,
    userId: record.userId as UUID,
    value: record.value as LessonRating['value'],
    createdAt: record.createdAt.toISOString(),
  } satisfies LessonRating;
}

export class PrismaLessonRatingRepository implements LessonRatingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(input: UpsertLessonRatingInput): Promise<LessonRating> {
    const record = await this.prisma.lessonRating.upsert({
      where: {
        userId_lessonId: {
          lessonId: input.lessonId,
          userId: input.userId,
        },
      },
      create: {
        lessonId: input.lessonId,
        userId: input.userId,
        value: input.value,
        createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
      },
      update: {
        value: input.value,
      },
    });
    return mapPrismaRating(record);
  }

  async findByUserAndLesson(userId: UUID, lessonId: UUID): Promise<Nullable<LessonRating>> {
    const record = await this.prisma.lessonRating.findUnique({
      where: {
        userId_lessonId: {
          lessonId,
          userId,
        },
      },
    });
    return record ? mapPrismaRating(record) : null;
  }

  async getSummary(lessonId: UUID): Promise<LessonRatingSummary> {
    const [aggregate, totalRatings] = await Promise.all([
      this.prisma.lessonRating.aggregate({
        where: { lessonId },
        _avg: { value: true },
      }),
      this.prisma.lessonRating.count({ where: { lessonId } }),
    ]);

    return {
      lessonId,
      average: Number(aggregate._avg.value ?? 0),
      totalRatings,
    } satisfies LessonRatingSummary;
  }

  async delete(userId: UUID, lessonId: UUID): Promise<void> {
    await this.prisma.lessonRating.deleteMany({
      where: {
        lessonId,
        userId,
      },
    });
  }
}
