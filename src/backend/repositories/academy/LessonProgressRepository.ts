import type { Nullable, UUID } from '@shared/types';
import type { LessonProgressAggregate } from '@shared/types/academy.types';

export interface RecordLessonProgressInput {
  lessonId: UUID;
  userId: UUID;
  positionSeconds: number;
  occurredAt: string;
  percentage: number;
}

export interface LessonProgressRepository {
  recordTick(input: RecordLessonProgressInput): Promise<LessonProgressAggregate>;
  getAggregate(lessonId: UUID, userId: UUID): Promise<Nullable<LessonProgressAggregate>>;
}
