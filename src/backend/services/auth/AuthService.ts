import { createHash, randomUUID } from 'crypto';
import { loginRequestSchema, registerRequestSchema } from '@utils/validation';
import type { LoginResponse, MemberAccessMap, RefreshTokenResponse, RegisterResponse, SessionSummary, User, UserRole, UUID } from '@shared/types';
import type { FeatureAccessKey } from '@shared/types/common.types';
import type { LoginRequest, RefreshTokenRequest, RegisterRequest } from '@shared/types/auth.types';
import ms from 'ms';
import { FeatureAccessKey as FeatureKeyEnum, UserRole as UserRoleEnum } from '@shared/types/common.types';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';
import { createLogger } from '../../logger';
import type { InvitationRepository, MemberAccessRepository, SessionRepository, UserRepository, UserWithSecrets } from '../../repositories/auth';
import { PasswordService } from './PasswordService';
import { TokenService, type TokenClaims } from './TokenService';

export interface LoginContext extends LoginRequest {
  ipAddress: string;
  userAgent: string;
}

export interface RegisterContext extends RegisterRequest {
  ipAddress: string;
  userAgent: string;
}

export interface RefreshContext extends RefreshTokenRequest {
  ipAddress: string;
  userAgent: string;
}

export interface MeResponse {
  user: User;
  accessMap: MemberAccessMap[];
  activeSessions: SessionSummary[];
}

export interface AuthServiceDependencies {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  memberAccessRepository: MemberAccessRepository;
  invitationRepository: InvitationRepository;
  passwordService: PasswordService;
  tokenService: TokenService;
  refreshTokenTtl: string | number;
  logger?: Logger;
  now?: () => Date;
}

export class AuthService {
  private readonly logger: Logger;

  constructor(private readonly deps: AuthServiceDependencies) {
    this.logger = deps.logger ?? createLogger('AuthService');
  }

  async login(input: LoginContext): Promise<LoginResponse> {
    const payload = loginRequestSchema.parse({ email: input.email, password: input.password });

    const user = await this.deps.userRepository.findByEmail(payload.email);
    if (!user || !(await this.deps.passwordService.compare(payload.password, user.passwordHash))) {
      this.logger.warn('Failed login attempt', { email: payload.email });
      throw new AppError({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Credenciais inválidas', statusCode: 401 });
    }

    const response = await this.issueSessionAndTokens(user, input.ipAddress, input.userAgent);
    this.logger.info('User logged in', { userId: user.id, sessionCount: response.activeSessions.length });
    return response;
  }

  async register(input: RegisterContext): Promise<RegisterResponse> {
    const payload = registerRequestSchema.parse({
      email: input.email,
      password: input.password,
      name: input.name,
      inviteCode: input.inviteCode,
    });

    const existing = await this.deps.userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError({ code: 'AUTH_EMAIL_IN_USE', message: 'E-mail já está em uso', statusCode: 409 });
    }

    const invitation = await this.deps.invitationRepository.findActiveByCode(payload.inviteCode);
    if (!invitation || invitation.status !== 'pending') {
      throw new AppError({ code: 'AUTH_INVALID_INVITE', message: 'Convite inválido ou expirado', statusCode: 400 });
    }

    const passwordHash = await this.deps.passwordService.hash(payload.password);

    const userProfile: User['profile'] = {
      displayName: payload.name,
      avatarUrl: null,
      bio: null,
      timezone: 'UTC',
      badges: [],
      socialLinks: [],
    };

    const newUser = await this.deps.userRepository.createUser({
      email: payload.email,
      passwordHash,
      role: invitation.role,
      profile: userProfile,
      inviteId: invitation.id,
    });

    await this.deps.invitationRepository.markAsAccepted(invitation.id, newUser.id);

    const sessionId = this.generateSessionId();
    const { accessToken, refreshToken } = this.generateTokens(newUser.id, newUser.role, sessionId);
    await this.ensureAccessMap(newUser.id, newUser.role);

    await this.deps.sessionRepository.createSession({
      id: sessionId,
      userId: newUser.id,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: this.computeRefreshExpiry(),
    });

    this.logger.info('User registered', { userId: newUser.id, inviteId: invitation.id });

    return {
      user: this.stripSensitiveUser(newUser),
      accessToken,
      refreshToken,
    } satisfies RegisterResponse;
  }

  async refreshTokens(input: RefreshContext): Promise<RefreshTokenResponse> {
    if (!input.refreshToken) {
      throw new AppError({ code: 'AUTH_REFRESH_TOKEN_REQUIRED', message: 'Token de atualização é obrigatório', statusCode: 400 });
    }

    const claims = this.deps.tokenService.verifyRefreshToken(input.refreshToken);
    const session = await this.deps.sessionRepository.findById(claims.sessionId);
    if (!session) {
      throw new AppError({ code: 'AUTH_SESSION_NOT_FOUND', message: 'Sessão não encontrada', statusCode: 401 });
    }

    if (new Date(session.expiresAt) < this.now()) {
      await this.deps.sessionRepository.invalidateSession(session.id);
      throw new AppError({ code: 'AUTH_SESSION_EXPIRED', message: 'Sessão expirada', statusCode: 401 });
    }

    const hashed = this.hashRefreshToken(input.refreshToken);
    if (session.refreshTokenHash !== hashed) {
      await this.deps.sessionRepository.invalidateSession(session.id);
      this.logger.warn('Refresh token mismatch', { sessionId: session.id, userId: session.userId });
      throw new AppError({ code: 'AUTH_REFRESH_TOKEN_MISMATCH', message: 'Token de atualização inválido', statusCode: 401 });
    }

    const user = await this.deps.userRepository.findById(session.userId);
    if (!user) {
      throw new AppError({ code: 'AUTH_USER_NOT_FOUND', message: 'Usuário não encontrado', statusCode: 404 });
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role, session.id);

    await this.deps.sessionRepository.updateRefreshToken(session.id, this.hashRefreshToken(refreshToken), this.computeRefreshExpiry());

    this.logger.info('Refresh token rotated', { userId: user.id, sessionId: session.id });

    return {
      accessToken,
      refreshToken,
    } satisfies RefreshTokenResponse;
  }

  async logout(userId: UUID, sessionId?: UUID): Promise<void> {
    if (sessionId) {
      await this.deps.sessionRepository.invalidateSession(sessionId);
      this.logger.info('User session terminated', { userId, sessionId });
      return;
    }
    await this.deps.sessionRepository.invalidateAllUserSessions(userId);
    this.logger.info('User sessions terminated', { userId });
  }

  async me(userId: UUID): Promise<MeResponse> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw new AppError({ code: 'AUTH_USER_NOT_FOUND', message: 'Usuário não encontrado', statusCode: 404 });
    }

    const [accessMap, sessions] = await Promise.all([
      this.ensureAccessMap(userId, user.role),
      this.deps.sessionRepository.findActiveByUser(userId),
    ]);

    return {
      user: this.stripSensitiveUser(user),
      accessMap,
      activeSessions: sessions,
    } satisfies MeResponse;
  }

  private async issueSessionAndTokens(user: UserWithSecrets, ipAddress: string, userAgent: string): Promise<LoginResponse> {
    const sessionId = this.generateSessionId();
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.role, sessionId);

    await this.deps.sessionRepository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      userAgent,
      ipAddress,
      expiresAt: this.computeRefreshExpiry(),
    });

    await this.deps.userRepository.updateLastLoginAt(user.id, this.nowIso());
    const accessMap = await this.ensureAccessMap(user.id, user.role);
    const activeSessions = await this.deps.sessionRepository.findActiveByUser(user.id);

    this.logger.debug('Session issued', { userId: user.id, sessionId });

    return {
      user: this.stripSensitiveUser(user),
      accessToken,
      refreshToken,
      accessMap,
      activeSessions,
    } satisfies LoginResponse;
  }

  private generateTokens(userId: UUID, role: UserRole, sessionId: UUID) {
    const claims: TokenClaims = { userId, role, sessionId };
    return {
      accessToken: this.deps.tokenService.generateAccessToken(claims),
      refreshToken: this.deps.tokenService.generateRefreshToken(claims),
    };
  }

  private async ensureAccessMap(userId: UUID, role: UserRole): Promise<MemberAccessMap[]> {
    const accessMap = await this.deps.memberAccessRepository.getAccessMapByUser(userId);
    if (accessMap.length > 0) {
      return accessMap;
    }
    const defaults = this.buildDefaultAccessMap(role);
    await this.deps.memberAccessRepository.replaceAccessMap(userId, defaults);
    return defaults;
  }

  private buildDefaultAccessMap(role: UserRole): MemberAccessMap[] {
    // Basic defaults derived from role; can be revisited once admin overrides exist.
    switch (role) {
      case UserRoleEnum.SuperAdmin:
      case UserRoleEnum.Admin:
        return [
          this.buildFeatureAccess(FeatureKeyEnum.Hidra, ['admin', 'manage_campaigns']),
          this.buildFeatureAccess(FeatureKeyEnum.Cybervault, ['admin', 'manage_resources']),
          this.buildFeatureAccess(FeatureKeyEnum.Academy, ['admin', 'manage_courses']),
          this.buildFeatureAccess(FeatureKeyEnum.Admin, ['full_access']),
          this.buildFeatureAccess(FeatureKeyEnum.Community, ['moderate']),
        ];
      case UserRoleEnum.Mentor:
        return [
          this.buildFeatureAccess(FeatureKeyEnum.Academy, ['view', 'mentor_tools']),
          this.buildFeatureAccess(FeatureKeyEnum.Cybervault, ['view']),
          this.buildFeatureAccess(FeatureKeyEnum.Hidra, ['view']),
          this.buildFeatureAccess(FeatureKeyEnum.Community, ['mentor']),
        ];
      default:
        return [
          this.buildFeatureAccess(FeatureKeyEnum.Academy, ['view']),
          this.buildFeatureAccess(FeatureKeyEnum.Cybervault, ['view']),
          this.buildFeatureAccess(FeatureKeyEnum.Hidra, []),
          this.buildFeatureAccess(FeatureKeyEnum.Community, ['member']),
        ];
    }
  }

  private buildFeatureAccess(feature: FeatureAccessKey, permissions: string[]): MemberAccessMap {
    return { feature, enabled: permissions.length > 0, permissions };
  }

  private stripSensitiveUser(user: UserWithSecrets): User {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeRefreshExpiry(): string {
    const expires = new Date(this.now().getTime() + this.parseTtlToMs(this.deps.refreshTokenTtl));
    return expires.toISOString();
  }

  private parseTtlToMs(ttl: string | number): number {
    if (typeof ttl === 'number') {
      return ttl;
    }
    const parsed = ms(ttl);
    if (typeof parsed !== 'number') {
      throw new AppError({ code: 'TOKEN_INVALID_TTL', message: 'Configuração de TTL inválida' });
    }
    return parsed;
  }

  private generateSessionId(): UUID {
    // Provisório: aguarda implementação do repository para gerar IDs via DB.
    return randomUUID() as UUID;
  }

  private now(): Date {
    return this.deps.now ? this.deps.now() : new Date();
  }

  private nowIso(): string {
    return this.now().toISOString();
  }
}
