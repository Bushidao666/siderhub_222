import { z } from 'zod';
import type {
  Prisma,
  Course as PrismaCourse,
  CourseModule as PrismaCourseModule,
  Lesson as PrismaLesson,
} from '@prisma/client';
import type {
  CourseMeta,
  CourseModule,
  CourseTree,
  Lesson,
} from '@shared/types/academy.types';
import type { UUID } from '@shared/types';
import { LessonType, Visibility, CourseStatus } from '@shared/types/common.types';

const lessonVideoSchema = z.object({
  videoUrl: z.string().min(1),
  durationSeconds: z.number().int().nonnegative(),
  captionsUrl: z.string().nullable(),
  transcript: z.string().nullable(),
});

const lessonDownloadableSchema = z.array(
  z.object({
    id: z.string().optional(),
    fileUrl: z.string().min(1),
    fileName: z.string().min(1),
    fileSizeBytes: z.number().int().nonnegative(),
  }),
);

const lessonQuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(1),
  correctIndex: z.number().int().min(0),
});

const lessonContentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(LessonType.Video), video: lessonVideoSchema }),
  z.object({ type: z.literal(LessonType.Article), bodyMarkdown: z.string().min(1) }),
  z.object({ type: z.literal(LessonType.Live), scheduledAt: z.string().min(1), meetingUrl: z.string().min(1) }),
  z.object({ type: z.literal(LessonType.Download), assets: lessonDownloadableSchema }),
  z.object({ type: z.literal(LessonType.Quiz), questions: z.array(lessonQuizQuestionSchema).min(1) }),
]);

function parseJsonContent(content: Prisma.JsonValue): Lesson['content'] {
  return lessonContentSchema.parse(content);
}

export function mapPrismaLesson(lesson: PrismaLesson): Lesson {
  return {
    id: lesson.id as UUID,
    moduleId: lesson.moduleId as UUID,
    order: lesson.order,
    title: lesson.title,
    summary: lesson.summary,
    type: lesson.type as LessonType,
    content: parseJsonContent(lesson.content),
    durationMinutes: lesson.durationMinutes,
    isPreview: lesson.isPreview,
    releaseAt: lesson.releaseAt ? lesson.releaseAt.toISOString() : null,
  } satisfies Lesson;
}

export function mapPrismaModule(module: PrismaCourseModule & { lessons: PrismaLesson[] }): CourseModule {
  return {
    id: module.id as UUID,
    courseId: module.courseId as UUID,
    order: module.order,
    title: module.title,
    description: module.description,
    durationMinutes: module.durationMinutes,
    dripReleaseAt: module.dripReleaseAt ? module.dripReleaseAt.toISOString() : null,
    dripDaysAfter: module.dripDaysAfter,
    dripAfterModuleId: module.dripAfterModuleId ? (module.dripAfterModuleId as UUID) : null,
    lessons: module.lessons.map(mapPrismaLesson),
  } satisfies CourseModule;
}

export function mapPrismaCourseMeta(course: PrismaCourse): CourseMeta {
  return {
    id: course.id as UUID,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    coverImage: course.coverImage ?? null,
    level: course.level,
    status: course.status as CourseStatus,
    visibility: course.visibility as Visibility,
    estimatedDurationMinutes: course.estimatedDurationMinutes,
    totalLessons: course.totalLessons,
    tags: course.tags ?? [],
    releaseDate: course.releaseDate ? course.releaseDate.toISOString() : null,
    isFeatured: course.isFeatured,
    recommendationScore: Number(course.recommendationScore ?? 0),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  } satisfies CourseMeta;
}

export function mapPrismaCourseTree(
  course: PrismaCourse & {
    modules: (PrismaCourseModule & { lessons: PrismaLesson[] })[];
  },
): CourseTree {
  return {
    ...mapPrismaCourseMeta(course),
    modules: course.modules.map(mapPrismaModule),
  } satisfies CourseTree;
}
