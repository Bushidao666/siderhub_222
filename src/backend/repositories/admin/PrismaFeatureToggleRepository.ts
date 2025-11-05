import type { PrismaClient } from '@prisma/client';
import type { FeatureToggle } from '@shared/types/admin.types';
import type { UUID } from '@shared/types';
import type { FeatureToggleRepository } from './FeatureToggleRepository';

function mapPrismaFeatureToggle(record: {
  id: string;
  featureKey: string;
  description: string;
  status: string;
  rolloutPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}): FeatureToggle {
  return {
    id: record.id as UUID,
    featureKey: record.featureKey,
    description: record.description,
    status: record.status as FeatureToggle['status'],
    rolloutPercentage: record.rolloutPercentage,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  } satisfies FeatureToggle;
}

export class PrismaFeatureToggleRepository implements FeatureToggleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<FeatureToggle[]> {
    const toggles = await this.prisma.featureToggle.findMany({ orderBy: { featureKey: 'asc' } });
    return toggles.map(mapPrismaFeatureToggle);
  }

  async updateStatus(id: UUID, status: FeatureToggle['status'], rolloutPercentage?: number): Promise<FeatureToggle> {
    const toggle = await this.prisma.featureToggle.update({
      where: { id },
      data: {
        status,
        rolloutPercentage: rolloutPercentage ?? null,
      },
    });
    return mapPrismaFeatureToggle(toggle);
  }
}
