import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import type {
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
} from '@shared/types/auth.types'
import { loginRequestSchema, registerRequestSchema, refreshTokenRequestSchema } from '@utils/validation'
import type { ApiServices } from '../types'
import { createAuthGuard } from '../../middleware/authGuard'
import { respondSuccess, respondValidationError } from '../utils/responses'
import { loginLimiter } from '../../middleware/rateLimit'

export function createAuthRouter(services: ApiServices) {
  const router = Router()
  const authGuard = createAuthGuard(services.tokenService)
  const logoutSchema = z
    .object({
      sessionId: z.string().uuid().optional(),
    })
    .strict()
    .default({})

  router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const parseResult = loginRequestSchema.safeParse(req.body)
    if (!parseResult.success) {
      return respondValidationError(res, 'Credenciais inválidas', parseResult.error.flatten())
    }

    try {
      const userAgent = req.get('user-agent') ?? 'unknown'
      const data = await services.authService.login({
        email: parseResult.data.email,
        password: parseResult.data.password,
        ipAddress: (req.ip as string) || (req.socket?.remoteAddress as string) || 'unknown',
        userAgent,
      })
      return respondSuccess<LoginResponse>(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    const parseResult = registerRequestSchema.safeParse(req.body)
    if (!parseResult.success) {
      return respondValidationError(res, 'Dados inválidos', parseResult.error.flatten())
    }

    try {
      const userAgent = req.get('user-agent') ?? 'unknown'
      const data = await services.authService.register({
        email: parseResult.data.email,
        password: parseResult.data.password,
        name: parseResult.data.name,
        inviteCode: parseResult.data.inviteCode,
        ipAddress: (req.ip as string) || (req.socket?.remoteAddress as string) || 'unknown',
        userAgent,
      })
      return respondSuccess<RegisterResponse>(res, 201, data)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    const parseResult = refreshTokenRequestSchema.safeParse(req.body)
    if (!parseResult.success) {
      return respondValidationError(res, 'Payload inválido', parseResult.error.flatten())
    }

    try {
      const userAgent = req.get('user-agent') ?? 'unknown'
      const data = await services.authService.refreshTokens({
        refreshToken: parseResult.data.refreshToken,
        ipAddress: (req.ip as string) || (req.socket?.remoteAddress as string) || 'unknown',
        userAgent,
      })
      return respondSuccess<RefreshTokenResponse>(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/logout', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parseResult = logoutSchema.safeParse(req.body ?? {})
    if (!parseResult.success) {
      return respondValidationError(res, 'Payload inválido', parseResult.error.flatten())
    }
    try {
      const sessionId = parseResult.data.sessionId
      await services.authService.logout(req.user!.userId, sessionId)
      return respondSuccess(res, 200, { ok: true })
    } catch (err) {
      return next(err)
    }
  })

  router.get('/me', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await services.authService.me(req.user!.userId)
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  return router
}
