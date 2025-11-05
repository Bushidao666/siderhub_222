import request from 'supertest'
import type { Express } from 'express'
import { buildTestApp } from '../setup/supertest-app'
import type { ApiServices } from 'src/backend/api/types'
import type { LoginResponse, MemberAccessMap, SessionSummary, User } from '@shared/types/auth.types'
import { UserRole } from '@shared/types/common.types'

function makeApp(overrides: Partial<ApiServices> = {}): Express {
  const tokenService = {
    verifyAccessToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
    generateAccessToken: () => 'access',
    generateRefreshToken: () => 'refresh',
    verifyRefreshToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
  } as any

  const authService = {
    async login() {
      const user: User = {
        id: 'u-1',
        email: 'test@example.com',
        role: UserRole.Member,
        profile: {
          displayName: 'Tester',
          avatarUrl: null,
          bio: null,
          timezone: 'UTC',
          badges: [],
          socialLinks: [],
        },
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const accessMap: MemberAccessMap[] = []
      const activeSessions: SessionSummary[] = []
      return { user, accessToken: 'access', refreshToken: 'refresh', accessMap, activeSessions } satisfies LoginResponse
    },
    async register() { throw new Error('not used') },
    async refreshTokens() { throw new Error('not used') },
    async logout() { return },
    async me() { throw new Error('not used') },
  } as any

  const baseServices: ApiServices = {
    authService,
    tokenService,
    academyService: {
      getCourses: async () => ({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }),
      getCourseTree: async () => null,
      updateProgress: async () => {
        throw new Error('not used')
      },
      addLessonComment: async () => {
        throw new Error('not used')
      },
    } as any,
    hidraService: {
      testConnection: async () => true,
      createCampaign: async () => {
        throw new Error('not used')
      },
      scheduleCampaign: async () => {
        throw new Error('not used')
      },
      getCampaignMetrics: async () => {
        throw new Error('not used')
      },
    } as any,
    cybervaultService: {
      listResources: async () => ({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }),
      getBySlug: async () => null,
      recordDownload: async () => ({ ok: true, totalDownloads: 1 }),
    } as any,
    adminService: {
      listBanners: async () => [],
      createBanner: async () => {
        throw new Error('not used')
      },
      updateBanner: async () => {
        throw new Error('not used')
      },
      deleteBanner: async () => ({ ok: true }),
      getFeatureToggles: async () => [],
      updateFeatureToggle: async () => {
        throw new Error('not used')
      },
      setAccessOverride: async () => {
        throw new Error('not used')
      },
      removeAccessOverride: async () => ({ ok: true }),
    } as any,
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
  }

  const services: ApiServices = { ...baseServices, ...overrides }
  return buildTestApp(services)
}

describe('Auth API', () => {
  it('returns 400 on invalid login payload', async () => {
    const app = makeApp()
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' })
    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('returns 200 on valid login', async () => {
    const app = makeApp()
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'Secret123' })
    expect(res.status).toBe(200)
    expect(res.body?.success).toBe(true)
    expect(res.body?.data?.accessToken).toBeDefined()
  })
})
