import jwt from 'jsonwebtoken';
import { TokenService } from 'src/backend/services/auth/TokenService';
import { UserRole } from '@shared/types/common.types';

const FIXED_NOW = new Date('2025-11-02T15:00:00.000Z');

describe('TokenService', () => {
  const config = {
    accessTokenSecret: 'access-secret',
    refreshTokenSecret: 'refresh-secret',
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
    issuer: 'siderhub-tests',
    audience: 'siderhub-members',
  } as const;

  const claims = {
    userId: 'user-123',
    sessionId: 'session-abc',
    role: UserRole.Member,
  } as const;

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('generates and verifies access tokens with expected claims', () => {
    const service = new TokenService(config);

    const token = service.generateAccessToken(claims);
    const decoded = service.verifyAccessToken(token);

    expect(decoded).toEqual(claims);
  });

  it('generates and verifies refresh tokens with expected claims', () => {
    const service = new TokenService(config);

    const token = service.generateRefreshToken(claims);
    const decoded = service.verifyRefreshToken(token);

    expect(decoded).toEqual(claims);
  });

  it('throws AppError when token type mismatches expected type', () => {
    const service = new TokenService(config);
    const refreshToken = jwt.sign(
      { ...claims, tokenType: 'refresh' },
      config.accessTokenSecret,
      { issuer: config.issuer, audience: config.audience, expiresIn: config.accessTokenTtl },
    );

    expect(() => service.verifyAccessToken(refreshToken)).toThrow(
      expect.objectContaining({ code: 'TOKEN_INVALID_TYPE' }),
    );
  });

  it('wraps verification errors in AppError with code TOKEN_VERIFICATION_FAILED', () => {
    const service = new TokenService(config);

    expect(() => service.verifyRefreshToken('this-is-not-a-valid-jwt')).toThrow(
      expect.objectContaining({ code: 'TOKEN_VERIFICATION_FAILED' }),
    );
  });
});
