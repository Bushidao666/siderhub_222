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

  const cybervaultService = {
    async listResources() {
      return { items: [{ id: 'resource-1' }], page: 1, pageSize: 12, totalItems: 1, totalPages: 1 }
    },
    async getBySlug(slug: string) {
      if (slug === 'resource-1') {
        return { id: 'resource-1', slug, title: 'Resource', description: 'Desc', type: 'template', visibility: 'public' }
      }
      return null
    },
    async recordDownload() {
      return { ok: true, totalDownloads: 1, lastDownloadedAt: new Date().toISOString() }
    },
  } as any

  const services = {
    authService: {} as any,
    tokenService,
    academyService: {} as any,
    hidraService: {} as any,
    cybervaultService,
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

describe('Cybervault API', () => {
  it('lists resources when service available', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/cybervault/resources')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(res.body?.data?.items?.[0]?.id).toBe('resource-1')
  })

  it('returns 404 for unknown slug', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/cybervault/resources/unknown')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(404)
  })

  it('records download', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/cybervault/resources/123e4567-e89b-12d3-a456-426614174000/download')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(res.body?.data?.ok).toBe(true)
    expect(typeof res.body?.data?.lastDownloadedAt).toBe('string')
  })
})
