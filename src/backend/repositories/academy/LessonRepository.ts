import type { Nullable, UUID } from '@shared/types';
import type { Lesson } from '@shared/types/academy.types';

export interface LessonWithCourse extends Lesson {
  courseId: UUID;
  isCommentingEnabled: boolean;
  isCommentingModerated: boolean;
  courseReleaseDate: Nullable<string>;
  moduleDripReleaseAt: Nullable<string>;
  moduleDripDaysAfter: Nullable<number>;
  moduleDripAfterModuleId: Nullable<UUID>;
}

export interface LessonRepository {
  findById(lessonId: UUID): Promise<Nullable<LessonWithCourse>>;
}
