import type { PrismaClient } from '@prisma/client';
import type { UUID } from '@shared/types';
import { CampaignStatus } from '@shared/types/common.types';
import type { CampaignRun } from '@shared/types/hidra.types';
import type { CampaignRunRepository, CreateCampaignRunInput } from './CampaignRunRepository';
import { mapCampaignRun } from './mappers';

export class PrismaCampaignRunRepository implements CampaignRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateCampaignRunInput): Promise<CampaignRun> {
    const record = await this.prisma.campaignRun.create({
      data: {
        campaignId: input.campaignId,
        initiatedBy: input.startedById,
        startedAt: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
        status: CampaignStatus.Scheduled,
        summary: null,
      },
    });

    return mapCampaignRun(record);
  }

  async recordCompletion(runId: UUID, result: { delivered: number; failed: number; completedAt: string }): Promise<void> {
    await this.prisma.campaignRun.update({
      where: { id: runId },
      data: {
        status: CampaignStatus.Completed,
        endedAt: new Date(result.completedAt),
        summary: `delivered=${result.delivered};failed=${result.failed}`,
      },
    });
  }
}
