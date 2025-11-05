import { BannerStatus, FeatureAccessKey, Nullable, UserRole, UUID, Visibility } from './common.types';
import type { CommentModerationStatus } from './academy.types';
import type { MemberAccessMap, User } from './auth.types';

export interface HeroBanner {
  id: UUID;
  title: string;
  description: string;
  primaryCta: BannerCta;
  secondaryCta: Nullable<BannerCta>;
  imageUrl: string;
  order: number;
  status: BannerStatus;
  startsAt: Nullable<string>;
  endsAt: Nullable<string>;
  createdBy: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface BannerCta {
  label: string;
  href: string;
  external: boolean;
}

export interface FeatureToggle {
  id: UUID;
  featureKey: string;
  description: string;
  status: 'enabled' | 'disabled' | 'gradual';
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemberAccessOverride {
  id: UUID;
  userId: UUID;
  feature: string;
  enabled: boolean;
  permissions: string[];
  reason: string;
  grantedBy: UUID;
  grantedAt: string;
}

export interface InvitationTemplate {
  id: UUID;
  name: string;
  subject: string;
  bodyMarkdown: string;
  visibility: Visibility;
  createdAt: string;
}

export interface CreateInvitationParams {
  email: string;
  role: UserRole;
  grantedAccess: FeatureAccessKey[];
  expiresAt: string;
  invitedBy: UUID;
  templateId?: Nullable<UUID>;
  sendEmail?: boolean;
}

export interface ListInvitationFilters {
  status?: 'pending' | 'accepted' | 'expired';
  search?: string;
  limit?: number;
}

export interface AdminDashboardMetric {
  id: string;
  label: string;
  value: number;
  description: string;
}

export interface AdminDashboardPayload {
  metrics: AdminDashboardMetric[];
  upcomingTasks: string[];
  recentActivities: string[];
  generatedAt: Nullable<string>;
}

export type CommentModerationEntityType = 'comment' | 'reply';

export interface CommentModerationItem {
  id: UUID;
  entityId: UUID;
  commentId: UUID;
  lessonId: UUID;
  courseId: UUID;
  lessonTitle: string;
  courseTitle: string;
  userId: UUID;
  userDisplayName: string;
  body: string;
  createdAt: string;
  pendingModeration: boolean;
  moderationStatus: CommentModerationStatus;
  moderatedById: Nullable<UUID>;
  moderatedAt: Nullable<string>;
  type: CommentModerationEntityType;
  depth: number;
}

// Admin Members listing item
export interface AdminMemberItem {
  user: User;
  accessMap: MemberAccessMap[];
}
