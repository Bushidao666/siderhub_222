import type { Nullable, UUID } from '@shared/types';
import type { CourseProgress } from '@shared/types/academy.types';

export interface UpsertCourseProgressInput {
  userId: UUID;
  courseId: UUID;
  completedLessonIds: UUID[];
  percentage: number;
  lastLessonId: Nullable<UUID>;
  updatedAt: string;
}

export interface CourseProgressRepository {
  getByUserAndCourse(userId: UUID, courseId: UUID): Promise<Nullable<CourseProgress>>;
  upsert(input: UpsertCourseProgressInput): Promise<CourseProgress>;
}
