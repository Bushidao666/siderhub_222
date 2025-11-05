import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { PaginatedResponse, UUID } from '@shared/types';
import type {
  CreateInvitationParams,
  AdminDashboardMetric,
  AdminDashboardPayload,
  FeatureToggle,
  HeroBanner,
  ListInvitationFilters,
  MemberAccessOverride,
} from '@shared/types/admin.types';
import type { AdminMemberItem } from '@shared/types/admin.types';
import type { Invitation, User } from '@shared/types/auth.types';
import { BannerStatus, FeatureAccessKey, UserRole } from '@shared/types/common.types';
import { bannerSchema, emailSchema } from '@utils/validation';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';
import { createLogger } from '../../logger';
import type { BannerRepository, FeatureToggleRepository, MemberAccessOverrideRepository } from '../../repositories/admin';
import type { InvitationRepository, MemberAccessRepository, UserListResult, UserRepository } from '../../repositories/auth';

const createBannerSchema = bannerSchema.extend({
  order: z.number().int().min(0).max(100).default(0),
  createdBy: z.string().uuid(),
});

const updateBannerSchema = bannerSchema.extend({
  order: z.number().int().min(0).max(100).optional(),
  updatedBy: z.string().uuid(),
});

const updateFeatureToggleSchema = z.object({
  status: z.enum(['enabled', 'disabled', 'gradual']),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
});

const setAccessOverrideSchema = z.object({
  userId: z.string().uuid(),
  feature: z.nativeEnum(FeatureAccessKey),
  enabled: z.boolean(),
  permissions: z.array(z.string().min(1)).max(20),
  grantedBy: z.string().uuid().optional(),
  reason: z.string().min(3).max(160).optional(),
});

const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.nativeEnum(UserRole),
  grantedAccess: z.array(z.nativeEnum(FeatureAccessKey)).max(12).default([]),
  expiresAt: z.string().datetime(),
  invitedBy: z.string().uuid(),
  templateId: z.string().uuid().nullable().optional(),
  sendEmail: z.boolean().optional(),
});

const listInvitationsSchema = z
  .object({
    status: z.enum(['pending', 'accepted', 'expired']).optional(),
    search: z.string().min(2).max(160).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .partial();

export interface AdminServiceDeps {
  bannerRepository: BannerRepository;
  featureToggleRepository: FeatureToggleRepository;
  memberAccessOverrideRepository: MemberAccessOverrideRepository;
  invitationRepository: InvitationRepository;
  userRepository: UserRepository;
  memberAccessRepository: MemberAccessRepository;
  logger?: Logger;
  now?: () => Date;
  inviteCodeGenerator?: () => string;
}

export type CreateBannerParams = z.infer<typeof createBannerSchema>;
export type UpdateBannerParams = z.infer<typeof updateBannerSchema>;

export class AdminService {
  private readonly logger: Logger;
  private readonly now: () => Date;
  private readonly inviteCodeGenerator: () => string;

  constructor(private readonly deps: AdminServiceDeps) {
    this.logger = deps.logger ?? createLogger('AdminService');
    this.now = deps.now ?? (() => new Date());
    this.inviteCodeGenerator = deps.inviteCodeGenerator ?? this.buildDefaultInviteCode;
  }

  async listMembers(filters?: {
    page?: number;
    pageSize?: number;
    role?: UserRole;
    search?: string;
  }): Promise<PaginatedResponse<AdminMemberItem>> {
    const schema = z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        role: z.nativeEnum(UserRole).optional(),
        search: z.string().min(2).max(160).optional(),
      })
      .default({});
    const payload = schema.parse(filters ?? {});

    const result: UserListResult = await this.deps.userRepository.list({
      page: payload.page,
      pageSize: payload.pageSize,
      role: payload.role,
      search: payload.search,
    });

    const items: AdminMemberItem[] = await Promise.all(
      result.items.map(async (user: User) => ({
        user,
        accessMap: await this.deps.memberAccessRepository.getAccessMapByUser(user.id),
      })),
    );

    const totalPages = payload.pageSize === 0 ? 0 : Math.ceil(result.totalItems / payload.pageSize);
    return {
      items,
      page: payload.page,
      pageSize: payload.pageSize,
      totalItems: result.totalItems,
      totalPages,
    } satisfies PaginatedResponse<AdminMemberItem>;
  }

  async listBanners(): Promise<HeroBanner[]> {
    return this.deps.bannerRepository.list();
  }

  async listActiveBanners(referenceDate?: string): Promise<HeroBanner[]> {
    const reference = referenceDate ? new Date(referenceDate) : this.now();
    const banners = await this.deps.bannerRepository.list();
    return banners
      .filter((banner) => this.isBannerActive(banner, reference))
      .sort((a, b) => a.order - b.order);
  }

  async createBanner(input: CreateBannerParams): Promise<HeroBanner> {
    const payload = createBannerSchema.parse(input);
    const created = await this.deps.bannerRepository.create({
      title: payload.title,
      description: payload.description,
      primaryCta: payload.primaryCta,
      secondaryCta: payload.secondaryCta ?? null,
      imageUrl: payload.imageUrl,
      status: payload.status as HeroBanner['status'],
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      order: payload.order,
      createdBy: payload.createdBy as UUID,
    });
    this.logger.info('Banner created', { bannerId: created.id, createdBy: payload.createdBy });
    return created;
  }

  async updateBanner(id: UUID, input: UpdateBannerParams): Promise<HeroBanner> {
    const payload = updateBannerSchema.parse(input);
    if (!payload.startsAt && payload.endsAt) {
      throw new AppError({ code: 'ADMIN_BANNER_INVALID_SCHEDULE', message: 'Banner com término precisa de data inicial', statusCode: 400 });
    }

    const updated = await this.deps.bannerRepository.update(id, {
      title: payload.title,
      description: payload.description,
      primaryCta: payload.primaryCta,
      secondaryCta: payload.secondaryCta ?? null,
      imageUrl: payload.imageUrl,
      status: payload.status as HeroBanner['status'],
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      order: payload.order ?? 0,
      updatedBy: payload.updatedBy as UUID,
    });

    this.logger.info('Banner updated', { bannerId: updated.id, updatedBy: payload.updatedBy });
    return updated;
  }

  async deleteBanner(id: UUID): Promise<{ ok: true }> {
    await this.deps.bannerRepository.remove(id);
    this.logger.info('Banner removed', { bannerId: id });
    return { ok: true } as const;
  }

  async getFeatureToggles(): Promise<FeatureToggle[]> {
    return this.deps.featureToggleRepository.list();
  }

  async updateFeatureToggle(id: UUID, status: FeatureToggle['status'], rolloutPercentage?: number): Promise<FeatureToggle> {
    const payload = updateFeatureToggleSchema.parse({ status, rolloutPercentage });
    if (payload.status !== 'gradual' && payload.rolloutPercentage !== undefined) {
      throw new AppError({ code: 'ADMIN_TOGGLE_ROLLOUT_INVALID', message: 'Rollout só permitido para toggles graduais', statusCode: 400 });
    }
    return this.deps.featureToggleRepository.updateStatus(id, payload.status, payload.rolloutPercentage);
  }

  async listInvitations(filters?: ListInvitationFilters): Promise<Invitation[]> {
    const parsed = listInvitationsSchema.parse(filters ?? {});
    const normalized = {
      ...parsed,
      limit: parsed.limit ?? 50,
    } satisfies ListInvitationFilters;

    return this.deps.invitationRepository.list(normalized);
  }

  async createInvitation(input: CreateInvitationParams): Promise<Invitation> {
    const payload = createInvitationSchema.parse(input);

    const expiration = new Date(payload.expiresAt);
    if (Number.isNaN(expiration.getTime()) || expiration <= this.now()) {
      throw new AppError({ code: 'ADMIN_INVITE_INVALID_EXPIRY', message: 'Data de expiração inválida', statusCode: 400 });
    }

    const existing = await this.deps.invitationRepository.findPendingByEmail(payload.email);
    if (existing) {
      throw new AppError({ code: 'ADMIN_INVITE_DUPLICATE', message: 'Já existe convite pendente para este e-mail', statusCode: 409 });
    }

    const invitation = await this.deps.invitationRepository.create({
      ...payload,
      code: this.inviteCodeGenerator(),
    });

    this.logger.info('Invitation created', {
      invitationId: invitation.id,
      invitedBy: payload.invitedBy,
      sendEmail: payload.sendEmail ?? false,
    });

    return invitation;
  }

  async setAccessOverride(
    userId: UUID,
    feature: FeatureAccessKey,
    enabled: boolean,
    permissions: string[],
    options?: { grantedBy?: UUID; reason?: string },
  ): Promise<MemberAccessOverride> {
    const payload = setAccessOverrideSchema.parse({
      userId,
      feature,
      enabled,
      permissions,
      grantedBy: options?.grantedBy ?? userId,
      reason: options?.reason,
    });

    const override = await this.deps.memberAccessOverrideRepository.setOverride({
      userId: payload.userId,
      feature: payload.feature,
      enabled: payload.enabled,
      permissions: payload.permissions,
      grantedBy: payload.grantedBy as UUID,
      reason: payload.reason,
    });

    this.logger.info('Access override set', {
      userId: payload.userId,
      feature: payload.feature,
      grantedBy: payload.grantedBy,
    });

    return override;
  }

  async removeAccessOverride(userId: UUID, feature: FeatureAccessKey): Promise<{ ok: true }> {
    await this.deps.memberAccessOverrideRepository.removeOverride(userId, feature);
    this.logger.info('Access override removed', { userId, feature });
    return { ok: true } as const;
  }

  async getDashboardOverview(): Promise<AdminDashboardPayload> {
    const [activeBanners, featureToggles, pendingInvitations, latestInvitations] = await Promise.all([
      this.listActiveBanners(),
      this.deps.featureToggleRepository.list(),
      this.deps.invitationRepository.list({ status: 'pending', limit: 100 }),
      this.deps.invitationRepository.list({ limit: 5 }),
    ]);

    const metrics: AdminDashboardMetric[] = [
      {
        id: 'banners-active',
        label: 'Banners ativos',
        value: activeBanners.length,
        description: 'Hero banners publicados/agendados no Hub.',
      },
      {
        id: 'feature-toggles',
        label: 'Feature toggles',
        value: featureToggles.length,
        description: 'Total de toggles configurados no painel.',
      },
      {
        id: 'pending-invitations',
        label: 'Convites pendentes',
        value: pendingInvitations.length,
        description: 'Convites aguardando aceite pelos membros.',
      },
    ];

    const upcomingTasks = [
      pendingInvitations.length > 0
        ? `Revisar ${pendingInvitations.length} convite(s) pendente(s).`
        : 'Nenhum convite pendente — manter cadência de convites.',
      featureToggles.some((toggle) => toggle.status === 'gradual')
        ? 'Monitorar rollout dos toggles em modo gradual.'
        : 'Planejar próximos toggles ou revisões de acesso.',
      activeBanners.length < 3
        ? 'Adicionar novos banners para manter o Hub atualizado.'
        : 'Revisar calendário dos banners ativos/agendados.',
    ];

    const recentActivities = latestInvitations.slice(0, 5).map((invitation) => {
      const createdAt = new Date(invitation.createdAt).toISOString();
      return `Convite ${invitation.status} para ${invitation.email} (${createdAt}).`;
    });

    return {
      metrics,
      upcomingTasks,
      recentActivities,
      generatedAt: this.now().toISOString(),
    };
  }

  private buildDefaultInviteCode(): string {
    return randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  }

  private isBannerActive(banner: HeroBanner, reference: Date): boolean {
    if (banner.status === BannerStatus.Inactive) {
      return false;
    }

    const startsAt = banner.startsAt ? new Date(banner.startsAt) : null;
    const endsAt = banner.endsAt ? new Date(banner.endsAt) : null;

    if (startsAt && reference < startsAt) {
      return false;
    }
    if (endsAt && reference > endsAt) {
      return false;
    }

    return banner.status === BannerStatus.Active || banner.status === BannerStatus.Scheduled;
  }
}
