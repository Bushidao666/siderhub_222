import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole, UUID } from '@shared/types';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';

type TokenExpiry = NonNullable<SignOptions['expiresIn']>;

export interface TokenServiceConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtl: TokenExpiry;
  refreshTokenTtl: TokenExpiry;
  issuer?: string;
  audience?: string;
  // Optional logger accepted for DI convenience (not used internally)
  logger?: Logger;
}

export interface TokenClaims {
  userId: UUID;
  sessionId: UUID;
  role: UserRole;
}

interface InternalTokenPayload extends jwt.JwtPayload {
  tokenType: 'access' | 'refresh';
  userId: UUID;
  sessionId: UUID;
  role: UserRole;
}

export class TokenService {
  constructor(private readonly config: TokenServiceConfig) {}

  generateAccessToken(claims: TokenClaims): string {
    const payload: InternalTokenPayload = {
      ...claims,
      tokenType: 'access',
    };
    return jwt.sign(payload, this.config.accessTokenSecret, this.buildSignOptions(this.config.accessTokenTtl));
  }

  generateRefreshToken(claims: TokenClaims): string {
    const payload: InternalTokenPayload = {
      ...claims,
      tokenType: 'refresh',
    };
    return jwt.sign(payload, this.config.refreshTokenSecret, this.buildSignOptions(this.config.refreshTokenTtl));
  }

  verifyAccessToken(token: string): TokenClaims {
    return this.verifyToken(token, 'access', this.config.accessTokenSecret);
  }

  verifyRefreshToken(token: string): TokenClaims {
    return this.verifyToken(token, 'refresh', this.config.refreshTokenSecret);
  }

  private verifyToken(token: string, expectedType: InternalTokenPayload['tokenType'], secret: string): TokenClaims {
    try {
      const payload = jwt.verify(token, secret, this.buildVerifyOptions()) as InternalTokenPayload;
      if (payload.tokenType !== expectedType) {
        throw new AppError({ code: 'TOKEN_INVALID_TYPE', message: 'Tipo de token inválido', statusCode: 401 });
      }
      return {
        userId: payload.userId,
        sessionId: payload.sessionId,
        role: payload.role,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({ code: 'TOKEN_VERIFICATION_FAILED', message: 'Token inválido ou expirado', statusCode: 401, cause: error });
    }
  }

  private buildSignOptions(expiresIn: SignOptions['expiresIn']): SignOptions {
    const { issuer, audience } = this.config;
    const options: SignOptions = {};
    if (expiresIn !== undefined) {
      options.expiresIn = expiresIn;
    }
    if (issuer) {
      options.issuer = issuer;
    }
    if (audience) {
      options.audience = audience;
    }
    return options;
  }

  private buildVerifyOptions(): jwt.VerifyOptions {
    const { issuer, audience } = this.config;
    const options: jwt.VerifyOptions = {};
    if (issuer) {
      options.issuer = issuer;
    }
    if (audience) {
      options.audience = audience;
    }
    return options;
  }
}
