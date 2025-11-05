import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { HidraDashboardSummary } from '@shared/types/hidra.types';
import type { ApiResponse } from '@shared/types/api.types';
import { CampaignChannel, CampaignStatus } from '@shared/types/common.types';
import { HidraDashboard } from 'src/frontend/pages/Hidra/Dashboard';
import { renderWithProviders, resetAuthStore, setAuthenticatedUser } from '../test-utils';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const DASHBOARD_SUMMARY: HidraDashboardSummary = {
  config: null,
  totals: {
    totalCampaigns: 3,
    running: 1,
    scheduled: 1,
    paused: 0,
    completed: 1,
    failed: 0,
  },
  messageSummary: {
    totalMessages: 420,
    delivered: 390,
    failed: 15,
    pending: 15,
    averageDeliveryMs: 980,
    lastUpdatedAt: '2025-11-03T09:10:00Z',
  },
  recentCampaigns: [
    {
      id: 'campaign-1',
      userId: 'user-1',
      name: 'Campanha Neon',
      description: 'Lançamento neon',
      channel: CampaignChannel.WhatsApp,
      status: CampaignStatus.Scheduled,
      scheduledAt: '2025-11-04T12:00:00Z',
      startedAt: null,
      completedAt: null,
      segmentId: 'segment-1',
      templateId: 'template-1',
      externalId: null,
      maxMessagesPerMinute: 90,
      createdAt: '2025-11-02T12:00:00Z',
      updatedAt: '2025-11-02T12:00:00Z',
      runHistory: [],
      metrics: {
        campaignId: 'campaign-1',
        totalMessages: 200,
        delivered: 180,
        failed: 10,
        pending: 10,
        averageDeliveryMs: 950,
        lastUpdatedAt: '2025-11-02T18:00:00Z',
      },
      timeline: [
        { timestamp: '2025-11-02T17:00:00Z', delivered: 90, failed: 5 },
        { timestamp: '2025-11-02T18:00:00Z', delivered: 90, failed: 5 },
      ],
    },
  ],
};

describe('HidraDashboard page', () => {
  beforeEach(() => {
    resetAuthStore();
    setAuthenticatedUser();
  });

  it('renders metrics and campaign rows when API succeeds', async () => {
    server.use(
      http.get('/api/hidra/dashboard', () => HttpResponse.json(successResponse(DASHBOARD_SUMMARY))),
    );

    renderWithProviders(<HidraDashboard />);

    expect(await screen.findByText('Hidra automations')).toBeInTheDocument();
    expect(await screen.findByText('Total')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
    expect(screen.getByTestId('hidra-campaign-row-campanha-neon')).toBeInTheDocument();
  });

  it('surfaces service errors with mapped message', async () => {
    server.use(
      http.get('/api/hidra/dashboard', () =>
        HttpResponse.json({
          success: false,
          error: { code: 'HIDRA_DASHBOARD_UNAVAILABLE', message: 'Dashboard indisponível' },
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    renderWithProviders(<HidraDashboard />);

    expect(await screen.findByText('Dashboard indisponível')).toBeInTheDocument();
  });
});
