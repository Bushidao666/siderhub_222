import type { UUID } from '@shared/types';
import type { CourseRecommendation } from '@shared/types/academy.types';

export interface CourseRecommendationRepository {
  listForUser(userId: UUID, limit?: number): Promise<CourseRecommendation[]>;
  listGlobal(limit?: number): Promise<CourseRecommendation[]>;
}
