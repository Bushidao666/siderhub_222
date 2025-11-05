import type { PrismaClient } from '@prisma/client';
import type { UUID } from '@shared/types';
import type { CourseRecommendation } from '@shared/types/academy.types';
import type { CourseRecommendationRepository } from './CourseRecommendationRepository';

function mapPrismaRecommendation(record: { courseId: string; reason: string; badge: string | null }): CourseRecommendation {
  return {
    courseId: record.courseId as UUID,
    reason: record.reason,
    badge: record.badge as CourseRecommendation['badge'] | undefined,
  } satisfies CourseRecommendation;
}

export class PrismaCourseRecommendationRepository implements CourseRecommendationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForUser(userId: UUID, limit = 6): Promise<CourseRecommendation[]> {
    // Personalized recommendations not yet modelled; fall back to global set.
    const recommendations = await this.listGlobal(limit);
    if (recommendations.length === 0) {
      return [];
    }
    return recommendations.map((recommendation) => ({ ...recommendation }));
  }

  async listGlobal(limit = 6): Promise<CourseRecommendation[]> {
    const records = await this.prisma.courseRecommendation.findMany({
      orderBy: [{ badge: 'asc' }, { reason: 'asc' }],
      take: limit,
    });
    return records.map(mapPrismaRecommendation);
  }
}
