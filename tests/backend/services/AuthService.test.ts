import { createHash } from 'crypto';
import { AuthService, type AuthServiceDependencies, type LoginContext, type RefreshContext } from 'src/backend/services/auth/AuthService';
import { TokenService } from 'src/backend/services/auth/TokenService';
import type { UserRepository, UserWithSecrets } from 'src/backend/repositories/auth/UserRepository';
import type { SessionRepository, SessionRecord } from 'src/backend/repositories/auth/SessionRepository';
import type { MemberAccessRepository } from 'src/backend/repositories/auth/MemberAccessRepository';
import type { InvitationRepository } from 'src/backend/repositories/auth/InvitationRepository';
import type { PasswordService } from 'src/backend/services/auth/PasswordService';
import type { Logger } from 'src/backend/logger';
import { FeatureAccessKey, UserRole } from '@shared/types';
import type { MemberAccessMap, RefreshTokenResponse, SessionSummary } from '@shared/types';
import type { LoginResponse } from '@shared/types';
import { createUser, createSession } from '../utils/factories';

const FIXED_NOW = new Date('2025-11-02T12:00:00.000Z');
const DEFAULT_REFRESH_TTL = '7d';

type MockedDeps = {
  userRepository: jest.Mocked<UserRepository>;
  sessionRepository: jest.Mocked<SessionRepository>;
  memberAccessRepository: jest.Mocked<MemberAccessRepository>;
  invitationRepository: jest.Mocked<InvitationRepository>;
  passwordService: jest.Mocked<PasswordService>;
  tokenService: TokenService;
  logger: Logger;
};

const createMockLogger = (): Logger => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildTokenService = (): TokenService =>
  new TokenService({
    accessTokenSecret: 'access-secret',
    refreshTokenSecret: 'refresh-secret',
    accessTokenTtl: '15m',
    refreshTokenTtl: DEFAULT_REFRESH_TTL,
    issuer: 'siderhub-test-suite',
  });

const createDeps = (): { service: AuthService; mocks: MockedDeps } => {
  const userRepository: jest.Mocked<UserRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
    updateLastLoginAt: jest.fn(),
    list: jest.fn(),
  };

  const sessionRepository: jest.Mocked<SessionRepository> = {
    createSession: jest.fn(),
    findById: jest.fn(),
    findActiveByUser: jest.fn(),
    updateRefreshToken: jest.fn(),
    invalidateSession: jest.fn(),
    invalidateAllUserSessions: jest.fn(),
  };

  const memberAccessRepository: jest.Mocked<MemberAccessRepository> = {
    getAccessMapByUser: jest.fn(),
    replaceAccessMap: jest.fn(),
    enableFeature: jest.fn(),
  };

  const invitationRepository: jest.Mocked<InvitationRepository> = {
    findActiveByCode: jest.fn(),
    markAsAccepted: jest.fn(),
    findPendingByEmail: jest.fn(),
    create: jest.fn(),
    list: jest.fn(),
  };

  const passwordService: jest.Mocked<PasswordService> = {
    hash: jest.fn(),
    compare: jest.fn(),
  } as unknown as jest.Mocked<PasswordService>;

  const tokenService = buildTokenService();
  const logger = createMockLogger();

  const deps: AuthServiceDependencies = {
    userRepository,
    sessionRepository,
    memberAccessRepository,
    invitationRepository,
    passwordService,
    tokenService,
    refreshTokenTtl: DEFAULT_REFRESH_TTL,
    logger,
    now: () => FIXED_NOW,
  };

  return {
    service: new AuthService(deps),
    mocks: { userRepository, sessionRepository, memberAccessRepository, invitationRepository, passwordService, tokenService, logger },
  };
};

const defaultMemberAccess: MemberAccessMap[] = [
  { feature: FeatureAccessKey.Academy, enabled: true, permissions: ['view'] },
  { feature: FeatureAccessKey.Cybervault, enabled: true, permissions: ['view'] },
  { feature: FeatureAccessKey.Hidra, enabled: false, permissions: [] },
  { feature: FeatureAccessKey.Community, enabled: true, permissions: ['member'] },
];

const fixedSessionSummary = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  ...createSession(),
  ...overrides,
});

describe('AuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('authenticates a member with valid credentials and issues tokens', async () => {
    const { service, mocks } = createDeps();
    const user: UserWithSecrets = { ...createUser(), passwordHash: 'hashed-password' };
    (mocks.userRepository.findByEmail as jest.Mock).mockResolvedValue(user);
    (mocks.passwordService.compare as jest.Mock).mockResolvedValue(true);
    const activeSessions = [fixedSessionSummary({ id: 'session-existing' })];
    mocks.sessionRepository.findActiveByUser.mockResolvedValue(activeSessions);
    mocks.memberAccessRepository.getAccessMapByUser.mockResolvedValue([]);
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';
    jest.spyOn(mocks.tokenService, 'generateAccessToken').mockReturnValue(accessToken);
    jest.spyOn(mocks.tokenService, 'generateRefreshToken').mockReturnValue(refreshToken);

    const loginContext: LoginContext = {
      email: user.email,
      password: 'Secret123!',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    };

    const response = await service.login(loginContext);

    expect(response).toEqual({
      user: expect.objectContaining({ id: user.id, email: user.email, role: user.role }),
      accessToken,
      refreshToken,
      accessMap: defaultMemberAccess,
      activeSessions,
    } satisfies LoginResponse);

    expect(mocks.passwordService.compare).toHaveBeenCalledWith('Secret123!', user.passwordHash);
    expect(mocks.sessionRepository.createSession).toHaveBeenCalledTimes(1);
    const createdSessionInput = mocks.sessionRepository.createSession.mock.calls[0][0];
    expect(createdSessionInput).toMatchObject({
      userId: user.id,
      userAgent: loginContext.userAgent,
      ipAddress: loginContext.ipAddress,
    });
    expect(createdSessionInput.refreshTokenHash).toBe(createHash('sha256').update(refreshToken).digest('hex'));
    expect(createdSessionInput.expiresAt).toBe(new Date(FIXED_NOW.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());
    expect(mocks.userRepository.updateLastLoginAt).toHaveBeenCalledWith(user.id, FIXED_NOW.toISOString());
    expect(mocks.memberAccessRepository.replaceAccessMap).toHaveBeenCalledWith(user.id, defaultMemberAccess);
  });

  it('rejects invalid credentials and logs attempt', async () => {
    const { service, mocks } = createDeps();
    const user: UserWithSecrets = { ...createUser(), passwordHash: 'hashed-password' };
    mocks.userRepository.findByEmail.mockResolvedValue(user);
    (mocks.passwordService.compare as jest.Mock).mockResolvedValue(false);

    const loginContext: LoginContext = {
      email: user.email,
      password: 'wrong',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    };

    await expect(service.login(loginContext)).rejects.toHaveProperty('code', 'AUTH_INVALID_CREDENTIALS');

    expect(mocks.sessionRepository.createSession).not.toHaveBeenCalled();
    expect(mocks.memberAccessRepository.replaceAccessMap).not.toHaveBeenCalled();
    expect(mocks.logger.warn).toHaveBeenCalledWith('Failed login attempt', { email: user.email });
  });

  it('invalidates session and throws when refresh token hash mismatches', async () => {
    const { service, mocks } = createDeps();
    const user: UserWithSecrets = { ...createUser(), passwordHash: 'hashed-password' };
    const session: SessionRecord = {
      ...fixedSessionSummary({ id: 'session-001', isCurrent: true }),
      refreshTokenHash: createHash('sha256').update('persisted-refresh-token').digest('hex'),
      userId: user.id,
    };

    mocks.sessionRepository.findById.mockResolvedValue(session);
    mocks.userRepository.findById.mockResolvedValue(user);
    jest.spyOn(mocks.tokenService, 'verifyRefreshToken').mockReturnValue({ userId: user.id, sessionId: session.id, role: user.role });

    const refreshContext: RefreshContext = {
      refreshToken: 'fresh-token-from-client',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    };

    await expect(service.refreshTokens(refreshContext)).rejects.toHaveProperty('code', 'AUTH_REFRESH_TOKEN_MISMATCH');

    expect(mocks.sessionRepository.invalidateSession).toHaveBeenCalledWith(session.id);
    expect(mocks.sessionRepository.updateRefreshToken).not.toHaveBeenCalled();
  });

  it('rotates refresh token and returns new pair when hash matches', async () => {
    const { service, mocks } = createDeps();
    const user: UserWithSecrets = { ...createUser(), passwordHash: 'hashed-password' };
    const refreshToken = 'old-refresh-token';
    const session: SessionRecord = {
      ...fixedSessionSummary({ id: 'session-123', expiresAt: new Date(FIXED_NOW.getTime() + 3600_000).toISOString() }),
      refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),
      userId: user.id,
    };

    mocks.sessionRepository.findById.mockResolvedValue(session);
    mocks.userRepository.findById.mockResolvedValue(user);

    jest.spyOn(mocks.tokenService, 'verifyRefreshToken').mockReturnValue({ userId: user.id, sessionId: session.id, role: user.role });
    const nextAccessToken = 'next-access-token';
    const nextRefreshToken = 'next-refresh-token';
    jest.spyOn(mocks.tokenService, 'generateAccessToken').mockReturnValue(nextAccessToken);
    jest.spyOn(mocks.tokenService, 'generateRefreshToken').mockReturnValue(nextRefreshToken);
    const expectedExpiry = new Date(FIXED_NOW.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const result = await service.refreshTokens({
      refreshToken,
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    });

    expect(result).toEqual<RefreshTokenResponse>({ accessToken: nextAccessToken, refreshToken: nextRefreshToken });
    expect(mocks.sessionRepository.updateRefreshToken).toHaveBeenCalledWith(
      session.id,
      createHash('sha256').update(nextRefreshToken).digest('hex'),
      expectedExpiry,
    );
  });

  it('invalidates a specific session when logout receives sessionId', async () => {
    const { service, mocks } = createDeps();

    await service.logout('user-1', 'session-99');

    expect(mocks.sessionRepository.invalidateSession).toHaveBeenCalledWith('session-99');
    expect(mocks.sessionRepository.invalidateAllUserSessions).not.toHaveBeenCalled();
  });

  it('invalidates all sessions when logout does not receive sessionId', async () => {
    const { service, mocks } = createDeps();

    await service.logout('user-1');

    expect(mocks.sessionRepository.invalidateAllUserSessions).toHaveBeenCalledWith('user-1');
    expect(mocks.sessionRepository.invalidateSession).not.toHaveBeenCalled();
  });

  it('returns profile, access map and active sessions on me()', async () => {
    const { service, mocks } = createDeps();
    const user: UserWithSecrets = { ...createUser(), passwordHash: 'hashed-password' };
    const existingMap: MemberAccessMap[] = [
      { feature: FeatureAccessKey.Academy, enabled: true, permissions: ['view'] },
    ];
    const sessions = [fixedSessionSummary({ id: 'session-777' })];

    mocks.userRepository.findById.mockResolvedValue(user);
    mocks.memberAccessRepository.getAccessMapByUser.mockResolvedValue(existingMap);
    mocks.sessionRepository.findActiveByUser.mockResolvedValue(sessions);

    const response = await service.me(user.id);
    const { passwordHash: _removed, ...userWithoutSecrets } = user;

    expect(response).toEqual({ user: userWithoutSecrets, accessMap: existingMap, activeSessions: sessions });
    expect(mocks.memberAccessRepository.replaceAccessMap).not.toHaveBeenCalled();
  });
});
