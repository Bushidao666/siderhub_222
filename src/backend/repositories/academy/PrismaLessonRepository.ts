import type { PrismaClient } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { LessonRepository, LessonWithCourse } from './LessonRepository';
import { mapPrismaLesson } from './mappers';

export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(lessonId: UUID): Promise<Nullable<LessonWithCourse>> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: { releaseDate: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return null;
    }

    const mappedLesson = mapPrismaLesson(lesson);
    const module = lesson.module;

    return {
      ...mappedLesson,
      courseId: module.courseId as UUID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
      courseReleaseDate: module.course?.releaseDate ? module.course.releaseDate.toISOString() : null,
      moduleDripReleaseAt: module.dripReleaseAt ? module.dripReleaseAt.toISOString() : null,
      moduleDripDaysAfter: module.dripDaysAfter,
      moduleDripAfterModuleId: module.dripAfterModuleId ? (module.dripAfterModuleId as UUID) : null,
    } satisfies LessonWithCourse;
  }
}
