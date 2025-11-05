import type { Prisma, PrismaClient, Invitation as PrismaInvitation, InvitationStatus as PrismaInvitationStatus, UserRole as PrismaUserRole, FeatureAccessKey as PrismaFeatureAccessKey } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { Invitation } from '@shared/types/auth.types';
import type { CreateInvitationRecord, InvitationRepository } from './InvitationRepository';
import type { ListInvitationFilters } from '@shared/types/admin.types';

function mapPrismaToInvitation(i: PrismaInvitation): Invitation {
  return {
    id: i.id as UUID,
    code: i.code,
    email: i.email,
    role: i.role as unknown as Invitation['role'],
    status: i.status as unknown as Invitation['status'],
    invitedBy: i.invitedById as UUID,
    grantedAccess: (i.grantedAccess as unknown as Invitation['grantedAccess']) ?? [],
    expiresAt: i.expiresAt.toISOString(),
    acceptedBy: (i.acceptedById as UUID) ?? null,
    acceptedAt: i.acceptedAt ? i.acceptedAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
  };
}

export class PrismaInvitationRepository implements InvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveByCode(code: string): Promise<Nullable<Invitation>> {
    const now = new Date();
    const i = await this.prisma.invitation.findFirst({
      where: { code, status: 'pending' as PrismaInvitationStatus, expiresAt: { gt: now } },
    });
    return i ? mapPrismaToInvitation(i) : null;
  }

  async markAsAccepted(invitationId: UUID, userId: UUID): Promise<void> {
    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'accepted', acceptedById: userId, acceptedAt: new Date() },
    });
  }

  async findPendingByEmail(email: string): Promise<Nullable<Invitation>> {
    const now = new Date();
    const i = await this.prisma.invitation.findFirst({
      where: { email, status: 'pending' as PrismaInvitationStatus, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    return i ? mapPrismaToInvitation(i) : null;
  }

  async create(input: CreateInvitationRecord): Promise<Invitation> {
    const i = await this.prisma.invitation.create({
      data: {
        code: input.code,
        email: input.email,
        role: input.role as unknown as PrismaUserRole,
        status: 'pending',
        invitedById: input.invitedBy,
        grantedAccess: input.grantedAccess as unknown as PrismaFeatureAccessKey[],
        expiresAt: new Date(input.expiresAt),
      },
    });
    return mapPrismaToInvitation(i);
  }

  async list(filters?: ListInvitationFilters): Promise<Invitation[]> {
    const where: Prisma.InvitationWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as PrismaInvitationStatus;
    }

    const search = filters?.search?.trim();
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const limit = filters?.limit && Number.isFinite(filters.limit)
      ? Math.max(1, Math.floor(filters.limit))
      : undefined;

    const list = await this.prisma.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return list.map(mapPrismaToInvitation);
  }
}
