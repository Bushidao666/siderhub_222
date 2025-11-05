import type { Nullable, UUID } from '@shared/types';
import type { SessionSummary } from '@shared/types/auth.types';

export interface SessionRecord extends SessionSummary {
  refreshTokenHash: string;
  userId: UUID;
}

export interface CreateSessionInput {
  id?: UUID;
  userId: UUID;
  refreshTokenHash: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: string;
}

export interface SessionRepository {
  createSession(input: CreateSessionInput): Promise<SessionRecord>;
  findById(sessionId: UUID): Promise<Nullable<SessionRecord>>;
  findActiveByUser(userId: UUID): Promise<SessionSummary[]>;
  updateRefreshToken(sessionId: UUID, refreshTokenHash: string, expiresAt: string): Promise<void>;
  invalidateSession(sessionId: UUID): Promise<void>;
  invalidateAllUserSessions(userId: UUID): Promise<void>;
}
