import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { ResourceType, Visibility } from '@shared/types/common.types'
import { createAuthGuard } from '../../middleware/authGuard'
import type { ApiServices } from '../types'
import { respondError, respondSuccess, respondValidationError } from '../utils/responses'

const toArray = <T>(schema: z.ZodType<T>) =>
  z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    }
    return value
  }, schema)

const listQuerySchema = z
  .object({
    query: z.string().min(1).max(120).optional(),
    categoryIds: toArray(z.array(z.string().uuid()).max(10)).optional(),
    tagIds: toArray(z.array(z.string().uuid()).max(10)).optional(),
    types: toArray(z.array(z.nativeEnum(ResourceType)).max(10)).optional(),
    visibility: z.nativeEnum(Visibility).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.string().min(1).max(64).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  })
  .default({})

const uuidSchema = z.string().uuid()
const slugSchema = z.string().min(3).max(160)

export function createCybervaultRouter(services: ApiServices) {
  const router = Router()
  const authGuard = createAuthGuard(services.tokenService)

  router.get('/resources', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = listQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    const params = { ...parsed.data }
    if (params.categoryIds && params.categoryIds.length === 0) {
      delete params.categoryIds
    }
    if (params.tagIds && params.tagIds.length === 0) {
      delete params.tagIds
    }
    if (params.types && params.types.length === 0) {
      delete params.types
    }

    try {
      const data = await services.cybervaultService.listResources(params)
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.get('/resources/:slug', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const slugResult = slugSchema.safeParse(req.params.slug)
    if (!slugResult.success) {
      return respondValidationError(res, 'Slug inválido')
    }

    try {
      const resource = await services.cybervaultService.getBySlug(slugResult.data)
      if (!resource) {
        return respondError(res, 404, { code: 'NOT_FOUND', message: 'Recurso não encontrado' })
      }
      return respondSuccess(res, 200, resource)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/resources/:id/download', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const idResult = uuidSchema.safeParse(req.params.id)
    if (!idResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      const ipAddress = (req.ip as string) || (req.socket?.remoteAddress as string) || 'unknown'
      const result = await services.cybervaultService.recordDownload({
        resourceId: idResult.data,
        userId: req.user!.userId,
        ipAddress,
      })
      return respondSuccess(res, 200, result)
    } catch (err) {
      return next(err)
    }
  })

  return router
}
