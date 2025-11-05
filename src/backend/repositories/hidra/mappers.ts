import type {
  Campaign as PrismaCampaign,
  CampaignMetrics as PrismaCampaignMetrics,
  CampaignRun as PrismaCampaignRun,
  CampaignTimelinePoint as PrismaCampaignTimelinePoint,
} from '@prisma/client';
import type {
  Campaign,
  CampaignDetail,
  CampaignMetrics,
  CampaignRun,
  CampaignTimelinePoint,
} from '@shared/types/hidra.types';
import type { UUID } from '@shared/types';
import { CampaignStatus, CampaignChannel } from '@shared/types/common.types';

export function mapCampaign(record: PrismaCampaign): Campaign {
  return {
    id: record.id as UUID,
    userId: record.userId as UUID,
    name: record.name,
    description: record.description,
    channel: record.channel as CampaignChannel,
    status: record.status as CampaignStatus,
    scheduledAt: record.scheduledAt ? record.scheduledAt.toISOString() : null,
    startedAt: record.startedAt ? record.startedAt.toISOString() : null,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    segmentId: record.segmentId as UUID,
    templateId: record.templateId as UUID,
    externalId: record.externalId ?? null,
    maxMessagesPerMinute: record.maxMessagesPerMinute,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  } satisfies Campaign;
}

export function mapCampaignMetrics(record: PrismaCampaignMetrics | null | undefined, fallbackCampaignId: UUID): CampaignMetrics {
  if (!record) {
    return {
      campaignId: fallbackCampaignId,
      totalMessages: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      averageDeliveryMs: 0,
      lastUpdatedAt: new Date(0).toISOString(),
    } satisfies CampaignMetrics;
  }

  return {
    campaignId: record.campaignId as UUID,
    totalMessages: record.totalMessages,
    delivered: record.delivered,
    failed: record.failed,
    pending: record.pending,
    averageDeliveryMs: record.averageDeliveryMs,
    lastUpdatedAt: record.lastUpdatedAt.toISOString(),
  } satisfies CampaignMetrics;
}

export function mapCampaignRun(record: PrismaCampaignRun): CampaignRun {
  return {
    id: record.id as UUID,
    campaignId: record.campaignId as UUID,
    initiatedBy: record.initiatedBy as UUID,
    startedAt: record.startedAt.toISOString(),
    endedAt: record.endedAt ? record.endedAt.toISOString() : null,
    status: record.status as CampaignStatus,
    summary: record.summary ?? null,
  } satisfies CampaignRun;
}

export function mapTimelinePoint(record: PrismaCampaignTimelinePoint): CampaignTimelinePoint {
  return {
    timestamp: record.timestamp.toISOString(),
    delivered: record.delivered,
    failed: record.failed,
  } satisfies CampaignTimelinePoint;
}

export function mapCampaignDetail(
  record: PrismaCampaign & {
    runs: PrismaCampaignRun[];
    metrics?: PrismaCampaignMetrics | null;
    timeline: PrismaCampaignTimelinePoint[];
  },
): CampaignDetail {
  return {
    ...mapCampaign(record),
    runHistory: record.runs.map(mapCampaignRun),
    metrics: mapCampaignMetrics(record.metrics, record.id as UUID),
    timeline: record.timeline.map(mapTimelinePoint),
  } satisfies CampaignDetail;
}
