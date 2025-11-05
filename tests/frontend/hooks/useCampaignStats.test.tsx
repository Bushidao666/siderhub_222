import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CampaignDetail, HidraDashboardTotals, HidraMessageSummary } from '@shared/types';
import { CampaignChannel, CampaignStatus, UserRole } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { useCampaignStats } from 'src/frontend/hooks/useCampaignStats';
import { useAuthStore } from 'src/frontend/store/auth';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const campaignFactory = (overrides: Partial<CampaignDetail> = {}): CampaignDetail => ({
  id: overrides.id ?? 'campaign-1',
  userId: overrides.userId ?? 'user-1',
  name: overrides.name ?? 'Black Friday',
  description: overrides.description ?? 'Campanha principal',
  channel: overrides.channel ?? CampaignChannel.WhatsApp,
  status: overrides.status ?? CampaignStatus.Running,
  scheduledAt: overrides.scheduledAt ?? null,
  startedAt: overrides.startedAt ?? new Date('2025-11-02T08:30:00Z').toISOString(),
  completedAt: overrides.completedAt ?? null,
  segmentId: overrides.segmentId ?? 'segment-1',
  templateId: overrides.templateId ?? 'template-1',
  externalId: overrides.externalId ?? null,
  maxMessagesPerMinute: overrides.maxMessagesPerMinute ?? 30,
  createdAt: overrides.createdAt ?? new Date('2025-11-01T10:00:00Z').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2025-11-01T10:00:00Z').toISOString(),
  runHistory: overrides.runHistory ?? [],
  metrics:
    overrides.metrics ?? {
      campaignId: overrides.id ?? 'campaign-1',
      totalMessages: 500,
      delivered: 400,
      failed: 50,
      pending: 50,
      averageDeliveryMs: 1500,
      lastUpdatedAt: new Date('2025-11-02T10:00:00Z').toISOString(),
    },
  timeline:
    overrides.timeline ?? [
      { timestamp: new Date('2025-11-02T09:00:00Z').toISOString(), delivered: 100, failed: 10 },
      { timestamp: new Date('2025-11-02T10:00:00Z').toISOString(), delivered: 200, failed: 20 },
    ],
});

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const resetAuth = () => {
  useAuthStore.setState((state) => ({
    ...state,
    user: null,
    accessToken: null,
    refreshToken: null,
    accessMap: [],
    activeSessions: [],
    isAuthenticated: false,
    isLoading: false,
    lastError: null,
  }));
};

const authenticate = () => {
  useAuthStore.setState((state) => ({
    ...state,
    user: {
      id: 'user-1',
      email: 'member@example.com',
      role: UserRole.Member,
      profile: {
        displayName: 'Member',
        avatarUrl: null,
        bio: null,
        timezone: 'UTC',
        badges: [],
        socialLinks: [],
      },
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    accessToken: 'token',
    refreshToken: 'refresh',
    isAuthenticated: true,
  }));
};

beforeEach(() => {
  resetAuth();
  authenticate();
});

afterEach(() => {
  queryClient?.clear();
  resetAuth();
});

describe('useCampaignStats', () => {
  it('aggregates overview metrics and builds timeline totals', async () => {
    const campaigns = [
      campaignFactory({
        id: 'campaign-1',
        metrics: {
          campaignId: 'campaign-1',
          totalMessages: 300,
          delivered: 250,
          failed: 25,
          pending: 25,
          averageDeliveryMs: 1200,
          lastUpdatedAt: new Date('2025-11-02T11:00:00Z').toISOString(),
        },
        timeline: [
          { timestamp: new Date('2025-11-02T09:00:00Z').toISOString(), delivered: 80, failed: 5 },
          { timestamp: new Date('2025-11-02T10:00:00Z').toISOString(), delivered: 120, failed: 10 },
        ],
      }),
      campaignFactory({
        id: 'campaign-2',
        metrics: {
          campaignId: 'campaign-2',
          totalMessages: 200,
          delivered: 150,
          failed: 20,
          pending: 30,
          averageDeliveryMs: 1800,
          lastUpdatedAt: new Date('2025-11-02T12:30:00Z').toISOString(),
        },
        timeline: [
          { timestamp: new Date('2025-11-02T10:00:00Z').toISOString(), delivered: 60, failed: 8 },
          { timestamp: new Date('2025-11-02T11:00:00Z').toISOString(), delivered: 70, failed: 7 },
        ],
      }),
    ];

    const summary: HidraMessageSummary = {
      totalMessages: 500,
      delivered: 400,
      failed: 45,
      pending: 55,
      averageDeliveryMs: 1425,
      lastUpdatedAt: campaigns[1]!.metrics.lastUpdatedAt,
    };

    const totals: HidraDashboardTotals = {
      totalCampaigns: 8,
      running: 2,
      scheduled: 1,
      paused: 1,
      completed: 3,
      failed: 1,
    };

    server.use(
      http.get('/api/hidra/dashboard', () =>
        HttpResponse.json(
          successResponse({
            totals,
            messageSummary: summary,
            recentCampaigns: campaigns,
            config: null,
          }),
        ),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCampaignStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.campaigns).toEqual(campaigns);
    expect(result.current.overview).toEqual(summary);
    expect(result.current.timeline).toEqual([
      { timestamp: new Date('2025-11-02T09:00:00Z').toISOString(), delivered: 80, failed: 5 },
      { timestamp: new Date('2025-11-02T10:00:00Z').toISOString(), delivered: 180, failed: 18 },
      { timestamp: new Date('2025-11-02T11:00:00Z').toISOString(), delivered: 70, failed: 7 },
    ]);
    expect(result.current.totals).toEqual(totals);
  });

  it('exposes error state when dashboard request fails', async () => {
    server.use(
      http.get('/api/hidra/dashboard', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'HIDRA_DASHBOARD_UNAVAILABLE', message: 'Unavailable' },
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        ),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCampaignStats(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.campaigns).toEqual([]);
    expect(result.current.overview).toBeNull();
    expect(result.current.timeline).toEqual([]);
  });
});
