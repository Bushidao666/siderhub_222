import type { Nullable } from './common.types';
import type { HeroBanner } from './admin.types';
import type { CourseMeta, CourseRecommendation } from './academy.types';
import type { HidraDashboardTotals, HidraMessageSummary } from './hidra.types';
import type { Resource } from './cybervault.types';

export interface HubAcademyRecommendation {
  course: CourseMeta;
  recommendation: CourseRecommendation;
}

export interface HubHidraSummary {
  totals: HidraDashboardTotals;
  messageSummary: HidraMessageSummary;
}

export interface HubCybervaultSummary {
  featuredResources: Resource[];
}

export interface HubOverview {
  banners: HeroBanner[];
  academy: {
    featured: CourseMeta[];
    recommendations: HubAcademyRecommendation[];
  };
  hidra: Nullable<HubHidraSummary>;
  cybervault: HubCybervaultSummary;
  generatedAt: string;
}

export type HubOverviewPayload = HubOverview;
