import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import type { UUID } from '@shared/types/common.types'
import { hydraConfigSchema } from '@utils/validation'
import { createAuthGuard } from '../../middleware/authGuard'
import { campaignLimiter } from '../../middleware/rateLimit'
import type { ApiServices } from '../types'
import { respondError, respondSuccess, respondValidationError } from '../utils/responses'

const uuidSchema = z.string().uuid()

const createCampaignSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  segmentId: z.string().uuid(),
  templateId: z.string().uuid(),
  maxMessagesPerMinute: z.coerce.number().int().min(1).max(1000).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  externalId: z.string().min(1).max(120).optional(),
})

const scheduleCampaignSchema = z.object({
  scheduledAt: z.string().datetime(),
})

const configUpdateSchema = hydraConfigSchema.extend({
  verifyConnection: z.coerce.boolean().optional(),
})

const dashboardQuerySchema = z.object({
  recentLimit: z.coerce.number().int().min(1).max(100).optional(),
})

export function createHidraRouter(services: ApiServices) {
  const router = Router()
  const authGuard = createAuthGuard(services.tokenService)

  router.post('/config/test', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ok = await services.hidraService.testConnection(req.user!.userId)
      return respondSuccess(res, 200, { ok })
    } catch (err) {
      return next(err)
    }
  })

  router.put('/config', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = configUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Config inválida', parsed.error.flatten())
    }
    try {
      const config = await services.hidraService.updateConfig({
        userId: req.user!.userId,
        baseUrl: parsed.data.baseUrl,
        apiKey: parsed.data.apiKey,
        verifyConnection: parsed.data.verifyConnection,
      })
      return respondSuccess(res, 200, config)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/campaigns', authGuard, campaignLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createCampaignSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const data = await services.hidraService.createCampaign({
        userId: req.user!.userId,
        name: parsed.data.name,
        description: parsed.data.description,
        segmentId: parsed.data.segmentId,
        templateId: parsed.data.templateId,
        maxMessagesPerMinute: parsed.data.maxMessagesPerMinute,
        scheduledAt: parsed.data.scheduledAt ?? null,
        externalId: parsed.data.externalId,
      })
      return respondSuccess(res, 201, data)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/campaigns/:id/schedule', authGuard, campaignLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const parsedId = uuidSchema.safeParse(req.params.id)
    if (!parsedId.success) {
      return respondValidationError(res, 'ID inválido')
    }

    const schedule = scheduleCampaignSchema.safeParse(req.body)
    if (!schedule.success) {
      return respondValidationError(res, 'Dados inválidos', schedule.error.flatten())
    }

    try {
      const data = await services.hidraService.scheduleCampaign({
        campaignId: parsedId.data,
        scheduledAt: schedule.data.scheduledAt,
        initiatedBy: req.user!.userId,
      })
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.get('/campaigns/:id/metrics', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = uuidSchema.parse(req.params.id) as UUID
      const metrics = await services.hidraService.getCampaignMetrics(campaignId)
      if (!metrics) {
        return respondError(res, 404, { code: 'NOT_FOUND', message: 'Campanha não encontrada' })
      }
      return respondSuccess(res, 200, metrics)
    } catch (err) {
      return next(err)
    }
  })

  router.get('/dashboard', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsedQuery = dashboardQuerySchema.safeParse(req.query)
    if (!parsedQuery.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsedQuery.error.flatten())
    }

    try {
      const summary = await services.hidraService.getDashboardSummary(req.user!.userId, {
        recentLimit: parsedQuery.data.recentLimit,
      })
      return respondSuccess(res, 200, summary)
    } catch (err) {
      return next(err)
    }
  })

  // Lightweight alias for Hub metrics (only messageSummary)
  // GET /api/hidra/campaigns/metrics/overview -> HidraMessageSummary
  router.get('/campaigns/metrics/overview', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsedQuery = dashboardQuerySchema.safeParse(req.query)
    if (!parsedQuery.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsedQuery.error.flatten())
    }

    try {
      const summary = await services.hidraService.getDashboardSummary(req.user!.userId, {
        recentLimit: parsedQuery.data.recentLimit,
      })
      return respondSuccess(res, 200, summary.messageSummary)
    } catch (err) {
      return next(err)
    }
  })

  return router
}
