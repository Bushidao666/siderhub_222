import type { PrismaClient } from '@prisma/client';
import type { MemberAccessOverride } from '@shared/types/admin.types';
import type { UUID } from '@shared/types';
import type { MemberAccessOverrideRepository, SetAccessOverrideInput } from './MemberAccessOverrideRepository';

function mapPrismaOverride(record: {
  id: string;
  userId: string;
  feature: string;
  enabled: boolean;
  permissions: string[];
  reason: string;
  grantedById: string;
  grantedAt: Date;
}): MemberAccessOverride {
  return {
    id: record.id as UUID,
    userId: record.userId as UUID,
    feature: record.feature,
    enabled: record.enabled,
    permissions: record.permissions ?? [],
    reason: record.reason,
    grantedBy: record.grantedById as UUID,
    grantedAt: record.grantedAt.toISOString(),
  } satisfies MemberAccessOverride;
}

export class PrismaMemberAccessOverrideRepository implements MemberAccessOverrideRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async setOverride(input: SetAccessOverrideInput): Promise<MemberAccessOverride> {
    const record = await this.prisma.memberAccessOverride.upsert({
      where: {
        userId_feature: {
          userId: input.userId,
          feature: input.feature,
        },
      },
      update: {
        enabled: input.enabled,
        permissions: input.permissions,
        reason: input.reason ?? '',
        grantedById: input.grantedBy,
      },
      create: {
        userId: input.userId,
        feature: input.feature,
        enabled: input.enabled,
        permissions: input.permissions,
        reason: input.reason ?? '',
        grantedById: input.grantedBy,
      },
    });
    return mapPrismaOverride(record);
  }

  async removeOverride(userId: UUID, feature: string): Promise<void> {
    await this.prisma.memberAccessOverride.delete({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
    });
  }
}
