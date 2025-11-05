import { FeatureAccessKey, Nullable, UserRole, UUID } from './common.types';

export interface UserProfile {
  displayName: string;
  avatarUrl: Nullable<string>;
  bio: Nullable<string>;
  timezone: string;
  badges: string[];
  socialLinks: Array<{
    provider: 'instagram' | 'youtube' | 'linkedin' | 'tiktok' | 'website';
    url: string;
  }>;
}

export interface User {
  id: UUID;
  email: string;
  role: UserRole;
  profile: UserProfile;
  lastLoginAt: Nullable<string>;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  id: UUID;
  device: string;
  ipAddress: string;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface MemberAccessMap {
  feature: FeatureAccessKey;
  enabled: boolean;
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  accessMap: MemberAccessMap[];
  activeSessions: SessionSummary[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  inviteCode: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutRequest {
  sessionId?: UUID;
}

export interface Invitation {
  id: UUID;
  code: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: UUID;
  grantedAccess: FeatureAccessKey[];
  expiresAt: string;
  acceptedBy: Nullable<UUID>;
  acceptedAt: Nullable<string>;
  createdAt: string;
}
