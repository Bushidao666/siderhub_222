import request from 'supertest'
import type { Express } from 'express'
import { buildTestApp } from '../setup/supertest-app'
import type { ApiServices } from 'src/backend/api/types'
import { FeatureAccessKey, UserRole } from '@shared/types/common.types'

function makeApp(role: UserRole, overrides: Partial<ApiServices> = {}): Express {
  const tokenService = overrides.tokenService ?? ({
    verifyAccessToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role }),
    generateAccessToken: () => 'access',
    generateRefreshToken: () => 'refresh',
    verifyRefreshToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role }),
  } as any)

  const adminService = {
    async listBanners() {
      return [
        {
          id: 'banner-1',
          title: 'Banner',
          description: 'Desc',
          primaryCta: { label: 'Go', href: '/', external: false },
          secondaryCta: null,
          imageUrl: 'https://img',
          status: 'active',
          startsAt: null,
          endsAt: null,
          order: 0,
        },
      ]
    },
    async createBanner(input: any) {
      return { id: 'banner-2', ...input }
    },
    async updateBanner(id: string, input: any) {
      return { id, ...input }
    },
    async deleteBanner() {
      return { ok: true }
    },
    async getFeatureToggles() {
      return [{ id: 'toggle-1', featureKey: FeatureAccessKey.Hidra, description: 'Hidra', status: 'enabled', rolloutPercentage: 0, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }]
    },
    async updateFeatureToggle(id: string, status: any) {
      return { id, featureKey: FeatureAccessKey.Hidra, description: 'Hidra', status, rolloutPercentage: 0, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
    },
    async setAccessOverride() {
      return {
        id: 'override-1',
        userId: 'u-2',
        feature: FeatureAccessKey.Hidra,
        enabled: true,
        permissions: ['read'],
        reason: 'Manual grant',
        grantedBy: 'u-1',
        grantedAt: '2025-01-01T00:00:00Z',
      }
    },
    async removeAccessOverride() {
      return { ok: true }
    },
    async listInvitations() {
      return [
        {
          id: 'invite-1',
          email: 'new@siderhub.ai',
          role: UserRole.Member,
          status: 'pending',
          invitedBy: 'u-1',
          expiresAt: '2025-02-01T00:00:00Z',
          createdAt: '2025-01-01T00:00:00Z',
        },
      ]
    },
    async getDashboardOverview() {
      return {
        metrics: [
          { id: 'banners-active', label: 'Banners ativos', value: 1, description: 'Hero banners publicados.' },
        ],
        upcomingTasks: ['Revisar banners'],
        recentActivities: ['Convite pending para new@siderhub.ai (2025-01-01T00:00:00Z).'],
        generatedAt: '2025-01-01T00:00:00Z',
      }
    },
    async createInvitation(input: any) {
      return {
        id: 'invite-2',
        email: input.email,
        role: input.role,
        status: 'pending',
        invitedBy: input.invitedBy,
        expiresAt: input.expiresAt,
        createdAt: '2025-01-02T00:00:00Z',
      }
    },
  } as any

  const services = {
    authService: overrides.authService ?? ({} as any),
    tokenService,
    academyService: overrides.academyService ?? ({} as any),
    hidraService: overrides.hidraService ?? ({} as any),
    cybervaultService: overrides.cybervaultService ?? ({} as any),
    adminService: { ...adminService, ...(overrides.adminService ?? {}) } as any,
    hubService: overrides.hubService ?? ({
      getOverview: async () => ({
        banners: [],
        academy: { featured: [], recommendations: [] },
        hidra: null,
        cybervault: { featuredResources: [] },
        generatedAt: new Date().toISOString(),
      }),
      getActiveBanners: async () => [],
    } as any),
  } as unknown as ApiServices
  return buildTestApp(services)
}

describe('Admin API', () => {
  it('forbids non-admin users', async () => {
    const app = makeApp(UserRole.Member)
    const res = await request(app)
      .get('/api/admin/banners')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(403)
  })

  it('lists banners for admin', async () => {
    const app = makeApp(UserRole.Admin)
    const res = await request(app)
      .get('/api/admin/banners')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(res.body?.data?.[0]?.id).toBe('banner-1')
  })

  it('creates banner', async () => {
    const app = makeApp(UserRole.Admin)
    const res = await request(app)
      .post('/api/admin/banners')
      .set('Authorization', 'Bearer test')
      .send({
        title: 'New Banner',
        description: 'Descrição detalhada',
        primaryCta: { label: 'Go', href: 'https://example.com', external: true },
        imageUrl: 'https://img',
        status: 'active',
        startsAt: null,
        endsAt: null,
      })
    expect(res.status).toBe(201)
    expect(res.body?.data?.id).toBe('banner-2')
  })

  it('lists invitations', async () => {
    const app = makeApp(UserRole.Admin)
    const res = await request(app)
      .get('/api/admin/invitations?status=pending')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(200)
    expect(res.body?.data?.[0]?.id).toBe('invite-1')
  })

  it('creates invitation', async () => {
    const createInvitation = jest.fn().mockResolvedValue({
      id: 'invite-42',
      email: 'invitee@siderhub.ai',
      role: UserRole.Member,
      status: 'pending',
      invitedBy: 'u-1',
      expiresAt: '2025-03-01T00:00:00Z',
      createdAt: '2025-01-15T00:00:00Z',
    })
    const app = makeApp(UserRole.Admin, { adminService: { createInvitation } as any })
    const res = await request(app)
      .post('/api/admin/invitations')
      .set('Authorization', 'Bearer test')
      .send({
        email: 'invitee@siderhub.ai',
        role: UserRole.Member,
        grantedAccess: [FeatureAccessKey.Hidra],
        expiresAt: '2025-03-01T00:00:00Z',
        sendEmail: true,
      })
    expect(res.status).toBe(201)
    expect(createInvitation).toHaveBeenCalledWith({
      email: 'invitee@siderhub.ai',
      role: UserRole.Member,
      grantedAccess: [FeatureAccessKey.Hidra],
      expiresAt: '2025-03-01T00:00:00Z',
      invitedBy: 'u-1',
      templateId: null,
      sendEmail: true,
    })
    expect(res.body?.data?.id).toBe('invite-42')
  })

  it('moderates a lesson comment (approve)', async () => {
    const approveComment = jest.fn().mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614170001',
      lessonId: '123e4567-e89b-12d3-a456-426614170002',
      userId: 'member-1',
      body: 'Pending comment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingModeration: false,
      moderationStatus: 'approved',
      moderatedById: 'u-1',
      moderatedAt: new Date().toISOString(),
      replies: [],
    })

    const app = makeApp(UserRole.Admin, {
      academyService: { approveComment } as any,
    })

    const res = await request(app)
      .post('/api/admin/academy/comments/123e4567-e89b-12d3-a456-426614170001/approve')
      .set('Authorization', 'Bearer test')

    expect(res.status).toBe(200)
    expect(approveComment).toHaveBeenCalledWith({ commentId: '123e4567-e89b-12d3-a456-426614170001', moderatorId: 'u-1' })
    expect(res.body?.data?.id).toBe('123e4567-e89b-12d3-a456-426614170001')
    expect(res.body?.meta?.action).toBe('approved')
  })

  it('returns admin dashboard overview for admins', async () => {
    const overview = {
      metrics: [
        { id: 'banners-active', label: 'Banners ativos', value: 2, description: 'Hero banners publicados.' },
        { id: 'pending-invitations', label: 'Convites pendentes', value: 3, description: 'Convites aguardando aceite.' },
      ],
      upcomingTasks: ['Revisar convites pendentes'],
      recentActivities: ['Convite pending para admin@siderhub.ai (2025-01-01T00:00:00Z).'],
      generatedAt: '2025-01-02T00:00:00Z',
    }
    const getDashboardOverview = jest.fn().mockResolvedValue(overview)
    const app = makeApp(UserRole.SuperAdmin, { adminService: { getDashboardOverview } as any })

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer test')

    expect(res.status).toBe(200)
    expect(getDashboardOverview).toHaveBeenCalled()
    expect(res.body?.data?.metrics?.length).toBe(2)
    expect(res.body?.data?.generatedAt).toBe('2025-01-02T00:00:00Z')
  })

  it('rejects invalid invitation payload', async () => {
    const app = makeApp(UserRole.Admin)
    const res = await request(app)
      .post('/api/admin/invitations')
      .set('Authorization', 'Bearer test')
      .send({ email: 'invalid-email', role: 'member' })
    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('forbids members from listing admin members', async () => {
    const app = makeApp(UserRole.Member)
    const res = await request(app)
      .get('/api/admin/members')
      .set('Authorization', 'Bearer test')
    expect(res.status).toBe(403)
  })

  it('lists admin members for admins', async () => {
    const listMembers = jest.fn().mockResolvedValue({
      items: [
        {
          user: {
            id: 'u-1',
            email: 'admin@siderhub.ai',
            role: UserRole.Admin,
            profile: {
              displayName: 'Admin User',
              avatarUrl: null,
              bio: null,
              timezone: 'America/Sao_Paulo',
              badges: [],
              socialLinks: [],
            },
            lastLoginAt: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
          accessMap: [],
        },
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    })

    const listInvitations = jest.fn().mockResolvedValue([
      {
        id: 'invite-meta-1',
        email: 'pending@siderhub.ai',
        status: 'pending',
      },
    ])

    const app = makeApp(UserRole.Admin, { adminService: { listMembers, listInvitations } as any })
    const res = await request(app)
      .get('/api/admin/members')
      .set('Authorization', 'Bearer test')

    expect(res.status).toBe(200)
    expect(listMembers).toHaveBeenCalled()
    expect(res.body?.data?.items?.[0]?.user?.email).toBe('admin@siderhub.ai')
    expect(listInvitations).toHaveBeenCalledWith({ status: 'pending', limit: 100 })
    expect(res.body?.meta?.pendingInvitations?.[0]?.id).toBe('invite-meta-1')
  })

  it('lists admin members with pagination and filters', async () => {
    const listMembers = jest.fn().mockResolvedValue({
      items: [
        {
          user: {
            id: 'u-42',
            email: 'member@siderhub.ai',
            role: UserRole.Member,
            profile: {
              displayName: 'Member 42',
              avatarUrl: null,
              bio: null,
              timezone: 'UTC',
              badges: [],
              socialLinks: [],
            },
            lastLoginAt: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-02T00:00:00Z',
          },
          accessMap: [
            { feature: FeatureAccessKey.Academy, enabled: true, permissions: ['comments:read'] },
          ],
        },
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    })
    const listInvitations = jest.fn().mockResolvedValue([])
    const app = makeApp(UserRole.Admin, { adminService: { listMembers, listInvitations } as any })

    const res = await request(app)
      .get('/api/admin/members?page=1&pageSize=20&role=member&search=mem')
      .set('Authorization', 'Bearer test')

    expect(res.status).toBe(200)
    expect(listMembers).toHaveBeenCalledWith({ page: 1, pageSize: 20, role: UserRole.Member, search: 'mem' })
    expect(res.body?.data?.items?.[0]?.user?.id).toBe('u-42')
    expect(listInvitations).toHaveBeenCalledWith({ status: 'pending', limit: 100 })
  })

  it('lists moderation queue (pending) including replies with depth', async () => {
    const listPendingModerationItems = jest.fn().mockResolvedValue([
      {
        id: 'item-1',
        entityId: 'comment-1',
        commentId: 'comment-1',
        lessonId: 'lesson-1',
        courseId: 'course-1',
        lessonTitle: 'Lesson 1',
        courseTitle: 'Course 1',
        userId: 'member-1',
        userDisplayName: 'Member 1',
        body: 'Pending comment',
        createdAt: '2025-01-02T12:00:00Z',
        pendingModeration: true,
        moderationStatus: 'pending',
        moderatedById: null,
        moderatedAt: null,
        type: 'comment',
        depth: 0,
      },
      {
        id: 'item-2',
        entityId: 'reply-1',
        commentId: 'comment-1',
        lessonId: 'lesson-1',
        courseId: 'course-1',
        lessonTitle: 'Lesson 1',
        courseTitle: 'Course 1',
        userId: 'member-2',
        userDisplayName: 'Member 2',
        body: 'First reply',
        createdAt: '2025-01-02T12:01:00Z',
        pendingModeration: true,
        moderationStatus: 'pending',
        moderatedById: null,
        moderatedAt: null,
        type: 'reply',
        depth: 1,
      },
    ])

    const app = makeApp(UserRole.Mentor, { academyService: { listPendingModerationItems } as any })
    const res = await request(app)
      .get('/api/admin/academy/comments/pending?status=pending&page=1&pageSize=10')
      .set('Authorization', 'Bearer test')

    expect(res.status).toBe(200)
    const items = res.body?.data
    expect(Array.isArray(items)).toBe(true)
    // Should include the root comment (type=comment) and at least two replies (type=reply)
    const types = items.map((x: any) => x.type)
    expect(types).toContain('comment')
    expect(types.filter((t: string) => t === 'reply').length).toBeGreaterThanOrEqual(1)
    // Replies should include depth metadata starting at 1
    const reply = items.find((x: any) => x.type === 'reply')
    expect(reply.depth).toBeGreaterThanOrEqual(1)
    expect(listPendingModerationItems).toHaveBeenCalledWith({ status: 'pending', page: 1, pageSize: 10 })
  })

  it('moderates a lesson comment reply (reject)', async () => {
    const rejectReply = jest.fn().mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614170009',
      commentId: '123e4567-e89b-12d3-a456-426614170099',
      parentReplyId: null,
      userId: 'member-9',
      body: 'Off-topic',
      createdAt: new Date().toISOString(),
      pendingModeration: false,
      moderationStatus: 'rejected',
      moderatedById: 'u-1',
      moderatedAt: new Date().toISOString(),
      replies: [],
    })

    const app = makeApp(UserRole.Admin, {
      academyService: { rejectReply } as any,
    })

    const res = await request(app)
      .post('/api/admin/academy/comments/123e4567-e89b-12d3-a456-426614170099/replies/123e4567-e89b-12d3-a456-426614170009/reject')
      .set('Authorization', 'Bearer test')

    expect(res.status).toBe(200)
    expect(rejectReply).toHaveBeenCalledWith({ commentId: '123e4567-e89b-12d3-a456-426614170099', replyId: '123e4567-e89b-12d3-a456-426614170009', moderatorId: 'u-1' })
    expect(res.body?.data?.moderationStatus).toBe('rejected')
    expect(res.body?.meta?.action).toBe('rejected')
  })
})
