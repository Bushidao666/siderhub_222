import type { PrismaClient } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type {
  CampaignDashboardSnapshot,
  CampaignDetail,
  Campaign,
  CampaignMetrics,
} from '@shared/types/hidra.types';
import { CampaignStatus, CampaignChannel } from '@shared/types/common.types';
import type {
  CampaignRepository,
  CreateCampaignInput,
} from './CampaignRepository';
import { mapCampaign, mapCampaignDetail, mapCampaignMetrics } from './mappers';

const RECENT_LIMIT = 5;

function resolveInitialStatus(input: CreateCampaignInput): CampaignStatus {
  if (input.scheduledFor) {
    return CampaignStatus.Scheduled;
  }
  return CampaignStatus.Draft;
}

export class PrismaCampaignRepository implements CampaignRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateCampaignInput): Promise<Campaign> {
    const record = await this.prisma.campaign.create({
      data: {
        userId: input.ownerId,
        name: input.name,
        description: input.description,
        channel: input.channel as CampaignChannel,
        status: resolveInitialStatus(input),
        scheduledAt: input.scheduledFor ? new Date(input.scheduledFor) : null,
        segmentId: input.segmentId,
        templateId: input.messageTemplateId,
        externalId: input.externalId ?? null,
        maxMessagesPerMinute: input.maxMessagesPerMinute,
      },
    });

    return mapCampaign(record);
  }

  async findByExternalId(externalId: string): Promise<Nullable<Campaign>> {
    const record = await this.prisma.campaign.findUnique({ where: { externalId } });
    return record ? mapCampaign(record) : null;
  }

  async findById(id: UUID): Promise<Nullable<CampaignDetail>> {
    const record = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        runs: { orderBy: { startedAt: 'desc' } },
        metrics: true,
        timeline: { orderBy: { timestamp: 'asc' } },
      },
    });

    return record ? mapCampaignDetail(record) : null;
  }

  async findDetailWithExternalId(id: UUID): Promise<Nullable<CampaignDetail & { externalId: Nullable<string> }>> {
    const record = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        runs: { orderBy: { startedAt: 'desc' } },
        metrics: true,
        timeline: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!record) {
      return null;
    }

    return {
      ...mapCampaignDetail(record),
      externalId: record.externalId ?? null,
    } satisfies CampaignDetail & { externalId: Nullable<string> };
  }

  async updateStatus(id: UUID, status: Campaign['status']): Promise<void> {
    await this.prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  async updateMetrics(id: UUID, metrics: CampaignMetrics): Promise<void> {
    await this.prisma.campaignMetrics.upsert({
      where: { campaignId: id },
      create: {
        campaignId: id,
        totalMessages: metrics.totalMessages,
        delivered: metrics.delivered,
        failed: metrics.failed,
        pending: metrics.pending,
        averageDeliveryMs: metrics.averageDeliveryMs,
      },
      update: {
        totalMessages: metrics.totalMessages,
        delivered: metrics.delivered,
        failed: metrics.failed,
        pending: metrics.pending,
        averageDeliveryMs: metrics.averageDeliveryMs,
      },
    });
  }

  async getDashboardSnapshot(ownerId: UUID): Promise<CampaignDashboardSnapshot> {
    const [grouped, metricAggregate, recentCampaigns] = await Promise.all([
      this.prisma.campaign.groupBy({
        where: { userId: ownerId },
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.campaignMetrics.aggregate({
        where: { campaign: { userId: ownerId } },
        _sum: {
          totalMessages: true,
          delivered: true,
          failed: true,
          pending: true,
        },
        _avg: {
          averageDeliveryMs: true,
        },
        _max: {
          lastUpdatedAt: true,
        },
      }),
      this.prisma.campaign.findMany({
        where: { userId: ownerId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        include: {
          runs: { orderBy: { startedAt: 'desc' } },
          metrics: true,
          timeline: { orderBy: { timestamp: 'asc' } },
        },
      }),
    ]);

    const totals = grouped.reduce(
      (acc, item) => {
        const count = item._count._all ?? 0;
        acc.totalCampaigns += count;
        switch (item.status) {
          case CampaignStatus.Running:
            acc.running += count;
            break;
          case CampaignStatus.Scheduled:
            acc.scheduled += count;
            break;
          case CampaignStatus.Paused:
            acc.paused += count;
            break;
          case CampaignStatus.Completed:
            acc.completed += count;
            break;
          case CampaignStatus.Failed:
            acc.failed += count;
            break;
          default:
            break;
        }
        return acc;
      },
      {
        totalCampaigns: 0,
        running: 0,
        scheduled: 0,
        paused: 0,
        completed: 0,
        failed: 0,
      },
    );

    const messageSummary = {
      totalMessages: Number(metricAggregate._sum?.totalMessages ?? 0),
      delivered: Number(metricAggregate._sum?.delivered ?? 0),
      failed: Number(metricAggregate._sum?.failed ?? 0),
      pending: Number(metricAggregate._sum?.pending ?? 0),
      averageDeliveryMs: Number(metricAggregate._avg?.averageDeliveryMs ?? 0),
      lastUpdatedAt: metricAggregate._max?.lastUpdatedAt?.toISOString() ?? null,
    } satisfies CampaignDashboardSnapshot['messageSummary'];

    const recentDetails = recentCampaigns.map((campaign) => mapCampaignDetail(campaign));

    return {
      totals,
      messageSummary,
      recentCampaigns: recentDetails,
    } satisfies CampaignDashboardSnapshot;
  }
}
