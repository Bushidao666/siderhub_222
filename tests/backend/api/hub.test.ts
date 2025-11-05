import request from 'supertest'
import type { Express } from 'express'
import { buildTestApp } from '../setup/supertest-app'
import type { ApiServices } from 'src/backend/api/types'
import { UserRole } from '@shared/types/common.types'

const banner = {
  id: 'banner-1',
  title: 'Welcome',
  description: 'Description',
  primaryCta: { label: 'Go', href: '/hub', external: false },
  secondaryCta: null,
  imageUrl: 'https://cdn.test/banner.png',
  order: 1,
  status: 'active',
  startsAt: null,
  endsAt: null,
  createdBy: 'admin-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

function makeApp(overrides: Partial<ApiServices> = {}): Express {
  const tokenService = {
    verifyAccessToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
    generateAccessToken: () => 'access',
    generateRefreshToken: () => 'refresh',
    verifyRefreshToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
  } as any

  const defaultServices: ApiServices = {
    authService: {} as any,
    tokenService,
    academyService: {} as any,
    hidraService: {} as any,
    cybervaultService: {} as any,
    adminService: {
      listBanners: async () => [banner],
    } as any,
    hubService: {
      getOverview: async () => ({
        banners: [banner],
        academy: {
          featured: [
            {
              id: 'course-1',
              slug: 'intro',
              title: 'Intro',
              subtitle: 'Start',
              description: 'Desc',
              coverImage: null,
              level: 'beginner',
              status: 'published',
              visibility: 'members',
              estimatedDurationMinutes: 45,
              totalLessons: 8,
              tags: [],
              releaseDate: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          recommendations: [
            {
              course: {
                id: 'course-1',
                slug: 'intro',
                title: 'Intro',
                subtitle: 'Start',
                description: 'Desc',
                coverImage: null,
                level: 'beginner',
                status: 'published',
                visibility: 'members',
                estimatedDurationMinutes: 45,
                totalLessons: 8,
                tags: [],
                releaseDate: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              recommendation: { courseId: 'course-1', reason: 'based_on_activity' },
            },
          ],
        },
        hidra: {
          totals: {
            totalCampaigns: 3,
            running: 1,
            scheduled: 1,
            paused: 0,
            completed: 1,
            failed: 0,
          },
          messageSummary: {
            totalMessages: 120,
            delivered: 110,
            failed: 5,
            pending: 5,
            averageDeliveryMs: 950,
            lastUpdatedAt: new Date().toISOString(),
          },
        },
        cybervault: {
          featuredResources: [],
        },
        generatedAt: new Date().toISOString(),
      }),
      getActiveBanners: async () => [banner],
    } as any,
  }

  return buildTestApp({ ...defaultServices, ...overrides })
}

describe('Hub API', () => {
  it('returns nested overview payload', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/hub')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.banners?.[0]?.id).toBe('banner-1')
    expect(res.body?.data?.academy?.featured?.length).toBe(1)
    expect(res.body?.data?.academy?.recommendations?.[0]?.course?.id).toBe('course-1')
    expect(res.body?.data?.hidra?.messageSummary?.totalMessages).toBe(120)
    expect(res.body?.data?.cybervault?.featuredResources).toEqual([])
  })

  it('returns active banners by default', async () => {
    const getActiveBanners = jest.fn().mockResolvedValue([banner])
    const app = makeApp({ hubService: { getOverview: async () => ({
      banners: [],
      academy: { featured: [], recommendations: [] },
      hidra: null,
      cybervault: { featuredResources: [] },
      generatedAt: new Date().toISOString(),
    }), getActiveBanners } as any })

    const res = await request(app)
      .get('/api/hub/banners?limit=2')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.[0]?.id).toBe('banner-1')
    expect(res.body?.meta?.status).toBe('active')
    expect(getActiveBanners).toHaveBeenCalledWith(2, undefined)
  })

  it('lists all banners when status=all', async () => {
    const listBanners = jest.fn().mockResolvedValue([banner, { ...banner, id: 'banner-2' }])
    const app = makeApp({ adminService: { listBanners } as any })

    const res = await request(app)
      .get('/api/hub/banners?status=all&limit=1')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.length).toBe(1)
    expect(res.body?.meta?.status).toBe('all')
    expect(listBanners).toHaveBeenCalled()
  })

  it('forwards overview limits and reference date to HubService', async () => {
    const getOverview = jest.fn().mockResolvedValue({
      banners: [],
      academy: { featured: [], recommendations: [] },
      hidra: null,
      cybervault: { featuredResources: [] },
      generatedAt: new Date().toISOString(),
    })

    const app = makeApp({
      hubService: {
        getOverview,
        getActiveBanners: async () => [],
      } as any,
    })

    const referenceDate = '2025-11-03T12:00:00.000Z'
    const res = await request(app)
      .get(
        '/api/hub?bannerLimit=2&featuredLimit=3&recommendationLimit=4&resourceLimit=5&hidraRecentLimit=6&referenceDate=2025-11-03T12:00:00.000Z',
      )
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(getOverview).toHaveBeenCalledWith({
      userId: 'u-1',
      bannerLimit: 2,
      featuredLimit: 3,
      recommendationLimit: 4,
      resourceLimit: 5,
      hidraRecentLimit: 6,
      referenceDate,
    })
    expect(res.body?.meta).toMatchObject({
      bannerLimit: 2,
      featuredLimit: 3,
      recommendationLimit: 4,
      resourceLimit: 5,
      hidraRecentLimit: 6,
      referenceDate,
    })
  })

  it('rejects overview requests with invalid limits', async () => {
    const app = makeApp()

    const res = await request(app)
      .get('/api/hub?bannerLimit=0')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })
})
