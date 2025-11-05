import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { bannerSchema, emailSchema } from '@utils/validation'
import { createAuthGuard } from '../../middleware/authGuard'
import { roleGuard } from '../../middleware/roleGuard'
import type { ApiServices } from '../types'
import { FeatureAccessKey, UserRole } from '@shared/types/common.types'
import { respondError, respondSuccess, respondValidationError } from '../utils/responses'
import type { CommentModerationItem } from '@shared/types/admin.types'
import type { LessonComment } from '@shared/types/academy.types'

const bannerCreateSchema = bannerSchema.extend({
  order: z.coerce.number().int().min(0).max(100).optional(),
})

const bannerUpdateSchema = bannerSchema.extend({
  order: z.coerce.number().int().min(0).max(100).optional(),
})

const toggleUpdateSchema = z.object({
  status: z.enum(['enabled', 'disabled', 'gradual']),
  rolloutPercentage: z.coerce.number().int().min(0).max(100).optional(),
})

const accessOverrideSchema = z.object({
  userId: z.string().uuid(),
  feature: z.nativeEnum(FeatureAccessKey),
  enabled: z.boolean(),
  permissions: z.array(z.string().min(1)).max(20),
  reason: z.string().min(3).max(160).optional(),
})

const removeOverrideSchema = z.object({
  userId: z.string().uuid(),
  feature: z.nativeEnum(FeatureAccessKey),
})

const invitationQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'expired']).optional(),
  search: z.string().min(2).max(160).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

const invitationCreateSchema = z.object({
  email: emailSchema,
  role: z.nativeEnum(UserRole),
  grantedAccess: z.array(z.nativeEnum(FeatureAccessKey)).max(12).default([]),
  expiresAt: z.string().datetime(),
  templateId: z.string().uuid().nullable().optional(),
  sendEmail: z.boolean().optional(),
})

const moderationListQuerySchema = z.object({
  status: z.enum(['pending', 'rejected']).default('pending'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const commentParamsSchema = z.object({
  commentId: z.string().uuid(),
})

const replyParamsSchema = z.object({
  commentId: z.string().uuid(),
  replyId: z.string().uuid(),
})

function toModerationItem(
  comment: LessonComment,
  extras: { courseId?: string; lessonTitle?: string; courseTitle?: string; userDisplayName?: string } = {},
): CommentModerationItem {
  return {
    id: comment.id,
    entityId: comment.id,
    commentId: comment.id,
    lessonId: comment.lessonId,
    courseId: extras.courseId ?? '00000000-0000-0000-0000-000000000000',
    lessonTitle: extras.lessonTitle ?? '',
    courseTitle: extras.courseTitle ?? '',
    userId: comment.userId,
    userDisplayName: extras.userDisplayName ?? '',
    body: comment.body,
    createdAt: comment.createdAt,
    pendingModeration: comment.pendingModeration,
    moderationStatus: comment.moderationStatus,
    moderatedById: comment.moderatedById,
    moderatedAt: comment.moderatedAt,
    type: 'comment',
    depth: 0,
  }
}

export function createAdminRouter(services: ApiServices) {
  const router = Router()
  const authGuard = createAuthGuard(services.tokenService)
  const adminOnly = roleGuard({ roles: [UserRole.Admin, UserRole.SuperAdmin] })
  const moderatorOnly = roleGuard({ roles: [UserRole.Admin, UserRole.SuperAdmin, UserRole.Mentor] })

  // Admin members listing
  const membersQuerySchema = z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
      role: z.nativeEnum(UserRole).optional(),
      search: z.string().min(2).max(160).optional(),
    })
    .default({})

  router.get('/members', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = membersQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const [members, pendingInvitations] = await Promise.all([
        services.adminService.listMembers(parsed.data),
        services.adminService.listInvitations({ status: 'pending', limit: 100 }),
      ])
      return respondSuccess(res, 200, members, {
        pendingInvitations,
      })
    } catch (err) {
      return next(err)
    }
  })

  router.get('/dashboard', authGuard, adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const overview = await services.adminService.getDashboardOverview()
      return respondSuccess(res, 200, overview)
    } catch (err) {
      return next(err)
    }
  })

  

  // Banners
  router.get('/banners', authGuard, adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await services.adminService.listBanners()
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/banners', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = bannerCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const data = await services.adminService.createBanner({
        ...parsed.data,
        order: parsed.data.order ?? 0,
        createdBy: req.user!.userId,
      })
      return respondSuccess(res, 201, data)
    } catch (err) {
      return next(err)
    }
  })

  router.put('/banners/:id', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const id = z.string().uuid().safeParse(req.params.id)
    const parsed = bannerUpdateSchema.safeParse(req.body)
    if (!id.success || !parsed.success) {
      const details = parsed.success ? undefined : parsed.error.flatten()
      return respondValidationError(res, 'Dados inválidos', details)
    }

    try {
      const data = await services.adminService.updateBanner(id.data, {
        ...parsed.data,
        updatedBy: req.user!.userId,
      })
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.delete('/banners/:id', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const id = z.string().uuid().safeParse(req.params.id)
    if (!id.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      const data = await services.adminService.deleteBanner(id.data)
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  // Moderation queue (comments + replies)
  router.get(
    '/academy/comments/pending',
    authGuard,
    moderatorOnly,
    async (req: Request, res: Response, next: NextFunction) => {
      const parsed = moderationListQuerySchema.safeParse(req.query)
      if (!parsed.success) {
        return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
      }

      try {
        const items: CommentModerationItem[] = await services.academyService.listPendingModerationItems({
          status: parsed.data.status,
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
        })

        return respondSuccess(res, 200, items, {
          status: parsed.data.status,
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
        })
      } catch (err) {
        return next(err)
      }
    },
  )

  // Feature toggles
  router.get('/feature-toggles', authGuard, adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await services.adminService.getFeatureToggles()
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.put('/feature-toggles/:id', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const id = z.string().uuid().safeParse(req.params.id)
    const parsed = toggleUpdateSchema.safeParse(req.body)
    if (!id.success || !parsed.success) {
      const details = parsed.success ? undefined : parsed.error.flatten()
      return respondValidationError(res, 'Dados inválidos', details)
    }

    try {
      const data = await services.adminService.updateFeatureToggle(id.data, parsed.data.status, parsed.data.rolloutPercentage)
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  // Access overrides
  router.post('/access-overrides', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = accessOverrideSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const data = await services.adminService.setAccessOverride(
        parsed.data.userId,
        parsed.data.feature,
        parsed.data.enabled,
        parsed.data.permissions,
        { grantedBy: req.user!.userId, reason: parsed.data.reason },
      )
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.delete('/access-overrides', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = removeOverrideSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const data = await services.adminService.removeAccessOverride(parsed.data.userId, parsed.data.feature)
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  // Invitations
  router.get('/invitations', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = invitationQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const invitations = await services.adminService.listInvitations(parsed.data)
      return respondSuccess(res, 200, invitations)
    } catch (err) {
      return next(err)
    }
  })

  // Moderation actions (comments)
  router.post(
    '/academy/comments/:commentId/approve',
    authGuard,
    moderatorOnly,
    async (req: Request, res: Response, next: NextFunction) => {
      const params = commentParamsSchema.safeParse(req.params)
      if (!params.success) {
        return respondValidationError(res, 'Parâmetros inválidos', params.error.flatten())
      }

      try {
        const moderatorId = req.user!.userId
        const updated = await services.academyService.approveComment({
          commentId: params.data.commentId,
          moderatorId,
        })
        const item = toModerationItem(updated)
        return respondSuccess(res, 200, item, {
          commentId: params.data.commentId,
          action: 'approved',
        })
      } catch (err) {
        return next(err)
      }
    },
  )

  router.post(
    '/academy/comments/:commentId/reject',
    authGuard,
    moderatorOnly,
    async (req: Request, res: Response, next: NextFunction) => {
      const params = commentParamsSchema.safeParse(req.params)
      if (!params.success) {
        return respondValidationError(res, 'Parâmetros inválidos', params.error.flatten())
      }

      try {
        const moderatorId = req.user!.userId
        const updated = await services.academyService.rejectComment({
          commentId: params.data.commentId,
          moderatorId,
        })
        const item = toModerationItem(updated)
        return respondSuccess(res, 200, item, {
          commentId: params.data.commentId,
          action: 'rejected',
        })
      } catch (err) {
        return next(err)
      }
    },
  )

  // Moderation actions (replies)
  router.post(
    '/academy/comments/:commentId/replies/:replyId/approve',
    authGuard,
    moderatorOnly,
    async (req: Request, res: Response, next: NextFunction) => {
      const params = replyParamsSchema.safeParse(req.params)
      if (!params.success) {
        return respondValidationError(res, 'Parâmetros inválidos', params.error.flatten())
      }

      try {
        const moderatorId = req.user!.userId
        const updated = await services.academyService.approveReply({
          commentId: params.data.commentId,
          replyId: params.data.replyId,
          moderatorId,
        })
        return respondSuccess(res, 200, updated, {
          commentId: params.data.commentId,
          replyId: params.data.replyId,
          action: 'approved',
        })
      } catch (err) {
        return next(err)
      }
    },
  )

  router.post(
    '/academy/comments/:commentId/replies/:replyId/reject',
    authGuard,
    moderatorOnly,
    async (req: Request, res: Response, next: NextFunction) => {
      const params = replyParamsSchema.safeParse(req.params)
      if (!params.success) {
        return respondValidationError(res, 'Parâmetros inválidos', params.error.flatten())
      }

      try {
        const moderatorId = req.user!.userId
        const updated = await services.academyService.rejectReply({
          commentId: params.data.commentId,
          replyId: params.data.replyId,
          moderatorId,
        })
        return respondSuccess(res, 200, updated, {
          commentId: params.data.commentId,
          replyId: params.data.replyId,
          action: 'rejected',
        })
      } catch (err) {
        return next(err)
      }
    },
  )

  router.post('/invitations', authGuard, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = invitationCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const invitation = await services.adminService.createInvitation({
        email: parsed.data.email,
        role: parsed.data.role,
        grantedAccess: parsed.data.grantedAccess,
        expiresAt: parsed.data.expiresAt,
        invitedBy: req.user!.userId,
        templateId: parsed.data.templateId ?? null,
        sendEmail: parsed.data.sendEmail,
      })
      return respondSuccess(res, 201, invitation)
    } catch (err) {
      return next(err)
    }
  })

  return router
}
