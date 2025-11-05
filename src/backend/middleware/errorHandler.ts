import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
import { AppError, isAppError } from '../errors/AppError'
import type { ApiResponse } from '@shared/types/api.types'

export function errorHandler(): ErrorRequestHandler {
  return function (err: unknown, _req: Request, res: Response, _next: NextFunction) {
    const requestId = res.locals.requestId

    if (isAppError(err)) {
      const payload: ApiResponse<never> = {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
        timestamp: new Date().toISOString(),
        meta: { requestId },
      }
      return res.status(err.statusCode ?? 400).json(payload)
    }

    const unknown = err as Error | undefined
    const payload: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'test' ? unknown?.message : undefined,
      },
      timestamp: new Date().toISOString(),
      meta: { requestId },
    }
    return res.status(500).json(payload)
  }
}
