import request from 'supertest';
import type { Express } from 'express';

import type { ApiServices } from 'src/backend/api/types';
import { buildTestApp } from '../setup/supertest-app';
import { UserRole, FeatureAccessKey } from '@shared/types/common.types';
import type { PaginatedResponse } from '@shared/types';
import type { AdminMemberItem } from '@shared/types/admin.types';

const MEMBER_HEADER = { Authorization: 'Bearer member-token' } as const;
const ADMIN_HEADER = { Authorization: 'Bearer admin-token' } as const;

function makeApp(overrides: Partial<ApiServices> = {}) {
  const tokenService = {
    verifyAccessToken: (token: string) => {
      if (token === 'admin-token') {
        return { userId: 'admin-1', sessionId: 'sess-admin', role: UserRole.Admin };
      }
      return { userId: 'member-1', sessionId: 'sess-member', role: UserRole.Member };
    },
    generateAccessToken: () => 'access-token',
    generateRefreshToken: () => 'refresh-token',
    verifyRefreshToken: () => ({ userId: 'admin-1', sessionId: 'sess-admin', role: UserRole.Admin }),
  } as unknown as ApiServices['tokenService'];

  const adminService = overrides.adminService ?? {
    listBanners: jest.fn().mockResolvedValue([
      {
        id: 'banner-1',
        title: 'Launch Neon',
        description: 'Campanha neon',
        primaryCta: { label: 'Ver hub', href: '/hub', external: false },
        secondaryCta: null,
        imageUrl: 'https://cdn.test/banner.png',
        order: 1,
        status: 'active',
        startsAt: null,
        endsAt: null,
        createdBy: 'admin-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]),
    updateFeatureToggle: jest.fn().mockResolvedValue({
      id: 'toggle-1',
      feature: FeatureAccessKey.Hidra,
      status: 'enabled',
      rolloutPercentage: 100,
      updatedAt: new Date().toISOString(),
    }),
    listMembers: jest.fn().mockResolvedValue({
      items: [
        {
          user: {
            id: 'member-1',
            email: 'member1@siderhub.ai',
            role: UserRole.Member,
            profile: {
              displayName: 'Member One',
              avatarUrl: null,
              bio: null,
              timezone: 'UTC',
              badges: [],
              socialLinks: [],
            },
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          accessMap: [],
        },
      ],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    } as PaginatedResponse<AdminMemberItem>),
    listInvitations: jest.fn().mockResolvedValue([]),
  };

  const services: ApiServices = {
    authService: overrides.authService ?? ({} as any),
    tokenService,
    academyService: overrides.academyService ?? ({} as any),
    hidraService: overrides.hidraService ?? ({} as any),
    cybervaultService: overrides.cybervaultService ?? ({} as any),
    adminService: adminService as any,
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

describe('Admin API integration', () => {
  it('requires auth header for admin members', async () => {
    const { app } = makeApp();

    const res = await request(app).get('/api/admin/members');

    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe('AUTH_REQUIRED');
  });

  it('denies access to non-admin members', async () => {
    const { app } = makeApp();

    const res = await request(app).get('/api/admin/banners').set(MEMBER_HEADER);

    expect(res.status).toBe(403);
    expect(res.body?.error?.code).toBe('FORBIDDEN');
  });

  it('lists banners for admins with proper auth', async () => {
    const { app, services } = makeApp();

    const res = await request(app).get('/api/admin/banners').set(ADMIN_HEADER);

    expect(res.status).toBe(200);
    expect(res.body?.data?.[0]?.title).toBe('Launch Neon');
    expect(services.adminService.listBanners).toHaveBeenCalled();
  });

  it('validates admin members query params', async () => {
    const { app } = makeApp();

    const res = await request(app)
      .get('/api/admin/members?page=0&pageSize=1000&role=invalid&search=a')
      .set(ADMIN_HEADER);

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
  });

  it('requires auth for moderation list and forbids members', async () => {
    const { app } = makeApp({
      academyService: {
        listPendingModerationItems: jest.fn().mockResolvedValue([]),
      } as any,
    });

    const noAuth = await request(app).get('/api/admin/academy/comments/pending');
    expect(noAuth.status).toBe(401);
    expect(noAuth.body?.error?.code).toBe('AUTH_REQUIRED');

    const member = await request(app)
      .get('/api/admin/academy/comments/pending')
      .set(MEMBER_HEADER);
    expect(member.status).toBe(403);
    expect(member.body?.error?.code).toBe('FORBIDDEN');
  });

  it('validates moderation routes for replies (params)', async () => {
    const { app } = makeApp({
      academyService: {
        approveReply: jest.fn(),
        rejectReply: jest.fn(),
      } as any,
    });

    // invalid UUIDs
    const badIds = await request(app)
      .post('/api/admin/academy/comments/not-a-uuid/replies/also-bad/approve')
      .set(ADMIN_HEADER);
    expect(badIds.status).toBe(400);
    expect(badIds.body?.error?.code).toBe('VALIDATION_ERROR');
  });

  it('denies access to members list for non-admins', async () => {
    const { app } = makeApp();

    const res = await request(app).get('/api/admin/members').set(MEMBER_HEADER);

    expect(res.status).toBe(403);
    expect(res.body?.error?.code).toBe('FORBIDDEN');
  });

  it('lists members for admins with filters and pagination', async () => {
    const { app, services } = makeApp();

    const res = await request(app)
      .get('/api/admin/members?page=2&pageSize=5&role=member&search=john')
      .set(ADMIN_HEADER);

    expect(res.status).toBe(200);
    expect(services.adminService.listMembers).toHaveBeenCalledWith({ page: 2, pageSize: 5, role: UserRole.Member, search: 'john' });
    expect(res.body?.data?.items?.length).toBeGreaterThanOrEqual(0);
    expect(res.body?.data?.page).toBeDefined();
    expect(res.body?.data?.pageSize).toBeDefined();
    expect(res.body?.data?.totalItems).toBeDefined();
    expect(res.body?.data?.totalPages).toBeDefined();
  });

  it('lists pending moderation items (comments and replies) for admins', async () => {
    const listPendingModerationItems = jest.fn().mockResolvedValue([
      {
        id: 'comment-1',
        entityId: 'comment-1',
        commentId: 'comment-1',
        lessonId: 'lesson-1',
        courseId: 'course-1',
        lessonTitle: 'Lesson title',
        courseTitle: 'Course title',
        userId: 'member-1',
        userDisplayName: 'Member One',
        body: 'First comment',
        createdAt: new Date().toISOString(),
        pendingModeration: true,
        moderationStatus: 'pending',
        moderatedById: null,
        moderatedAt: null,
        type: 'comment',
        depth: 0,
      },
    ]);
    const { app } = makeApp({
      academyService: { listPendingModerationItems } as any,
    });

    const res = await request(app)
      .get('/api/admin/academy/comments/pending?status=pending&page=1&pageSize=20')
      .set(ADMIN_HEADER);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(listPendingModerationItems).toHaveBeenCalledWith({ status: 'pending', page: 1, pageSize: 20 });
  });

  it('moderates a reply via admin endpoint', async () => {
    const approveReply = jest.fn().mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174001',
      commentId: '123e4567-e89b-12d3-a456-426614174000',
      parentReplyId: null,
      userId: 'member-2',
      body: 'A reply',
      createdAt: new Date().toISOString(),
      pendingModeration: false,
      moderationStatus: 'approved',
      moderatedById: 'admin-1',
      moderatedAt: new Date().toISOString(),
      replies: [],
    });
    const { app } = makeApp({
      academyService: { approveReply } as any,
    });

    const res = await request(app)
      .post('/api/admin/academy/comments/123e4567-e89b-12d3-a456-426614174000/replies/123e4567-e89b-12d3-a456-426614174001/approve')
      .set(ADMIN_HEADER);

    expect(res.status).toBe(200);
    expect(approveReply).toHaveBeenCalledWith({ commentId: '123e4567-e89b-12d3-a456-426614174000', replyId: '123e4567-e89b-12d3-a456-426614174001', moderatorId: 'admin-1' });
    expect(res.body?.data?.id).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  it('updates feature toggle when payload is valid', async () => {
    const { app, services } = makeApp();

    const res = await request(app)
      .put('/api/admin/feature-toggles/123e4567-e89b-12d3-a456-426614174000')
      .set(ADMIN_HEADER)
      .send({ status: 'enabled', rolloutPercentage: 100 });

    expect(res.status).toBe(200);
    expect(res.body?.data?.status).toBe('enabled');
    expect(services.adminService.updateFeatureToggle).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
      'enabled',
      100,
    );
  });
});
