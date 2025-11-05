import type {
  LoginRequest,
  LoginResponse,
  MemberAccessMap,
  RefreshTokenResponse,
  SessionSummary,
  User,
  UserProfile,
} from '@shared/types';
import { FeatureAccessKey, UserRole } from '@shared/types';

const nowIso = () => new Date().toISOString();

const defaultProfile: UserProfile = {
  displayName: 'Member Test',
  avatarUrl: null,
  bio: null,
  timezone: 'UTC',
  badges: [],
  socialLinks: [],
};

export const createUser = (overrides: Partial<User> = {}): User => ({
  id: overrides.id ?? 'user-0001',
  email: overrides.email ?? 'member@example.com',
  role: overrides.role ?? UserRole.Member,
  profile: overrides.profile ?? defaultProfile,
  lastLoginAt: overrides.lastLoginAt ?? null,
  createdAt: overrides.createdAt ?? nowIso(),
  updatedAt: overrides.updatedAt ?? nowIso(),
});

export const createSession = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  id: overrides.id ?? 'session-0001',
  device: overrides.device ?? 'Web',
  ipAddress: overrides.ipAddress ?? '127.0.0.1',
  lastSeenAt: overrides.lastSeenAt ?? nowIso(),
  expiresAt: overrides.expiresAt ?? nowIso(),
  isCurrent: overrides.isCurrent ?? true,
});

export const createAccessMap = (overrides: Partial<MemberAccessMap> = {}): MemberAccessMap => ({
  feature: overrides.feature ?? FeatureAccessKey.Academy,
  enabled: overrides.enabled ?? true,
  permissions: overrides.permissions ?? [],
});

export const createLoginResponse = (overrides: Partial<LoginResponse> = {}): LoginResponse => ({
  user: overrides.user ?? createUser(),
  accessToken: overrides.accessToken ?? 'access-token',
  refreshToken: overrides.refreshToken ?? 'refresh-token',
  accessMap: overrides.accessMap ?? [createAccessMap()],
  activeSessions: overrides.activeSessions ?? [createSession()],
});

export const createLoginRequest = (overrides: Partial<LoginRequest> = {}): LoginRequest => ({
  email: overrides.email ?? 'member@example.com',
  password: overrides.password ?? 'Secret123!',
});

export const createRefreshTokenResponse = (
  overrides: Partial<RefreshTokenResponse> = {}
): RefreshTokenResponse => ({
  accessToken: overrides.accessToken ?? 'next-access-token',
  refreshToken: overrides.refreshToken ?? 'next-refresh-token',
});
