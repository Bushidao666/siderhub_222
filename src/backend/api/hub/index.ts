import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import type { ApiServices } from '../types'
import { createAuthGuard } from '../../middleware/authGuard'
import { respondSuccess, respondValidationError } from '../utils/responses'

const overviewQuerySchema = z.object({
  bannerLimit: z.coerce.number().int().min(1).max(24).optional(),
  featuredLimit: z.coerce.number().int().min(1).max(24).optional(),
  recommendationLimit: z.coerce.number().int().min(1).max(24).optional(),
  resourceLimit: z.coerce.number().int().min(1).max(24).optional(),
  referenceDate: z.string().datetime().optional(),
  hidraRecentLimit: z.coerce.number().int().min(1).max(20).optional(),
})

const bannersQuerySchema = z.object({
  status: z.enum(['active', 'all']).default('active'),
  limit: z.coerce.number().int().min(1).max(24).optional(),
  referenceDate: z.string().datetime().optional(),
})

export function createHubRouter(services: ApiServices) {
  const router = Router()
  const authGuard = createAuthGuard(services.tokenService)

  const handleOverview = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = overviewQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const overview = await services.hubService.getOverview({
        userId: req.user!.userId,
        ...parsed.data,
      })

      return respondSuccess(res, 200, overview, {
        bannerLimit: parsed.data.bannerLimit,
        featuredLimit: parsed.data.featuredLimit,
        recommendationLimit: parsed.data.recommendationLimit,
        resourceLimit: parsed.data.resourceLimit,
        hidraRecentLimit: parsed.data.hidraRecentLimit,
        referenceDate: parsed.data.referenceDate,
      })
    } catch (error) {
      return next(error)
    }
  }

  router.get('/', authGuard, handleOverview)
  router.get('/overview', authGuard, handleOverview)

  router.get('/banners', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = bannersQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const { status, limit, referenceDate } = parsed.data
      if (status === 'active') {
        const banners = await services.hubService.getActiveBanners(limit, referenceDate)
        return respondSuccess(res, 200, banners, { status, limit })
      }

      const allBanners = await services.adminService.listBanners()
      const result = typeof limit === 'number' ? allBanners.slice(0, limit) : allBanners
      return respondSuccess(res, 200, result, { status, limit })
    } catch (error) {
      return next(error)
    }
  })

  return router
}
