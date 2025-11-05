import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  CourseMeta,
  HeroBanner,
  HidraDashboardTotals,
  HidraMessageSummary,
  HubAcademyRecommendation,
  HubOverview,
  Resource,
} from '@shared/types';
import { BannerStatus, CourseStatus, ResourceType, Visibility, UserRole } from '@shared/types';
import type { ApiResponse } from '@shared/types/api.types';
import { useHubData } from 'src/frontend/hooks/useHubData';
import { useAuthStore } from 'src/frontend/store/auth';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const HUB_BANNERS: HeroBanner[] = [
  {
    id: 'banner-1',
    title: 'Experimente o Hidra',
    description: 'Crie campanhas WhatsApp automatizadas',
    primaryCta: { label: 'Configurar', href: '/hidra', external: false },
    secondaryCta: { label: 'Saber mais', href: '/academy', external: false },
    imageUrl: '',
    order: 1,
    status: BannerStatus.Active,
    startsAt: new Date('2025-11-01T12:00:00Z').toISOString(),
    endsAt: null,
    createdBy: 'admin-1',
    createdAt: new Date('2025-10-30T15:00:00Z').toISOString(),
    updatedAt: new Date('2025-10-30T15:00:00Z').toISOString(),
  },
];

const FEATURED_COURSES: CourseMeta[] = [
  {
    id: 'course-1',
    slug: 'hidra-setup',
    title: 'Configuração do Hidra',
    subtitle: 'Integração com Evolution API',
    description: 'Aprenda a integrar o Hidra com Evolution API em 7 passos.',
    coverImage: null,
    level: 'beginner',
    status: CourseStatus.Published,
    visibility: Visibility.Members,
    estimatedDurationMinutes: 120,
    totalLessons: 12,
    tags: ['hidra', 'automation'],
    releaseDate: null,
    isFeatured: true,
    recommendationScore: 0.95,
    createdAt: new Date('2025-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2025-10-02T10:00:00Z').toISOString(),
  },
];

const RECOMMENDATIONS: HubAcademyRecommendation[] = [
  {
    course: FEATURED_COURSES[0],
    recommendation: {
      courseId: 'course-1',
      reason: 'based_on_activity',
    },
  },
];

const HIDRA_SUMMARY: HidraMessageSummary = {
  totalMessages: 1200,
  delivered: 980,
  failed: 20,
  pending: 200,
  averageDeliveryMs: 1450,
  lastUpdatedAt: new Date('2025-11-02T12:00:00Z').toISOString(),
};

const HIDRA_TOTALS: HidraDashboardTotals = {
  totalCampaigns: 5,
  running: 1,
  scheduled: 1,
  paused: 1,
  completed: 2,
  failed: 0,
};

const FEATURED_RESOURCES: Resource[] = [
  {
    id: 'resource-1',
    slug: 'playbook-neon',
    title: 'Playbook Neon',
    description: 'Checklist para campanhas neon.',
    type: ResourceType.Playbook,
    categoryId: 'cat-1',
    tags: [
      { id: 'tag-1', name: 'hidra' },
      { id: 'tag-2', name: 'automation' },
    ],
    thumbnailUrl: null,
    visibility: Visibility.Members,
    featured: true,
    downloadCount: 42,
    viewCount: 128,
    createdBy: 'author-1',
    createdAt: new Date('2025-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2025-10-02T10:00:00Z').toISOString(),
    assets: [
      {
        id: 'asset-1',
        resourceId: 'resource-1',
        fileUrl: 'https://cdn.siderhub.dev/resource.pdf',
        fileName: 'playbook-neon.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      },
    ],
  },
];

const HUB_OVERVIEW: HubOverview = {
  banners: HUB_BANNERS,
  academy: {
    featured: FEATURED_COURSES,
    recommendations: RECOMMENDATIONS,
  },
  hidra: {
    totals: HIDRA_TOTALS,
    messageSummary: HIDRA_SUMMARY,
  },
  cybervault: {
    featuredResources: FEATURED_RESOURCES,
  },
  generatedAt: new Date('2025-11-02T12:00:00Z').toISOString(),
};

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const resetAuthStore = () => {
  act(() => {
    useAuthStore.setState((state) => ({
      ...state,
      user: null,
      accessToken: null,
      refreshToken: null,
      accessMap: [],
      activeSessions: [],
      isAuthenticated: false,
      isLoading: false,
      lastError: null,
    }));
  });
};

const authenticate = () => {
  act(() => {
    useAuthStore.setState((state) => ({
      ...state,
      user: {
        id: 'user-1',
        email: 'member@example.com',
        role: UserRole.Member,
        profile: {
          displayName: 'Member',
          avatarUrl: null,
          bio: null,
          timezone: 'UTC',
          badges: [],
          socialLinks: [],
        },
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    }));
  });
};

beforeEach(() => {
  resetAuthStore();
});

afterEach(() => {
  queryClient?.clear();
  resetAuthStore();
});

describe('useHubData', () => {
  it('fetches hub data and exposes aggregated result', async () => {
    authenticate();

    server.use(
      http.get('/api/hub', () => HttpResponse.json(successResponse(HUB_OVERVIEW))),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useHubData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      banners: HUB_BANNERS,
      academy: {
        featured: FEATURED_COURSES,
        recommendations: RECOMMENDATIONS,
      },
      hidra: {
        totals: HIDRA_TOTALS,
        messageSummary: HIDRA_SUMMARY,
      },
      cybervault: {
        featuredResources: FEATURED_RESOURCES,
      },
      generatedAt: HUB_OVERVIEW.generatedAt,
    });
    expect(result.current.hasContent).toBe(true);
  });

  it('returns campaignMetrics null when metrics endpoint fails', async () => {
    authenticate();

    server.use(
      http.get('/api/hub', () =>
        HttpResponse.json({
          success: false,
          error: { code: 'HUB_OVERVIEW_PENDING', message: 'Aggregator not ready' },
          timestamp: new Date().toISOString(),
        }),
      ),
      http.get('/api/hub/banners', () => HttpResponse.json(successResponse(HUB_BANNERS))),
      http.get('/api/academy/courses/featured', () => HttpResponse.json(successResponse(FEATURED_COURSES))),
      http.get('/api/academy/courses/recommended', () =>
        HttpResponse.json(successResponse(RECOMMENDATIONS)),
      ),
      http.get('/api/hidra/campaigns/metrics/overview', () =>
        HttpResponse.json({
          success: false,
          error: { code: 'HIDRA_METRICS_UNAVAILABLE', message: 'Indisponível' },
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useHubData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.hidra.messageSummary).toBeNull();
    expect(result.current.data?.hidra.totals).toBeNull();
    expect(result.current.data?.cybervault.featuredResources).toEqual([]);
    expect(result.current.hasContent).toBe(true);
  });

  it('does not start requests when user is not authenticated', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useHubData(), { wrapper });

    expect(result.current.isFetched).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(result.current.hasContent).toBe(false);
  });
});
