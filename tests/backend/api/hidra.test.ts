import request from 'supertest'
import type { Express } from 'express'
import { buildTestApp } from '../setup/supertest-app'
import type { ApiServices } from 'src/backend/api/types'
import { UserRole } from '@shared/types/common.types'

function makeApp(overrides: Partial<ApiServices> = {}): Express {
  const tokenService = {
    verifyAccessToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
    generateAccessToken: () => 'access',
    generateRefreshToken: () => 'refresh',
    verifyRefreshToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
  } as any

  const hidraService = {
    async updateConfig(input: { userId: string; baseUrl: string }) {
      return {
        id: 'config-1',
        userId: input.userId,
        baseUrl: input.baseUrl,
        apiKeyEncrypted: 'encrypted-key',
        status: 'connected',
        errorMessage: null,
        connectedAt: '2025-01-01T00:00:00Z',
        lastHealthCheckAt: '2025-01-01T01:00:00Z',
      }
    },
    async testConnection() {
      return true
    },
    async createCampaign() {
      return { id: 'campaign-1', name: 'Campaign', status: 'draft', userId: 'u-1' }
    },
    async scheduleCampaign(input: { campaignId: string }) {
      return { id: input.campaignId, name: 'Campaign', status: 'scheduled', userId: 'u-1' }
    },
    async getCampaignMetrics() {
      return {
        campaignId: 'campaign-1',
        totalMessages: 10,
        delivered: 9,
        failed: 1,
        pending: 0,
        averageDeliveryMs: 1200,
        lastUpdatedAt: new Date().toISOString(),
      }
    },
    async getDashboardSummary() {
      return {
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
          totalMessages: 42,
          delivered: 40,
          failed: 2,
          pending: 0,
          averageDeliveryMs: 950,
          lastUpdatedAt: new Date().toISOString(),
        },
        recentCampaigns: [],
      }
    },
  } as any

  const services = {
    authService: {} as any,
    tokenService,
    academyService: {} as any,
    hidraService,
    cybervaultService: {} as any,
    adminService: {} as any,
    hubService: {
      getOverview: async () => ({
        banners: [],
        academy: { featured: [], recommendations: [] },
        hidra: null,
        cybervault: { featuredResources: [] },
        generatedAt: new Date().toISOString(),
      }),
      getActiveBanners: async () => [],
    } as any,
    ...overrides,
  } as unknown as ApiServices
  return buildTestApp(services)
}

describe('Hidra API', () => {
  it('requires auth for config test', async () => {
    const app = makeApp({ hidraService: { testConnection: async () => true } as any })
    const res = await request(app).post('/api/hidra/config/test').send({})
    expect(res.status).toBe(401)
  })

  it('returns 200 for config test when service ok', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/hidra/config/test')
      .set('Authorization', 'Bearer test')
      .send({})
    expect(res.status).toBe(200)
    expect(res.body?.data?.ok).toBe(true)
  })

  it('updates config', async () => {
    const app = makeApp()
    const res = await request(app)
      .put('/api/hidra/config')
      .set('Authorization', 'Bearer test')
      .send({ baseUrl: 'https://evolution.test', apiKey: 'secret-key', verifyConnection: false })
    expect(res.status).toBe(200)
    expect(res.body?.data?.baseUrl).toBe('https://evolution.test')
  })

  it('creates campaign', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/hidra/campaigns')
      .set('Authorization', 'Bearer test')
      .send({
        name: 'Campaign',
        segmentId: '123e4567-e89b-12d3-a456-426614174000',
        templateId: '123e4567-e89b-12d3-a456-426614174001',
      })
    expect(res.status).toBe(201)
    expect(res.body?.data?.id).toBe('campaign-1')
  })

  it('schedules campaign', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/hidra/campaigns/123e4567-e89b-12d3-a456-426614174000/schedule')
      .set('Authorization', 'Bearer test')
      .send({ scheduledAt: new Date().toISOString() })
    expect(res.status).toBe(200)
    expect(res.body?.data?.status).toBe('scheduled')
  })

  it('retrieves campaign metrics', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/hidra/campaigns/123e4567-e89b-12d3-a456-426614174000/metrics')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(res.body?.data?.campaignId).toBe('campaign-1')
  })

  it('returns dashboard summary', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/hidra/dashboard?recentLimit=2')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(res.body?.data?.totals?.totalCampaigns).toBe(3)
  })
})
