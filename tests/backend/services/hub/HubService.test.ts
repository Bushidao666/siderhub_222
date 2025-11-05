import type { HeroBanner } from '@shared/types/admin.types';
import type { CourseMeta, CourseRecommendation } from '@shared/types/academy.types';
import type { Resource } from '@shared/types/cybervault.types';
import type { HidraDashboardSummary } from '@shared/types/hidra.types';
import type { UUID } from '@shared/types/common.types';
import { BannerStatus, Visibility, CourseStatus, ResourceType } from '@shared/types/common.types';
import { HubService } from 'src/backend/services/hub/HubService';
import type { HubServiceDeps } from 'src/backend/services/hub/HubService';
import { AppError } from 'src/backend/errors/AppError';

const uuid = (value: string) => value as UUID;

const FIXED_NOW = '2025-11-03T10:00:00.000Z';

const createBanner = (id: number, overrides: Partial<HeroBanner> = {}): HeroBanner => ({
  id: uuid(`00000000-0000-4000-8000-00000000000${id}`),
  title: `Banner ${id}`,
  description: 'Descrição do banner',
  primaryCta: { label: 'Acessar', href: '/hub', external: false },
  secondaryCta: null,
  imageUrl: 'https://cdn.example.com/banner.png',
  order: id,
  status: BannerStatus.Active,
  startsAt: null,
  endsAt: null,
  createdBy: uuid('99999999-9999-4999-8999-999999999999'),
  createdAt: FIXED_NOW,
  updatedAt: FIXED_NOW,
  ...overrides,
});

const createCourseMeta = (id: number, overrides: Partial<CourseMeta> = {}): CourseMeta => ({
  id: uuid(`11111111-1111-4111-8111-00000000000${id}`),
  slug: `course-${id}`,
  title: `Curso ${id}`,
  subtitle: 'Subtítulo',
  description: 'Descrição do curso',
  coverImage: null,
  level: 'beginner',
  status: CourseStatus.Published,
  visibility: Visibility.Members,
  estimatedDurationMinutes: 120,
  totalLessons: 10,
  tags: ['crescimento'],
  releaseDate: null,
  isFeatured: id % 2 === 0,
  recommendationScore: id * 10,
  createdAt: FIXED_NOW,
  updatedAt: FIXED_NOW,
  ...overrides,
});

const createRecommendation = (index: number): CourseRecommendation => ({
  courseId: uuid(`11111111-1111-4111-8111-00000000000${index}`),
  reason: 'Popular entre membros com perfil similar',
  badge: 'popular',
});

const createResource = (id: number): Resource => ({
  id: uuid(`33333333-3333-4333-8333-00000000000${id}`),
  slug: `resource-${id}`,
  title: `Recurso ${id}`,
  description: 'Checklist completo',
  type: ResourceType.Playbook,
  categoryId: uuid('44444444-4444-4444-8444-444444444444'),
  tags: [],
  thumbnailUrl: null,
  visibility: Visibility.Members,
  featured: id === 1,
  downloadCount: 10,
  viewCount: 25,
  createdBy: uuid('55555555-5555-4555-8555-555555555556'),
  createdAt: FIXED_NOW,
  updatedAt: FIXED_NOW,
  assets: [
    {
      id: uuid(`44444444-4444-4444-8444-00000000000${id}`),
      resourceId: uuid(`33333333-3333-4333-8333-00000000000${id}`),
      fileUrl: 'https://cdn.example.com/resource.pdf',
      fileName: 'resource.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    },
  ],
});

const createHidraSnapshot = (): HidraDashboardSummary => ({
  totals: {
    totalCampaigns: 12,
    running: 2,
    scheduled: 1,
    paused: 1,
    completed: 7,
    failed: 1,
  },
  messageSummary: {
    totalMessages: 1200,
    delivered: 1100,
    failed: 50,
    pending: 50,
    averageDeliveryMs: 1500,
    lastUpdatedAt: FIXED_NOW,
  },
  recentCampaigns: [],
  config: null,
});

type MockLogger = Required<Pick<Console, 'debug' | 'info' | 'warn' | 'error'>>;

describe('HubService', () => {
  const userId = uuid('55555555-5555-4555-8555-555555555555');

  const createService = () => {
    const adminService = {
      listActiveBanners: jest.fn(),
    };
    const academyService = {
      getFeaturedCourses: jest.fn(),
      getRecommendedCourses: jest.fn(),
    };
    const hidraService = {
      getDashboardSummary: jest.fn(),
    };
    const cybervaultService = {
      getFeaturedResources: jest.fn(),
    };
    const logger: MockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const service = new HubService({
      adminService: adminService as unknown as HubServiceDeps['adminService'],
      academyService: academyService as unknown as HubServiceDeps['academyService'],
      hidraService: hidraService as unknown as HubServiceDeps['hidraService'],
      cybervaultService: cybervaultService as unknown as HubServiceDeps['cybervaultService'],
      logger,
      now: () => new Date(FIXED_NOW),
    });

    return { service, adminService, academyService, hidraService, cybervaultService, logger };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates overview data applying limits and reference date', async () => {
    const { service, adminService, academyService, hidraService, cybervaultService } = createService();

    adminService.listActiveBanners.mockResolvedValue([createBanner(1), createBanner(2), createBanner(3)]);
    academyService.getFeaturedCourses.mockResolvedValue([
      createCourseMeta(1),
      createCourseMeta(2),
      createCourseMeta(3),
    ]);
    academyService.getRecommendedCourses.mockResolvedValue([
      { course: createCourseMeta(4), recommendation: createRecommendation(4) },
      { course: createCourseMeta(5), recommendation: createRecommendation(5) },
    ]);
    hidraService.getDashboardSummary.mockResolvedValue(createHidraSnapshot());
    cybervaultService.getFeaturedResources.mockResolvedValue([createResource(1), createResource(2)]);

    const result = await service.getOverview({
      userId,
      bannerLimit: 2,
      featuredLimit: 2,
      recommendationLimit: 1,
      resourceLimit: 1,
      hidraRecentLimit: 1,
    });

    expect(adminService.listActiveBanners).toHaveBeenCalledWith(FIXED_NOW);
    expect(academyService.getFeaturedCourses).toHaveBeenCalledWith(2);
    expect(academyService.getRecommendedCourses).toHaveBeenCalledWith(userId, 1);
    expect(hidraService.getDashboardSummary).toHaveBeenCalledWith(userId, { recentLimit: 1 });
    expect(cybervaultService.getFeaturedResources).toHaveBeenCalledWith(1);

    expect(result.banners).toHaveLength(2);
    expect(result.academy.featured).toHaveLength(2);
    expect(result.academy.recommendations).toHaveLength(1);
    expect(result.hidra).not.toBeNull();
    expect(result.cybervault.featuredResources).toHaveLength(1);
    expect(result.generatedAt).toBe(FIXED_NOW);
  });

  it('logs dependency failures but still returns partial data when at least one succeeds', async () => {
    const { service, adminService, academyService, hidraService, cybervaultService, logger } = createService();

    adminService.listActiveBanners.mockRejectedValue(new Error('banners down'));
    academyService.getFeaturedCourses.mockResolvedValue([createCourseMeta(1)]);
    academyService.getRecommendedCourses.mockRejectedValue(new Error('recommendations error'));
    hidraService.getDashboardSummary.mockResolvedValue(createHidraSnapshot());
    cybervaultService.getFeaturedResources.mockRejectedValue(new Error('resources failed'));

    const result = await service.getOverview({ userId });

    expect(logger.warn).toHaveBeenCalledWith(
      'HubService dependency failed',
      expect.objectContaining({ dependency: 'adminService.listActiveBanners', message: 'banners down' }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'HubService dependency failed',
      expect.objectContaining({ dependency: 'academyService.getRecommendedCourses', message: 'recommendations error' }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'HubService dependency failed',
      expect.objectContaining({ dependency: 'cybervaultService.getFeaturedResources', message: 'resources failed' }),
    );

    expect(result.banners).toEqual([]);
    expect(result.academy.featured).toHaveLength(1);
    expect(result.academy.recommendations).toEqual([]);
    expect(result.hidra).not.toBeNull();
    expect(result.cybervault.featuredResources).toEqual([]);
  });

  it('throws AppError when every dependency fails', async () => {
    const { service, adminService, academyService, hidraService, cybervaultService } = createService();

    adminService.listActiveBanners.mockRejectedValue(new Error('fail'));
    academyService.getFeaturedCourses.mockRejectedValue(new Error('fail'));
    academyService.getRecommendedCourses.mockRejectedValue(new Error('fail'));
    hidraService.getDashboardSummary.mockRejectedValue(new Error('fail'));
    cybervaultService.getFeaturedResources.mockRejectedValue(new Error('fail'));

    const promise = service.getOverview({ userId });
    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({
      code: 'HUB_OVERVIEW_UNAVAILABLE',
      message: 'Não foi possível carregar dados do Hub',
      statusCode: 503,
    });
  });
});
