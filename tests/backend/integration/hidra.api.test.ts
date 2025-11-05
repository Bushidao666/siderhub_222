import request from 'supertest';
import type { Express } from 'express';

import type { ApiServices } from 'src/backend/api/types';
import { buildTestApp } from '../setup/supertest-app';
import { UserRole } from '@shared/types/common.types';
import type { HidraDashboardSummary } from '@shared/types/hidra.types';
import { AppError } from 'src/backend/errors/AppError';

const AUTH_HEADER = { Authorization: 'Bearer token' } as const;

function makeApp(overrides: Partial<ApiServices> = {}) {
  const tokenService = overrides.tokenService ?? {
    verifyAccessToken: () => ({ userId: 'user-42', sessionId: 'session-1', role: UserRole.Member }),
    generateAccessToken: () => 'access-token',
    generateRefreshToken: () => 'refresh-token',
    verifyRefreshToken: () => ({ userId: 'user-42', sessionId: 'session-1', role: UserRole.Member }),
  };

  const defaultHidraService = {
    createCampaign: jest.fn(),
    getDashboardSummary: jest.fn(),
  };
  const hidraService = overrides.hidraService
    ? { ...defaultHidraService, ...overrides.hidraService }
    : defaultHidraService;

  const services: ApiServices = {
    authService: overrides.authService ?? ({} as any),
    tokenService: tokenService as ApiServices['tokenService'],
    academyService: overrides.academyService ?? ({} as any),
    hidraService: hidraService as any,
    cybervaultService: overrides.cybervaultService ?? ({} as any),
    adminService: overrides.adminService ?? ({} as any),
    hubService:
      overrides.hubService ??
      ({
        getOverview: async () => ({
          banners: [],
          academy: { featured: [], recommendations: [] },
          hidra: null,
          cybervault: { featuredResources: [] },
          generatedAt: new Date().toISOString(),
        }),
        getActiveBanners: async () => [],
      } as any),
  };

  const app = buildTestApp(services);
  return { app, services } as { app: Express; services: ApiServices };
}

describe('Hidra API integration', () => {
  it('creates a campaign with authenticated member context', async () => {
    const { app, services } = makeApp();

    (services.hidraService.createCampaign as jest.Mock).mockResolvedValue({
      id: 'campaign-1',
      name: 'Neon Launch',
      status: 'draft',
      userId: 'user-42',
    });

    const res = await request(app)
      .post('/api/hidra/campaigns')
      .set(AUTH_HEADER)
      .send({
        name: 'Neon Launch',
        segmentId: '123e4567-e89b-12d3-a456-426614174000',
        templateId: '123e4567-e89b-12d3-a456-426614174001',
        maxMessagesPerMinute: 120,
      });

    expect(res.status).toBe(201);
    expect(res.body?.data?.id).toBe('campaign-1');
    expect(services.hidraService.createCampaign).toHaveBeenCalledWith({
      userId: 'user-42',
      name: 'Neon Launch',
      description: undefined,
      segmentId: '123e4567-e89b-12d3-a456-426614174000',
      templateId: '123e4567-e89b-12d3-a456-426614174001',
      maxMessagesPerMinute: 120,
      scheduledAt: null,
      externalId: undefined,
    });
  });

  it('rejects invalid campaign payload', async () => {
    const { app } = makeApp();

    const res = await request(app)
      .post('/api/hidra/campaigns')
      .set(AUTH_HEADER)
      .send({
        name: 'x',
      });

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
  });

  it('returns aggregated message summary for dashboard alias route', async () => {
    const summary: HidraDashboardSummary = {
      config: null,
      totals: {
        totalCampaigns: 5,
        running: 1,
        scheduled: 2,
        paused: 1,
        completed: 1,
        failed: 0,
      },
      messageSummary: {
        totalMessages: 320,
        delivered: 280,
        failed: 20,
        pending: 20,
        averageDeliveryMs: 950,
        lastUpdatedAt: new Date().toISOString(),
      },
      recentCampaigns: [],
    };

    const { app, services } = makeApp();
    (services.hidraService.getDashboardSummary as jest.Mock).mockResolvedValue(summary);

    const res = await request(app)
      .get('/api/hidra/campaigns/metrics/overview?recentLimit=3')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body?.data?.totalMessages).toBe(320);
    expect(services.hidraService.getDashboardSummary).toHaveBeenCalledWith('user-42', { recentLimit: 3 });
  });

  it('maps domain errors to HTTP responses', async () => {
    const error = new AppError({ code: 'HIDRA_RATE_LIMIT', message: 'too many requests', statusCode: 429 });
    const { app, services } = makeApp();
    (services.hidraService.createCampaign as jest.Mock).mockRejectedValue(error);

    const res = await request(app)
      .post('/api/hidra/campaigns')
      .set(AUTH_HEADER)
      .send({
        name: 'Campaign',
        segmentId: '123e4567-e89b-12d3-a456-426614174000',
        templateId: '123e4567-e89b-12d3-a456-426614174001',
      });

    expect(res.status).toBe(429);
    expect(res.body?.error?.code).toBe('HIDRA_RATE_LIMIT');
  });
});
