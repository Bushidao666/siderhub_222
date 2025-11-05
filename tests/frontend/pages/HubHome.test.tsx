import { screen, within, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ApiResponse } from '@shared/types/api.types';
import type { HubOverview } from '@shared/types/hub.types';
import type { CourseMeta, CourseRecommendation, CourseProgress } from '@shared/types/academy.types';
import { FeatureAccessKey, UserRole, Visibility, CourseStatus, ResourceType } from '@shared/types/common.types';
import { HubHome } from 'src/frontend/pages/Hub/Home';
import { renderWithProviders, resetAuthStore, setAuthenticatedUser } from '../test-utils';
import { server, http, HttpResponse } from '../setup/msw-server';

const successResponse = <T,>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

const course: CourseMeta = {
  id: 'course-1',
  slug: 'growth-neon',
  title: 'Growth Neon',
  subtitle: 'Estratégias avançadas',
  description: 'Growth focado em automações neon.',
  coverImage: null,
  level: 'intermediate',
  status: CourseStatus.Published,
  visibility: Visibility.Members,
  estimatedDurationMinutes: 180,
  totalLessons: 12,
  tags: ['automation', 'growth'],
  releaseDate: '2025-10-22T12:00:00Z',
  isFeatured: true,
  recommendationScore: 0.86,
  createdAt: '2025-10-01T12:00:00Z',
  updatedAt: '2025-10-15T12:00:00Z',
};

const recommendation: CourseRecommendation = {
  courseId: course.id,
  badge: 'popular',
  reason: 'Popular entre membros com campanhas ativas',
  createdAt: '2025-10-25T12:00:00Z',
  updatedAt: '2025-10-25T12:00:00Z',
};

const overview: HubOverview = {
  banners: [
    {
      id: 'banner-1',
      title: 'Bem-vindo ao Neon Hub',
      description: 'Campanhas, recursos e academia em um só lugar.',
      primaryCta: { label: 'Ver campanhas', href: '/hidra', external: false },
      secondaryCta: { label: 'Ver recursos', href: '/cybervault', external: false },
      imageUrl: 'https://cdn.test/banner.png',
      order: 1,
      status: 'active',
      startsAt: null,
      endsAt: null,
      createdBy: 'admin-1',
      createdAt: '2025-10-20T12:00:00Z',
      updatedAt: '2025-10-20T12:00:00Z',
    },
  ],
  academy: {
    featured: [course],
    recommendations: [
      {
        course,
        recommendation,
      },
    ],
  },
  hidra: {
    totals: {
      totalCampaigns: 12,
      running: 4,
      scheduled: 3,
      paused: 2,
      completed: 2,
      failed: 1,
    },
    messageSummary: {
      totalMessages: 1200,
      delivered: 1100,
      failed: 40,
      pending: 60,
      averageDeliveryMs: 950,
      lastUpdatedAt: '2025-11-03T10:00:00Z',
    },
  },
  cybervault: {
    featuredResources: [
      {
        id: 'resource-1',
        slug: 'playbook-neon',
        title: 'Playbook Neon Avançado',
        description: 'Checklist para campanhas neon de alta performance.',
        type: ResourceType.Playbook,
        categoryId: 'cat-1',
        tags: [{ id: 'tag-1', name: 'automation' }],
        thumbnailUrl: null,
        visibility: Visibility.Members,
        featured: true,
        downloadCount: 120,
        viewCount: 800,
        createdBy: 'author-1',
        createdAt: '2025-09-01T12:00:00Z',
        updatedAt: '2025-10-01T12:00:00Z',
        assets: [],
      },
    ],
  },
  generatedAt: '2025-11-03T10:05:00Z',
};

const progressByCourse: Record<string, CourseProgress> = {
  [course.id]: {
    courseId: course.id,
    userId: 'member-1',
    completedLessonIds: ['lesson-1', 'lesson-2', 'lesson-3'],
    percentage: 75,
    lastLessonId: 'lesson-3',
    updatedAt: '2025-11-03T09:00:00Z',
  },
};

describe('HubHome page', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('renders aggregated overview data with metrics, SaaS carousel and academy progress', async () => {
    server.use(
      http.get('/api/hub', () => HttpResponse.json(successResponse(overview))),
      http.get('/api/academy/courses/:courseId/progress', ({ params }) => {
        const { courseId } = params as { courseId: string };
        const progress = progressByCourse[courseId] ?? {
          courseId,
          userId: 'member-1',
          completedLessonIds: [],
          percentage: 0,
          lastLessonId: null,
          updatedAt: new Date().toISOString(),
        };
        return HttpResponse.json(successResponse(progress));
      }),
    );

    setAuthenticatedUser({
      user: {
        id: 'member-1',
        email: 'member@example.com',
        role: UserRole.Member,
        profile: {
          displayName: 'Member Test',
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
      accessMap: [
        { feature: FeatureAccessKey.Hidra, enabled: true, permissions: ['view'] },
        { feature: FeatureAccessKey.Cybervault, enabled: true, permissions: ['download'] },
        { feature: FeatureAccessKey.Academy, enabled: true, permissions: ['view'] },
      ],
    });

    renderWithProviders(<HubHome />);

    expect(await screen.findByTestId('hub-home')).toBeVisible();

    const banner = await screen.findByText('Bem-vindo ao Neon Hub');
    expect(banner).toBeInTheDocument();

    const carousel = await screen.findByTestId('hub-saas-carousel');
    expect(within(carousel).getByText('HIDRA')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('hub-metric-mensagens-totais')).toHaveTextContent(/1\.200/));
    expect(screen.getByTestId('hub-metric-entregues')).toHaveTextContent(/1\.100/);

    const academySection = await screen.findByText('Growth Neon');
    expect(academySection).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
    expect(screen.getByText(/Popular entre membros com campanhas ativas/)).toBeInTheDocument();
  });
});
