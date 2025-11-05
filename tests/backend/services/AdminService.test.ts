import type { HeroBanner, FeatureToggle, Invitation, MemberAccessOverride } from '@shared/types';
import { BannerStatus, FeatureAccessKey, UserRole } from '@shared/types';
import type { UUID } from '@shared/types';
import { AdminService } from 'src/backend/services/admin/AdminService';

type LoggerMock = {
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
};

type Repositories = {
  bannerRepository: {
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  featureToggleRepository: {
    list: jest.Mock;
    updateStatus: jest.Mock;
  };
  memberAccessOverrideRepository: {
    setOverride: jest.Mock;
    removeOverride: jest.Mock;
  };
  invitationRepository: {
    list: jest.Mock;
    create: jest.Mock;
    findPendingByEmail: jest.Mock;
  };
  userRepository: {
    findById: jest.Mock;
    findByEmail: jest.Mock;
    createUser: jest.Mock;
    updateLastLoginAt: jest.Mock;
    list: jest.Mock;
  };
  memberAccessRepository: {
    findByUserId: jest.Mock;
    listByFeature: jest.Mock;
    upsertAccess: jest.Mock;
  };
};

const uuid = (value: string) => value as UUID;

const createLoggerMock = (): LoggerMock => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const FIXED_NOW = new Date('2025-11-01T00:00:00Z');

const createService = (
  options?: { overrides?: Partial<Repositories>; now?: () => Date; inviteCodeGenerator?: () => string },
) => {
  const repositories: Repositories = {
    bannerRepository: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    featureToggleRepository: {
      list: jest.fn(),
      updateStatus: jest.fn(),
    },
    memberAccessOverrideRepository: {
      setOverride: jest.fn(),
      removeOverride: jest.fn(),
    },
    invitationRepository: {
      list: jest.fn(),
      create: jest.fn(),
      findPendingByEmail: jest.fn(),
    },
    userRepository: {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      updateLastLoginAt: jest.fn(),
      list: jest.fn(),
    },
    memberAccessRepository: {
      findByUserId: jest.fn(),
      listByFeature: jest.fn(),
      upsertAccess: jest.fn(),
    },
    ...(options?.overrides ?? {}),
  };
  const logger = createLoggerMock();
  const service = new AdminService({
    bannerRepository: repositories.bannerRepository as any,
    featureToggleRepository: repositories.featureToggleRepository as any,
    memberAccessOverrideRepository: repositories.memberAccessOverrideRepository as any,
    invitationRepository: repositories.invitationRepository as any,
    userRepository: repositories.userRepository as any,
    memberAccessRepository: repositories.memberAccessRepository as any,
    logger,
    now: options?.now ?? (() => FIXED_NOW),
    inviteCodeGenerator: options?.inviteCodeGenerator,
  });

  return { service, ...repositories, logger };
};

const buildBanner = (overrides: Partial<HeroBanner> = {}): HeroBanner => ({
  id: uuid('11111111-1111-4111-8111-111111111111'),
  title: 'Hero 1',
  description: 'Descrição completa do banner',
  primaryCta: { label: 'Acessar', href: 'https://app.siderhub.dev/hub', external: false },
  secondaryCta: null,
  imageUrl: 'https://cdn.example.com/hero.png',
  order: 1,
  status: BannerStatus.Active,
  startsAt: '2025-11-01T10:00:00Z',
  endsAt: null,
  createdBy: uuid('22222222-2222-4222-8222-222222222222'),
  createdAt: '2025-11-01T09:00:00Z',
  updatedAt: '2025-11-01T09:00:00Z',
  ...overrides,
});

const buildToggle = (overrides: Partial<FeatureToggle> = {}): FeatureToggle => ({
  id: uuid('33333333-3333-4333-8333-333333333333'),
  featureKey: 'hidra.beta',
  description: 'Habilita novas métricas',
  status: 'enabled',
  rolloutPercentage: 100,
  createdAt: '2025-11-01T09:00:00Z',
  updatedAt: '2025-11-01T09:00:00Z',
  ...overrides,
});

const buildOverride = (overrides: Partial<MemberAccessOverride> = {}): MemberAccessOverride => ({
  id: uuid('44444444-4444-4444-8444-444444444444'),
  userId: uuid('55555555-5555-4555-8555-555555555555'),
  feature: FeatureAccessKey.Hidra,
  enabled: true,
  permissions: ['view', 'trigger'],
  reason: 'Líder de campanha',
  grantedBy: uuid('66666666-6666-4666-8666-666666666666'),
  grantedAt: '2025-11-01T10:00:00Z',
  ...overrides,
});

const buildInvitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  id: uuid('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'),
  code: 'INVITE123456',
  email: 'guest@example.com',
  role: UserRole.Member,
  status: 'pending',
  invitedBy: uuid('99999999-9999-4999-8999-999999999999'),
  grantedAccess: [FeatureAccessKey.Hidra],
  expiresAt: '2025-12-01T00:00:00Z',
  acceptedBy: null,
  acceptedAt: null,
  createdAt: '2025-11-01T09:30:00Z',
  ...overrides,
});

describe('AdminService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists hero banners using repository result', async () => {
    const { service, bannerRepository } = createService();
    const banners = [buildBanner({ id: uuid('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') })];
    bannerRepository.list.mockResolvedValue(banners);

    await expect(service.listBanners()).resolves.toEqual(banners);
    expect(bannerRepository.list).toHaveBeenCalledTimes(1);
  });

  it('creates banner with validated payload and logs action', async () => {
    const { service, bannerRepository, logger } = createService();
    const createdBanner = buildBanner({ order: 2 });
    bannerRepository.create.mockResolvedValue(createdBanner);

    const result = await service.createBanner({
      title: createdBanner.title,
      description: createdBanner.description,
      primaryCta: createdBanner.primaryCta,
      secondaryCta: { label: 'Ver detalhes', href: 'https://app.siderhub.dev/admin/banners', external: false },
      imageUrl: createdBanner.imageUrl,
      status: createdBanner.status,
      startsAt: createdBanner.startsAt,
      endsAt: null,
      order: createdBanner.order,
      createdBy: createdBanner.createdBy,
    });

    expect(bannerRepository.create).toHaveBeenCalledWith({
      title: createdBanner.title,
      description: createdBanner.description,
      primaryCta: createdBanner.primaryCta,
      secondaryCta: { label: 'Ver detalhes', href: 'https://app.siderhub.dev/admin/banners', external: false },
      imageUrl: createdBanner.imageUrl,
      status: createdBanner.status,
      startsAt: createdBanner.startsAt,
      endsAt: null,
      order: createdBanner.order,
      createdBy: createdBanner.createdBy,
    });
    expect(logger.info).toHaveBeenCalledWith('Banner created', {
      bannerId: createdBanner.id,
      createdBy: createdBanner.createdBy,
    });
    expect(result).toBe(createdBanner);
  });

  it('throws when banner end date is provided without start date on update', async () => {
    const { service, bannerRepository } = createService();
    bannerRepository.update.mockResolvedValue(buildBanner());

    await expect(
      service.updateBanner(uuid('77777777-7777-4777-8777-777777777777'), {
        title: 'Atualizado',
        description: 'Descrição válida do banner',
        primaryCta: { label: 'Ir', href: 'https://app.siderhub.dev/hub', external: false },
        imageUrl: 'https://cdn.example.com/banner.png',
        status: BannerStatus.Inactive,
        startsAt: null,
        endsAt: '2025-12-31T23:59:00Z',
        updatedBy: uuid('88888888-8888-4888-8888-888888888888'),
      }),
    ).rejects.toMatchObject({ code: 'ADMIN_BANNER_INVALID_SCHEDULE' });
    expect(bannerRepository.update).not.toHaveBeenCalled();
  });

  it('updates banner and coerces optional values', async () => {
    const { service, bannerRepository, logger } = createService();
    const updatedBanner = buildBanner({
      id: uuid('99999999-9999-4999-8999-999999999999'),
      order: 7,
      status: BannerStatus.Scheduled,
    });
    bannerRepository.update.mockResolvedValue(updatedBanner);

    const payload = {
      title: updatedBanner.title,
      description: updatedBanner.description,
      primaryCta: updatedBanner.primaryCta,
      imageUrl: updatedBanner.imageUrl,
      status: updatedBanner.status,
      startsAt: updatedBanner.startsAt,
      endsAt: updatedBanner.endsAt,
      order: updatedBanner.order,
      updatedBy: uuid('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    };

    const result = await service.updateBanner(updatedBanner.id, payload);

    expect(bannerRepository.update).toHaveBeenCalledWith(updatedBanner.id, {
      ...payload,
      secondaryCta: null,
      order: updatedBanner.order,
      updatedBy: payload.updatedBy,
    });
    expect(logger.info).toHaveBeenCalledWith('Banner updated', {
      bannerId: updatedBanner.id,
      updatedBy: payload.updatedBy,
    });
    expect(result).toBe(updatedBanner);
  });

  it('removes banner and confirms ok', async () => {
    const { service, bannerRepository } = createService();

    const response = await service.deleteBanner(uuid('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'));

    expect(bannerRepository.remove).toHaveBeenCalledWith(uuid('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'));
    expect(response).toEqual({ ok: true });
  });

  it('returns feature toggles from repository', async () => {
    const { service, featureToggleRepository } = createService();
    const toggles = [buildToggle({ status: 'gradual', rolloutPercentage: 25 })];
    featureToggleRepository.list.mockResolvedValue(toggles);

    await expect(service.getFeatureToggles()).resolves.toEqual(toggles);
    expect(featureToggleRepository.list).toHaveBeenCalledTimes(1);
  });

  it('updates feature toggle rollout when gradual', async () => {
    const { service, featureToggleRepository } = createService();
    const toggle = buildToggle({ status: 'gradual', rolloutPercentage: 40 });
    featureToggleRepository.updateStatus.mockResolvedValue(toggle);

    const result = await service.updateFeatureToggle(toggle.id, 'gradual', 40);

    expect(featureToggleRepository.updateStatus).toHaveBeenCalledWith(toggle.id, 'gradual', 40);
    expect(result).toBe(toggle);
  });

  it('throws when rollout percentage provided for non-gradual toggle', async () => {
    const { service, featureToggleRepository } = createService();

    await expect(
      service.updateFeatureToggle(uuid('cccccccc-cccc-4ccc-8ccc-cccccccccccc'), 'enabled', 10),
    ).rejects.toMatchObject({ code: 'ADMIN_TOGGLE_ROLLOUT_INVALID' });
    expect(featureToggleRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('lists invitations applying defaults', async () => {
    const { service, invitationRepository } = createService();
    const invitations = [buildInvitation({ email: 'guest@example.com' })];
    invitationRepository.list.mockResolvedValueOnce(invitations).mockResolvedValueOnce(invitations);

    const resultWithoutFilters = await service.listInvitations();
    const resultWithFilters = await service.listInvitations({ status: 'pending' });

    expect(invitationRepository.list).toHaveBeenNthCalledWith(1, { limit: 50 });
    expect(invitationRepository.list).toHaveBeenNthCalledWith(2, { status: 'pending', limit: 50 });
    expect(resultWithoutFilters).toEqual(invitations);
    expect(resultWithFilters).toEqual(invitations);
  });

  it('prevents creating duplicate invitations for the same email', async () => {
    const { service, invitationRepository } = createService();
    invitationRepository.findPendingByEmail.mockResolvedValue(buildInvitation());

    await expect(
      service.createInvitation({
        email: 'guest@example.com',
        role: UserRole.Member,
        grantedAccess: [FeatureAccessKey.Hidra],
        expiresAt: '2025-12-01T00:00:00Z',
        invitedBy: uuid('12121212-1212-4212-8212-121212121212'),
        templateId: null,
        sendEmail: true,
      }),
    ).rejects.toMatchObject({ code: 'ADMIN_INVITE_DUPLICATE' });
    expect(invitationRepository.create).not.toHaveBeenCalled();
  });

  it('creates invitation with generated code and logs metadata', async () => {
    const invitedBy = uuid('13131313-1313-4131-8131-131313131313');
    const { service, invitationRepository, logger } = createService();
    invitationRepository.findPendingByEmail.mockResolvedValue(null);
    invitationRepository.create.mockImplementation(async (input) =>
      buildInvitation({
        id: uuid('14141414-1414-4141-8141-141414141414'),
        email: input.email,
        invitedBy: input.invitedBy,
        grantedAccess: input.grantedAccess,
        expiresAt: input.expiresAt,
        code: input.code,
      }),
    );

    const invitationInput = {
      email: 'new.member@example.com',
      role: UserRole.Member,
      grantedAccess: [FeatureAccessKey.Cybervault],
      expiresAt: '2025-12-10T00:00:00Z',
      invitedBy,
      templateId: null,
      sendEmail: true,
    };

    const result = await service.createInvitation(invitationInput);

    expect(invitationRepository.findPendingByEmail).toHaveBeenCalledWith('new.member@example.com');
    expect(invitationRepository.create).toHaveBeenCalledTimes(1);
    const createArgs = invitationRepository.create.mock.calls[0][0];
    expect(createArgs).toMatchObject({
      ...invitationInput,
      code: expect.any(String),
    });
    expect(createArgs.code).toMatch(/^[A-Z0-9]{12}$/);
    expect(logger.info).toHaveBeenCalledWith('Invitation created', {
      invitationId: result.id,
      invitedBy,
      sendEmail: true,
    });
    expect(result).toMatchObject({
      email: invitationInput.email,
      code: createArgs.code,
      grantedAccess: invitationInput.grantedAccess,
    });
  });

  it('validates invitation expiration date', async () => {
    const { service } = createService();

    await expect(
      service.createInvitation({
        email: 'expired@example.com',
        role: UserRole.Member,
        grantedAccess: [],
        expiresAt: '2025-10-01T00:00:00Z',
        invitedBy: uuid('15151515-1515-4151-8151-151515151515'),
        templateId: null,
        sendEmail: false,
      }),
    ).rejects.toMatchObject({ code: 'ADMIN_INVITE_INVALID_EXPIRY' });
  });

  it('sets access override with reason and grantedBy', async () => {
    const { service, memberAccessOverrideRepository, logger } = createService();
    const override = buildOverride();
    memberAccessOverrideRepository.setOverride.mockResolvedValue(override);

    const result = await service.setAccessOverride(
      override.userId,
      FeatureAccessKey.Hidra,
      true,
      ['view', 'trigger'],
      { grantedBy: override.grantedBy, reason: override.reason },
    );

    expect(memberAccessOverrideRepository.setOverride).toHaveBeenCalledWith({
      userId: override.userId,
      feature: FeatureAccessKey.Hidra,
      enabled: true,
      permissions: ['view', 'trigger'],
      grantedBy: override.grantedBy,
      reason: override.reason,
    });
    expect(logger.info).toHaveBeenCalledWith('Access override set', {
      userId: override.userId,
      feature: FeatureAccessKey.Hidra,
      grantedBy: override.grantedBy,
    });
    expect(result).toBe(override);
  });

  it('removes access override and confirms ok response', async () => {
    const { service, memberAccessOverrideRepository, logger } = createService();

    const result = await service.removeAccessOverride(
      uuid('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
      FeatureAccessKey.Cybervault,
    );

    expect(memberAccessOverrideRepository.removeOverride).toHaveBeenCalledWith(
      uuid('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
      FeatureAccessKey.Cybervault,
    );
    expect(logger.info).toHaveBeenCalledWith('Access override removed', {
      userId: uuid('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
      feature: FeatureAccessKey.Cybervault,
    });
    expect(result).toEqual({ ok: true });
  });
});
