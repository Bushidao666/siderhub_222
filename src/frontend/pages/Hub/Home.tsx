import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { colors, glows, typography } from '../../../shared/design/tokens';
import type { HeroBanner } from '../../../shared/types/admin.types';
import type { CourseMeta } from '../../../shared/types/academy.types';
import type { HubAcademyRecommendation } from '../../../shared/types/hub.types';
import { CourseStatus, FeatureAccessKey } from '../../../shared/types/common.types';
import type { CampaignOverview } from '../../hooks/useCampaignStats';
import { useCoursesProgressMap } from '../../hooks/useCourseProgress';
import { useHubData } from '../../hooks/useHubData';
import { AcademyHighlights } from '../../components/hub/AcademyHighlights';
import { HeroBanner as HeroBannerView } from '../../components/hub/HeroBanner';
import { HubMetricsOverview } from '../../components/hub/MetricsOverview';
import { SaaSCarousel, type SaaSCarouselItem } from '../../components/hub/SaaSCarousel';
import { selectAccessMap, selectIsAuthenticated, useAuthStore } from '../../store/auth';
import Login from '../Auth/Login';

const featureIcon = (f: FeatureAccessKey) => {
  switch (f) {
    case FeatureAccessKey.Hidra:
      return '🧪';
    case FeatureAccessKey.Cybervault:
      return '💾';
    case FeatureAccessKey.Academy:
      return '📚';
    case FeatureAccessKey.Admin:
      return '⚙️';
    case FeatureAccessKey.Community:
    default:
      return '👥';
  }
};

export const HubHome = () => {
  const hubQuery = useHubData();
  const { data } = hubQuery;
  const accessMap = useAuthStore(selectAccessMap);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const banner: HeroBanner | null = data?.banners?.[0] ?? null;
  const featuredCourses: CourseMeta[] = data?.academy.featured ?? [];
  const academyRecommendations: HubAcademyRecommendation[] = data?.academy.recommendations ?? [];
  const campaignSummary = data?.hidra.messageSummary ?? null;
  const courseIds = useMemo(() => featuredCourses.map((course) => course.id), [featuredCourses]);
  const { progressMap, isLoading: progressLoading } = useCoursesProgressMap(isAuthenticated ? courseIds : []);

  const campaignOverview = useMemo<CampaignOverview | null>(() => {
    if (!campaignSummary) {
      return null;
    }

    return {
      totalMessages: campaignSummary.totalMessages,
      delivered: campaignSummary.delivered,
      failed: campaignSummary.failed,
      pending: campaignSummary.pending,
      averageDeliveryMs: campaignSummary.averageDeliveryMs,
      lastUpdatedAt: campaignSummary.lastUpdatedAt ?? new Date().toISOString(),
    };
  }, [campaignSummary]);

  const saasItems: SaaSCarouselItem[] = useMemo(() => {
    return accessMap.map((a) => ({
      feature: a.feature,
      enabled: a.enabled,
      permissions: a.permissions,
      title: a.feature.toUpperCase(),
      description: a.enabled ? 'Acesso concedido ao módulo' : 'Ative para liberar este módulo',
      icon: <span aria-hidden>{featureIcon(a.feature)}</span>,
      status: a.enabled ? 'active' : 'locked',
      ctaLabel: a.enabled ? 'Abrir' : 'Ativar acesso',
    }));
  }, [accessMap]);

  const recommendationMap = useMemo(() => {
    return academyRecommendations.reduce<Map<string, HubAcademyRecommendation>>((map, item) => {
      map.set(item.course.id, item);
      return map;
    }, new Map());
  }, [academyRecommendations]);

  const academyItems = useMemo(() => {
    return featuredCourses.map((course) => ({
      course,
      progress: progressMap?.[course.id],
      recommendation: recommendationMap.get(course.id)?.recommendation,
      locked: course.status !== CourseStatus.Published,
    }));
  }, [featuredCourses, progressMap, recommendationMap]);

  const academyLoading = hubQuery.isLoading || progressLoading;
  const metricsLoading = hubQuery.isLoading && !campaignOverview;

  if (!isAuthenticated) {
    return (
      <main
        data-testid="hub-home"
        className="container mx-auto flex max-w-[var(--container-2xl)] flex-col gap-10 px-6 py-8"
        style={{ '--container-2xl': '1440px' } as CSSProperties}
      >
        <header className="space-y-1">
          <h1
            className="text-3xl uppercase tracking-[0.14em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.text }}
          >
            Blacksider Hub
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Seu ponto central para cursos, ferramentas e recursos.
          </p>
        </header>

        <section
          className="rounded-3xl border border-[var(--lock-border)] bg-[var(--lock-bg)] p-10 text-center"
          style={{
            '--lock-border': colors.borderPrimary,
            '--lock-bg': colors.bgSecondary,
            color: colors.textSecondary,
          } as CSSProperties}
        >
          <p className="text-lg uppercase tracking-[0.12em]" style={{ fontFamily: typography.fontHeading }}>
            Faça login para desbloquear o Hub neon.
          </p>
        </section>

        <div className="mt-2">
          <Login />
        </div>
      </main>
    );
  }

  return (
    <main
      data-testid="hub-home"
      className="container mx-auto flex max-w-[var(--container-2xl)] flex-col gap-10 px-6 py-8"
      style={{ '--container-2xl': '1440px' } as CSSProperties}
    >
      <header className="space-y-1">
        <h1
          className="text-3xl uppercase tracking-[0.14em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.text }}
        >
          Blacksider Hub
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Seu ponto central para cursos, ferramentas e recursos.
        </p>
      </header>

      {banner ? <HeroBannerView banner={banner} /> : null}

      {saasItems.length ? <SaaSCarousel items={saasItems} /> : null}

      <section className="space-y-4">
        <h2
          className="text-2xl uppercase tracking-[0.16em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Hidra — visão rápida
        </h2>
        <HubMetricsOverview metrics={campaignOverview} loading={metricsLoading} />
      </section>

      <section className="space-y-4">
        <h2
          className="text-2xl uppercase tracking-[0.16em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Academia
        </h2>
        <AcademyHighlights items={academyItems} loading={academyLoading} />
      </section>
    </main>
  );
};

export default HubHome;
