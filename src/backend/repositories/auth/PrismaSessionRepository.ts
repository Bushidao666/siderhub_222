import type { PrismaClient, Session as PrismaSession } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { SessionSummary } from '@shared/types/auth.types';
import type { CreateSessionInput, SessionRecord, SessionRepository } from './SessionRepository';

function toRecord(s: PrismaSession): SessionRecord {
  return {
    id: s.id as UUID,
    userId: s.userId as UUID,
    refreshTokenHash: s.refreshTokenHash,
    device: s.device,
    ipAddress: s.ipAddress,
    lastSeenAt: (s.lastUsedAt ?? s.createdAt).toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    isCurrent: false,
  };
}

function toSummary(s: PrismaSession): SessionSummary {
  return {
    id: s.id as UUID,
    device: s.device,
    ipAddress: s.ipAddress,
    lastSeenAt: (s.lastUsedAt ?? s.createdAt).toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    isCurrent: false,
  };
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSession(input: CreateSessionInput): Promise<SessionRecord> {
    const s = await this.prisma.session.create({
      data: {
        id: input.id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        device: 'unknown',
        expiresAt: new Date(input.expiresAt),
        lastUsedAt: new Date(),
      },
    });
    return toRecord(s);
  }

  async findById(sessionId: UUID): Promise<Nullable<SessionRecord>> {
    const s = await this.prisma.session.findUnique({ where: { id: sessionId } });
    return s ? toRecord(s) : null;
  }

  async findActiveByUser(userId: UUID): Promise<SessionSummary[]> {
    const now = new Date();
    const list = await this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return list.map(toSummary);
  }

  async updateRefreshToken(sessionId: UUID, refreshTokenHash: string, expiresAt: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash, expiresAt: new Date(expiresAt), lastUsedAt: new Date() },
    });
  }

  async invalidateSession(sessionId: UUID): Promise<void> {
    await this.prisma.session.delete({ where: { id: sessionId } });
  }

  async invalidateAllUserSessions(userId: UUID): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}

