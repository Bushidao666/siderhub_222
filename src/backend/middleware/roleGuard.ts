import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import type { UserRole } from '@shared/types/common.types'

export interface RoleGuardOptions {
  roles?: UserRole[]
}

export function roleGuard(options: RoleGuardOptions) {
  return function (req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
      return next(new AppError({ code: 'AUTH_REQUIRED', message: 'Autenticação necessária', statusCode: 401 }))
    }

    if (options.roles && options.roles.length > 0) {
      if (!options.roles.includes(req.user.role)) {
        return next(new AppError({ code: 'FORBIDDEN', message: 'Acesso negado', statusCode: 403 }))
      }
    }

    return next()
  }
}

