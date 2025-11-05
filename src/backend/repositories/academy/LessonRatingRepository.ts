import type { Nullable, UUID } from '@shared/types';
import type { LessonRating, LessonRatingSummary } from '@shared/types/academy.types';

export interface UpsertLessonRatingInput {
  lessonId: UUID;
  userId: UUID;
  value: number;
  createdAt?: string;
}

export interface LessonRatingRepository {
  upsert(input: UpsertLessonRatingInput): Promise<LessonRating>;
  findByUserAndLesson(userId: UUID, lessonId: UUID): Promise<Nullable<LessonRating>>;
  getSummary(lessonId: UUID): Promise<LessonRatingSummary>;
  delete(userId: UUID, lessonId: UUID): Promise<void>;
}
