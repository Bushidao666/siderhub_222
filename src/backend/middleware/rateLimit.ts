import { randomUUID } from 'crypto'
import type { Request } from 'express'
import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit'

function ensureRequestId(req: Request, res: Parameters<Options['handler']>[1]): string {
  const incoming = (res.locals.requestId as string | undefined) ?? req.get('x-request-id')
  if (incoming) {
    res.locals.requestId = incoming
    return incoming
  }
  const generated = randomUUID()
  res.locals.requestId = generated
  return generated
}

function buildHandler(message: string): Options['handler'] {
  return (req, res, _next, options) => {
    const requestId = ensureRequestId(req, res)
    const retryAfterHeader = res.getHeader('Retry-After')
    const retryAfterSeconds = typeof retryAfterHeader === 'string' ? Number.parseInt(retryAfterHeader, 10) : undefined
    const response = {
      success: false as const,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        details: {
          limit: typeof options.limit === 'number' ? options.limit : undefined,
          retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : Math.ceil(options.windowMs / 1000),
        },
      },
      timestamp: new Date().toISOString(),
      meta: {
        requestId,
      },
    }

    res.status(options.statusCode ?? 429).json(response)
  }
}

function createLimiter({ message, ...config }: { message: string } & Partial<Options>): RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs ?? 15 * 60 * 1000,
    limit: config.limit ?? 300,
    standardHeaders: config.standardHeaders ?? true,
    legacyHeaders: config.legacyHeaders ?? false,
    keyGenerator: config.keyGenerator,
    skip: config.skip,
    handler: buildHandler(message),
  })
}

export const apiLimiter = createLimiter({
  message: 'Muitas requisições detectadas. Tente novamente em instantes.',
  limit: 600,
  windowMs: 15 * 60 * 1000,
})

export const loginLimiter = createLimiter({
  message: 'Limite de tentativas de login excedido. Aguarde antes de tentar novamente.',
  limit: 10,
  windowMs: 15 * 60 * 1000,
})

export const campaignLimiter = createLimiter({
  message: 'Limite de ações do Hidra atingido. Aguarde alguns instantes.',
  limit: 60,
  windowMs: 10 * 60 * 1000,
})

export const uploadLimiter = createLimiter({
  message: 'Limite de uploads atingido. Aguarde antes de fazer novos uploads.',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 uploads per hour
})
