import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CampaignDetail,
  CampaignMetrics,
  CampaignTimelinePoint,
  HidraDashboardSummary,
  HidraDashboardTotals,
  HidraMessageSummary,
} from '../../shared/types';
import { fetchHidraDashboard } from './useHidraDashboard';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

export type CampaignOverview = Omit<CampaignMetrics, 'campaignId'>;

const buildOverviewFromCampaigns = (campaigns: CampaignDetail[]): CampaignOverview => {
  if (!campaigns.length) {
    const now = new Date().toISOString();
    return {
      totalMessages: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      averageDeliveryMs: 0,
      lastUpdatedAt: now,
    };
  }

  let totalMessages = 0;
  let delivered = 0;
  let failed = 0;
  let pending = 0;
  let weightedDeliverySum = 0;
  let totalDeliveredForAverage = 0;
  let lastUpdatedAt = campaigns[0]?.metrics.lastUpdatedAt ?? new Date().toISOString();

  campaigns.forEach(({ metrics }) => {
    totalMessages += metrics.totalMessages;
    delivered += metrics.delivered;
    failed += metrics.failed;
    pending += metrics.pending;
    weightedDeliverySum += metrics.averageDeliveryMs * metrics.delivered;
    totalDeliveredForAverage += metrics.delivered;
    if (metrics.lastUpdatedAt > lastUpdatedAt) {
      lastUpdatedAt = metrics.lastUpdatedAt;
    }
  });

  const averageDeliveryMs = totalDeliveredForAverage
    ? Math.round(weightedDeliverySum / totalDeliveredForAverage)
    : 0;

  return {
    totalMessages,
    delivered,
    failed,
    pending,
    averageDeliveryMs,
    lastUpdatedAt,
  };
};

const aggregateTimeline = (campaigns: CampaignDetail[]): CampaignTimelinePoint[] => {
  const timelineAccumulator = new Map<string, { delivered: number; failed: number }>();

  campaigns.forEach((campaign) => {
    campaign.timeline.forEach((point) => {
      const current = timelineAccumulator.get(point.timestamp) ?? { delivered: 0, failed: 0 };
      current.delivered += point.delivered;
      current.failed += point.failed;
      timelineAccumulator.set(point.timestamp, current);
    });
  });

  return Array.from(timelineAccumulator.entries())
    .map(([timestamp, value]) => ({
      timestamp,
      delivered: value.delivered,
      failed: value.failed,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

interface CampaignStatsState {
  campaigns: CampaignDetail[];
  overview: CampaignOverview | null;
  timeline: CampaignTimelinePoint[];
  totals: HidraDashboardTotals | null;
}

const buildCampaignStatsState = (
  dashboard: HidraDashboardSummary,
): CampaignStatsState => {
  const campaigns = dashboard.recentCampaigns ?? [];
  return {
    campaigns,
    overview: normalizeOverview(dashboard.messageSummary, campaigns),
    timeline: campaigns.length ? aggregateTimeline(campaigns) : [],
    totals: dashboard.totals ?? null,
  } satisfies CampaignStatsState;
};

export const useCampaignStats = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: queryKeys.hidra.campaignStats(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const dashboard = await queryClient.ensureQueryData({
        queryKey: queryKeys.hidra.dashboard(),
        queryFn: fetchHidraDashboard,
      });

      return buildCampaignStatsState(dashboard);
    },
    initialData: () => {
      const cachedDashboard = queryClient.getQueryData<HidraDashboardSummary>(queryKeys.hidra.dashboard());
      return cachedDashboard ? buildCampaignStatsState(cachedDashboard) : undefined;
    },
  });

  const campaigns = statsQuery.data?.campaigns ?? [];
  const overview = useMemo(() => statsQuery.data?.overview ?? null, [statsQuery.data?.overview]);
  const timeline = useMemo(
    () => statsQuery.data?.timeline ?? [],
    [statsQuery.data?.timeline]
  );

  return {
    ...statsQuery,
    campaigns,
    overview,
    timeline,
    totals: statsQuery.data?.totals ?? null,
  };
};

const normalizeOverview = (
  summary: HidraMessageSummary | null | undefined,
  campaigns: CampaignDetail[],
): CampaignOverview => {
  if (summary) {
    return {
      totalMessages: summary.totalMessages,
      delivered: summary.delivered,
      failed: summary.failed,
      pending: summary.pending,
      averageDeliveryMs: summary.averageDeliveryMs,
      lastUpdatedAt: summary.lastUpdatedAt ?? new Date().toISOString(),
    };
  }

  return buildOverviewFromCampaigns(campaigns);
};
