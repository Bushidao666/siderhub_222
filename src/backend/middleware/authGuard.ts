import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { TokenService } from '../services/auth/TokenService'

export function createAuthGuard(tokenService: TokenService) {
  return function authGuard(req: Request, _res: Response, next: NextFunction) {
    const header = req.get('authorization') || req.get('Authorization')
    if (!header || !header.startsWith('Bearer ')) {
      return next(new AppError({ code: 'AUTH_REQUIRED', message: 'Autenticação necessária', statusCode: 401 }))
    }
    const token = header.substring('Bearer '.length).trim()
    try {
      const claims = tokenService.verifyAccessToken(token)
      req.user = {
        userId: claims.userId,
        sessionId: claims.sessionId,
        role: claims.role,
      }
      return next()
    } catch (err) {
      return next(err)
    }
  }
}

