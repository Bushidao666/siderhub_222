import type { PrismaClient, CourseProgress as PrismaCourseProgress } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { CourseProgress } from '@shared/types/academy.types';
import type { CourseProgressRepository, UpsertCourseProgressInput } from './CourseProgressRepository';

function mapPrismaCourseProgress(record: PrismaCourseProgress): CourseProgress {
  return {
    courseId: record.courseId as UUID,
    userId: record.userId as UUID,
    completedLessonIds: (record.completedLessonIds ?? []) as UUID[],
    percentage: Number(record.percentage ?? 0),
    lastLessonId: record.lastLessonId ? (record.lastLessonId as UUID) : null,
    updatedAt: record.updatedAt.toISOString(),
  } satisfies CourseProgress;
}

export class PrismaCourseProgressRepository implements CourseProgressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getByUserAndCourse(userId: UUID, courseId: UUID): Promise<Nullable<CourseProgress>> {
    const record = await this.prisma.courseProgress.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });
    return record ? mapPrismaCourseProgress(record) : null;
  }

  async upsert(input: UpsertCourseProgressInput): Promise<CourseProgress> {
    const record = await this.prisma.courseProgress.upsert({
      where: {
        courseId_userId: {
          courseId: input.courseId,
          userId: input.userId,
        },
      },
      create: {
        courseId: input.courseId,
        userId: input.userId,
        completedLessonIds: input.completedLessonIds,
        percentage: input.percentage,
        lastLessonId: input.lastLessonId,
      },
      update: {
        completedLessonIds: input.completedLessonIds,
        percentage: input.percentage,
        lastLessonId: input.lastLessonId,
      },
    });

    return mapPrismaCourseProgress(record);
  }
}
