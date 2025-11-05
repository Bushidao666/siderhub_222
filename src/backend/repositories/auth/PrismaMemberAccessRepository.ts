import type { PrismaClient, FeatureAccessKey as PrismaFeatureAccessKey } from '@prisma/client';
import type { FeatureAccessKey, MemberAccessMap, UUID } from '@shared/types';
import type { MemberAccessRepository } from './MemberAccessRepository';

export class PrismaMemberAccessRepository implements MemberAccessRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAccessMapByUser(userId: UUID): Promise<MemberAccessMap[]> {
    const rows = await this.prisma.memberAccess.findMany({ where: { userId } });
    return rows.map((r) => ({
      feature: r.feature as unknown as FeatureAccessKey,
      enabled: r.enabled,
      permissions: r.permissions ?? [],
    }));
  }

  async replaceAccessMap(userId: UUID, accessMap: MemberAccessMap[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.memberAccess.deleteMany({ where: { userId } }),
      this.prisma.memberAccess.createMany({
        data: accessMap.map((m) => ({
          userId,
          feature: m.feature as unknown as PrismaFeatureAccessKey,
          enabled: m.enabled,
          permissions: m.permissions,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  async enableFeature(userId: UUID, feature: FeatureAccessKey, permissions: string[]): Promise<void> {
    await this.prisma.memberAccess.upsert({
      where: { userId_feature: { userId, feature: feature as unknown as PrismaFeatureAccessKey } },
      update: { enabled: true, permissions },
      create: { userId, feature: feature as unknown as PrismaFeatureAccessKey, enabled: true, permissions },
    });
  }
}

