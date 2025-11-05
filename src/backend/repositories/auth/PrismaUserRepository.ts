import type { PrismaClient, User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import type { Nullable, User, UUID } from '@shared/types';
import type { UserProfile } from '@shared/types/auth.types';
import type { CreateUserInput, UserListQuery, UserListResult, UserRepository, UserWithSecrets } from './UserRepository';

function mapPrismaToUserProfile(u: PrismaUser): UserProfile {
  const socialLinks = (u.profileSocialLinks as unknown as UserProfile['socialLinks']) ?? [];
  return {
    displayName: u.profileDisplayName,
    avatarUrl: u.profileAvatarUrl ?? null,
    bio: u.profileBio ?? null,
    timezone: u.profileTimezone,
    badges: u.profileBadges ?? [],
    socialLinks,
  };
}

function mapPrismaToUser(u: PrismaUser): UserWithSecrets {
  const user: User = {
    id: u.id as UUID,
    email: u.email,
    role: u.role as unknown as User['role'],
    profile: mapPrismaToUserProfile(u),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
  return { ...user, passwordHash: u.passwordHash };
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<Nullable<UserWithSecrets>> {
    const u = await this.prisma.user.findUnique({ where: { email } });
    return u ? mapPrismaToUser(u) : null;
  }

  async findById(userId: UUID): Promise<Nullable<UserWithSecrets>> {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    return u ? mapPrismaToUser(u) : null;
  }

  async createUser(input: CreateUserInput): Promise<UserWithSecrets> {
    const u = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role as unknown as PrismaUserRole,
        profileDisplayName: input.profile.displayName,
        profileAvatarUrl: input.profile.avatarUrl,
        profileBio: input.profile.bio,
        profileTimezone: input.profile.timezone,
        profileBadges: input.profile.badges,
        profileSocialLinks: input.profile.socialLinks as unknown as object,
      },
    });
    return mapPrismaToUser(u);
  }

  async updateLastLoginAt(userId: UUID, timestamp: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(timestamp) },
    });
  }

  async list(query: UserListQuery): Promise<UserListResult> {
    const where: Record<string, unknown> = {};
    if (query.role) {
      // Prisma enum value matches our UserRole values
      (where as any).role = query.role as unknown as PrismaUserRole; // constrained by schema
    }
    if (query.search) {
      (where as any).OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { profileDisplayName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [rows, totalItems] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: query.pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows.map(mapPrismaToUser),
      totalItems,
    } satisfies UserListResult;
  }
}
