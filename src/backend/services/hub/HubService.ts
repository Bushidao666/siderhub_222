import type { UUID } from '@shared/types';
import type { HeroBanner } from '@shared/types/admin.types';
import type { CourseMeta } from '@shared/types/academy.types';
import type { Resource } from '@shared/types/cybervault.types';
import type { HubOverview, HubAcademyRecommendation, HubHidraSummary } from '@shared/types/hub.types';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';
import { createLogger } from '../../logger';
import type { AdminService } from '../admin/AdminService';
import type { AcademyService, RecommendedCourse } from '../academy/AcademyService';
import type { CybervaultService } from '../cybervault/CybervaultService';
import type { HidraService } from '../hidra/HidraService';

type HidraDashboardSnapshot = Awaited<ReturnType<HidraService['getDashboardSummary']>>;

const DEFAULT_BANNER_LIMIT = 5;
const DEFAULT_FEATURED_LIMIT = 6;
const DEFAULT_RECOMMENDATION_LIMIT = 6;
const DEFAULT_RESOURCE_LIMIT = 6;
const MAX_LIMIT = 24;

export interface HubServiceDeps {
  adminService: AdminService;
  academyService: AcademyService;
  cybervaultService: CybervaultService;
  hidraService: HidraService;
  logger?: Logger;
  now?: () => Date;
}

export interface HubOverviewOptions {
  userId: UUID;
  bannerLimit?: number;
  featuredLimit?: number;
  recommendationLimit?: number;
  resourceLimit?: number;
  referenceDate?: string;
  hidraRecentLimit?: number;
}

export class HubService {
  private readonly logger: Logger;
  private readonly now: () => Date;

  constructor(private readonly deps: HubServiceDeps) {
    this.logger = deps.logger ?? createLogger('HubService');
    this.now = deps.now ?? (() => new Date());
  }

  async getOverview(options: HubOverviewOptions): Promise<HubOverview> {
    const bannerLimit = this.normalizeLimit(options.bannerLimit, DEFAULT_BANNER_LIMIT);
    const featuredLimit = this.normalizeLimit(options.featuredLimit, DEFAULT_FEATURED_LIMIT);
    const recommendationLimit = this.normalizeLimit(options.recommendationLimit, DEFAULT_RECOMMENDATION_LIMIT);
    const resourceLimit = this.normalizeLimit(options.resourceLimit, DEFAULT_RESOURCE_LIMIT);
    const referenceDate = options.referenceDate ?? this.now().toISOString();

    const settled = (await Promise.allSettled([
      this.deps.adminService.listActiveBanners(referenceDate),
      this.deps.academyService.getFeaturedCourses(featuredLimit),
      this.deps.academyService.getRecommendedCourses(options.userId, recommendationLimit),
      this.deps.hidraService.getDashboardSummary(options.userId, { recentLimit: options.hidraRecentLimit ?? 3 }),
      this.deps.cybervaultService.getFeaturedResources(resourceLimit),
    ])) as [
      PromiseSettledResult<HeroBanner[]>,
      PromiseSettledResult<CourseMeta[]>,
      PromiseSettledResult<RecommendedCourse[]>,
      PromiseSettledResult<HidraDashboardSnapshot>,
      PromiseSettledResult<Resource[]>,
    ];

    let hasSuccess = false;
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        hasSuccess = true;
      } else {
        this.logDependencyFailure(this.dependencyLabel(index), result.reason);
      }
    });

    if (!hasSuccess) {
      throw new AppError({
        code: 'HUB_OVERVIEW_UNAVAILABLE',
        message: 'Não foi possível carregar dados do Hub',
        statusCode: 503,
      });
    }

    const [bannersResult, featuredResult, recommendationsResult, hidraResult, resourcesResult] = settled;

    const banners =
      bannersResult.status === 'fulfilled'
        ? bannersResult.value.slice(0, bannerLimit)
        : [];

    const featured =
      featuredResult.status === 'fulfilled'
        ? featuredResult.value.slice(0, featuredLimit)
        : [];

    const recommendations =
      recommendationsResult.status === 'fulfilled'
        ? this.mapRecommendations(recommendationsResult.value).slice(0, recommendationLimit)
        : [];

    const hidra: HubHidraSummary | null =
      hidraResult.status === 'fulfilled'
        ? this.toHubHidraSummary(hidraResult.value)
        : null;

    const featuredResources =
      resourcesResult.status === 'fulfilled'
        ? resourcesResult.value.slice(0, resourceLimit)
        : [];

    return {
      banners,
      academy: {
        featured,
        recommendations,
      },
      hidra,
      cybervault: {
        featuredResources,
      },
      generatedAt: this.now().toISOString(),
    } satisfies HubOverview;
  }

  async getActiveBanners(limit = DEFAULT_BANNER_LIMIT, referenceDate?: string): Promise<HeroBanner[]> {
    const normalizedLimit = this.normalizeLimit(limit, DEFAULT_BANNER_LIMIT);
    const banners = await this.deps.adminService.listActiveBanners(referenceDate);
    return banners.slice(0, normalizedLimit);
  }

  async getFeaturedCourses(limit = DEFAULT_FEATURED_LIMIT): Promise<CourseMeta[]> {
    const normalizedLimit = this.normalizeLimit(limit, DEFAULT_FEATURED_LIMIT);
    const courses = await this.deps.academyService.getFeaturedCourses(normalizedLimit);
    return courses.slice(0, normalizedLimit);
  }

  private normalizeLimit(value: number | undefined, fallback: number): number {
    if (!Number.isFinite(value) || value === undefined) {
      return fallback;
    }
    const normalized = Math.floor(value);
    if (normalized <= 0) {
      return fallback;
    }
    return Math.min(normalized, MAX_LIMIT);
  }

  private mapRecommendations(items: RecommendedCourse[]): HubAcademyRecommendation[] {
    return items.map((item) => ({
      course: item.course,
      recommendation: item.recommendation,
    }));
  }

  private toHubHidraSummary(snapshot: HidraDashboardSnapshot): HubHidraSummary {
    return {
      totals: snapshot.totals,
      messageSummary: snapshot.messageSummary,
    } satisfies HubHidraSummary;
  }

  private dependencyLabel(index: number): string {
    switch (index) {
      case 0:
        return 'adminService.listActiveBanners';
      case 1:
        return 'academyService.getFeaturedCourses';
      case 2:
        return 'academyService.getRecommendedCourses';
      case 3:
        return 'hidraService.getDashboardSummary';
      case 4:
        return 'cybervaultService.getFeaturedResources';
      default:
        return 'unknown';
    }
  }

  private logDependencyFailure(dependency: string, reason: unknown): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const payload: Record<string, unknown> = {
      dependency,
      message: error.message,
    };
    if (reason instanceof AppError) {
      payload.code = reason.code;
      payload.statusCode = reason.statusCode;
    }
    this.logger.warn('HubService dependency failed', payload);
  }
}
