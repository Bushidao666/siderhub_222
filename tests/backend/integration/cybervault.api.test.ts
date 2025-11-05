import request from 'supertest';
import type { Express } from 'express';

import type { ApiServices } from 'src/backend/api/types';
import { buildTestApp } from '../setup/supertest-app';
import { UserRole, Visibility, ResourceType } from '@shared/types/common.types';
import type { PaginatedResponse } from '@shared/types/common.types';
import type { Resource } from '@shared/types/cybervault.types';

const AUTH_HEADER = { Authorization: 'Bearer token' } as const;

function makeApp(overrides: Partial<ApiServices> = {}) {
  const tokenService = overrides.tokenService ?? {
    verifyAccessToken: () => ({ userId: 'user-1', sessionId: 'session-1', role: UserRole.Member }),
    generateAccessToken: () => 'access-token',
    generateRefreshToken: () => 'refresh-token',
    verifyRefreshToken: () => ({ userId: 'user-1', sessionId: 'session-1', role: UserRole.Member }),
  };

  const defaultCybervaultService = {
    listResources: jest.fn(),
    getBySlug: jest.fn(),
    recordDownload: jest.fn(),
  };
  const cybervaultService = overrides.cybervaultService
    ? { ...defaultCybervaultService, ...overrides.cybervaultService }
    : defaultCybervaultService;

  const services: ApiServices = {
    authService: overrides.authService ?? ({} as any),
    tokenService: tokenService as ApiServices['tokenService'],
    academyService: overrides.academyService ?? ({} as any),
    hidraService: overrides.hidraService ?? ({} as any),
    cybervaultService: cybervaultService as any,
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

describe('Cybervault API integration', () => {
  it('lists resources applying normalized filters and pagination', async () => {
    const { app, services } = makeApp();
    const mockResponse: PaginatedResponse<Resource> = {
      items: [
        {
          id: 'resource-1',
          slug: 'neon-playbook',
          title: 'Playbook Neon',
          description: 'Checklist neon',
          type: ResourceType.Playbook,
          categoryId: 'cat-1',
          tags: [{ id: 'tag-1', name: 'automation' }],
          thumbnailUrl: null,
          visibility: Visibility.Members,
          featured: true,
          downloadCount: 42,
          viewCount: 128,
          createdBy: 'author-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assets: [],
        },
      ],
      page: 1,
      pageSize: 12,
      totalItems: 1,
      totalPages: 1,
    };

    (services.cybervaultService.listResources as jest.Mock).mockResolvedValue(mockResponse);

    const res = await request(app)
      .get(
        '/api/cybervault/resources?query=neon&categoryIds=123e4567-e89b-12d3-a456-426614174000,123e4567-e89b-12d3-a456-426614174001&tagIds=123e4567-e89b-12d3-a456-426614174002&types=playbook&visibility=members&page=2&pageSize=6&sortBy=createdAt&sortDirection=desc',
      )
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body?.data?.items?.[0]?.slug).toBe('neon-playbook');
    expect(services.cybervaultService.listResources).toHaveBeenCalledWith({
      query: 'neon',
      categoryIds: [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      ],
      tagIds: ['123e4567-e89b-12d3-a456-426614174002'],
      types: [ResourceType.Playbook],
      visibility: Visibility.Members,
      page: 2,
      pageSize: 6,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
  });

  it('records download and returns audit summary', async () => {
    const { app, services } = makeApp();

    const lastDownloadedAt = new Date().toISOString();
    (services.cybervaultService.recordDownload as jest.Mock).mockResolvedValue({
      ok: true,
      totalDownloads: 11,
      lastDownloadedAt,
    });

    const res = await request(app)
      .post('/api/cybervault/resources/123e4567-e89b-12d3-a456-426614174000/download')
      .set(AUTH_HEADER)
      .send();

    expect(res.status).toBe(200);
    expect(res.body?.data?.ok).toBe(true);
    expect(res.body?.data?.totalDownloads).toBe(11);
    expect(res.body?.data?.lastDownloadedAt).toBe(lastDownloadedAt);
    expect(services.cybervaultService.recordDownload).toHaveBeenCalledWith({
      resourceId: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-1',
      ipAddress: expect.any(String),
    });
  });
});
