import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  type CourseMeta,
  type HeroBanner,
  type HidraDashboardTotals,
  type HidraMessageSummary,
  type HubAcademyRecommendation,
  type HubOverview,
  type Resource,
} from '../../shared/types';
import { ApiClient } from '../../shared/utils/apiClient';
import { assertSuccess } from '../../shared/utils/errorHandler';
import { queryKeys } from '../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../store/auth';

interface HubDataResult {
  banners: HeroBanner[];
  academy: {
    featured: CourseMeta[];
    recommendations: HubAcademyRecommendation[];
  };
  hidra: {
    totals: HidraDashboardTotals | null;
    messageSummary: HidraMessageSummary | null;
  };
  cybervault: {
    featuredResources: Resource[];
  };
  generatedAt: string | null;
}

const hubApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

const fetchHubData = async (): Promise<HubDataResult> => {
  const overviewResponse = await hubApiClient.get<HubOverview>('/hub');
  if (overviewResponse.success === true) {
    const { banners, academy, hidra, cybervault, generatedAt } = overviewResponse.data;
    return {
      banners,
      academy: {
        featured: academy.featured,
        recommendations: academy.recommendations,
      },
      hidra: {
        totals: hidra?.totals ?? null,
        messageSummary: hidra?.messageSummary ?? null,
      },
      cybervault: {
        featuredResources: cybervault.featuredResources,
      },
      generatedAt,
    };
  }

  // Fallback for environments onde o agregador ainda não está disponível.
  const [bannersRes, featuredRes, recommendedRes, metricsRes] = await Promise.all([
    hubApiClient.get<HeroBanner[]>('/hub/banners?status=active'),
    hubApiClient.get<CourseMeta[]>('/academy/courses/featured'),
    hubApiClient.get<HubAcademyRecommendation[]>('/academy/courses/recommended'),
    hubApiClient.get<HidraMessageSummary>('/hidra/campaigns/metrics/overview'),
  ]);

  assertSuccess<HeroBanner[]>(bannersRes);
  assertSuccess<CourseMeta[]>(featuredRes);
  const recommendations = recommendedRes.success === true ? recommendedRes.data : [];

  return {
    banners: bannersRes.data,
    academy: {
      featured: featuredRes.data,
      recommendations,
    },
    hidra: {
      totals: null,
      messageSummary: metricsRes.success === true ? metricsRes.data : null,
    },
    cybervault: {
      featuredResources: [],
    },
    generatedAt: null,
  };
};

export const useHubData = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const query = useQuery({
    queryKey: queryKeys.hub.dashboard(),
    queryFn: fetchHubData,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const hasContent = useMemo(() => {
    if (!query.data) return false;
    const {
      banners,
      academy: { featured, recommendations },
      cybervault: { featuredResources },
    } = query.data;
    return (
      banners.length > 0 ||
      featured.length > 0 ||
      recommendations.length > 0 ||
      featuredResources.length > 0
    );
  }, [query.data]);

  return {
    ...query,
    hasContent,
  };
};
