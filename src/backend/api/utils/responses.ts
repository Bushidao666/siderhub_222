import type { Response } from 'express'
import type { ApiErrorDetail, ApiResponse } from '@shared/types/api.types'

function buildMeta(res: Response, meta?: Record<string, unknown>) {
  const requestId = res.locals.requestId as string | undefined
  if (!requestId && !meta) {
    return undefined
  }
  return {
    ...(meta ?? {}),
    ...(requestId ? { requestId } : {}),
  } as Record<string, unknown>
}

function timestamp() {
  return new Date().toISOString()
}

export function respondSuccess<T>(res: Response, status: number, data: T, meta?: Record<string, unknown>) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    timestamp: timestamp(),
  }

  const mergedMeta = buildMeta(res, meta)
  if (mergedMeta) {
    payload.meta = mergedMeta
  }

  return res.status(status).json(payload)
}

export function respondError(res: Response, status: number, error: ApiErrorDetail, meta?: Record<string, unknown>) {
  const payload: ApiResponse<never> = {
    success: false,
    error,
    timestamp: timestamp(),
  }

  const mergedMeta = buildMeta(res, meta)
  if (mergedMeta) {
    payload.meta = mergedMeta
  }

  return res.status(status).json(payload)
}

export function respondValidationError(res: Response, message: string, details?: unknown, meta?: Record<string, unknown>) {
  return respondError(
    res,
    400,
    {
      code: 'VALIDATION_ERROR',
      message,
      details,
    },
    meta,
  )
}
