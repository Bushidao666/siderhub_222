import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { CourseStatus, Visibility } from '@shared/types/common.types'
import { createAuthGuard } from '../../middleware/authGuard'
import type { ApiServices } from '../types'
import { respondError, respondSuccess, respondValidationError } from '../utils/responses'

const limitSchema = z.coerce.number().int().min(1).max(24)

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(CourseStatus).optional(),
    visibility: z.nativeEnum(Visibility).optional(),
    tag: z.string().min(1).max(50).optional(),
    search: z.string().min(2).max(160).optional(),
  })
  .default({})

const progressSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
})

const commentSchema = z.object({
  body: z.string().min(3).max(2000),
})

const replySchema = z.object({
  body: z.string().trim().min(1).max(1200),
  parentReplyId: z.string().uuid().optional(),
})

const uuidSchema = z.string().uuid()
const commentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  after: z.string().uuid().optional(),
})
const featuredQuerySchema = z.object({
  limit: limitSchema.optional(),
})

const recommendedQuerySchema = z.object({
  limit: limitSchema.optional(),
})

const lessonRatingBodySchema = z.object({
  value: z.coerce.number().int().min(1).max(5),
})

const courseProgressPatchBodySchema = z.object({
  completedLessonIds: z.array(z.string().uuid()).max(1000).default([]),
  lastLessonId: z.string().uuid().nullable().optional(),
  percentage: z.coerce.number().min(0).max(100).optional(),
})

const MAX_PROGRESS_MS = 21_600_000
const lessonProgressTickBodySchema = z.object({
  lessonId: uuidSchema,
  courseId: uuidSchema,
  positionMs: z.coerce.number().int().min(0).max(MAX_PROGRESS_MS),
  durationMs: z.coerce.number().int().min(0).max(MAX_PROGRESS_MS).optional(),
  completed: z.boolean().optional(),
  emittedAt: z.string().datetime().optional(),
})
const LESSON_PROGRESS_INTERVAL_SECONDS = 10

// Admin-only validation schemas
const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().min(10).max(2000),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private', 'members']).default('public'),
  estimatedDurationMinutes: z.coerce.number().int().min(1).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  isFeatured: z.boolean().default(false),
  coverImage: z.string().url().optional(),
  releaseDate: z.string().datetime().optional(),
})

const updateCourseSchema = createCourseSchema.partial()

const createModuleSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  order: z.coerce.number().int().min(0),
  durationMinutes: z.coerce.number().int().min(1),
  dripReleaseAt: z.string().datetime().optional(),
  dripDaysAfter: z.coerce.number().int().min(0).optional(),
  dripAfterModuleId: z.string().uuid().optional(),
})

const createLessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(3).max(200),
  summary: z.string().max(500).optional(),
  type: z.enum(['video', 'article', 'live', 'download', 'quiz']),
  content: z.object({
    video: z.object({
      videoUrl: z.string().url(),
      durationSeconds: z.coerce.number().int().min(1),
      captionsUrl: z.string().url().optional(),
      transcript: z.string().optional(),
    }).optional(),
    article: z.object({
      bodyMarkdown: z.string().min(10),
    }).optional(),
    live: z.object({
      scheduledAt: z.string().datetime(),
      meetingUrl: z.string().url(),
    }).optional(),
    download: z.object({
      assets: z.array(z.object({
        fileUrl: z.string().url(),
        fileName: z.string().min(1),
        fileSizeBytes: z.coerce.number().int().min(1),
      })).min(1),
    }).optional(),
    quiz: z.object({
      questions: z.array(z.object({
        id: z.string().uuid(),
        question: z.string().min(1),
        options: z.array(z.string()).min(2),
        correctIndex: z.coerce.number().int().min(0),
      })).min(1),
    }).optional(),
  }),
  durationMinutes: z.coerce.number().int().min(1),
  isPreview: z.boolean().default(false),
  releaseAt: z.string().datetime().optional(),
})

const createResourceCategorySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

const createResourceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().uuid(),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.coerce.number().int().min(1),
  fileType: z.string(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  isPublic: z.boolean().default(true),
})

const moderateCommentSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  commentIds: z.array(z.string().uuid()).min(1),
})

const moderateSingleCommentSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export function createAcademyRouter(services: ApiServices) {
  const router = Router()
  const authGuard = createAuthGuard(services.tokenService)

  // Admin endpoints - these should be moved to a separate admin academy router
  // but for now we'll add them here with basic auth validation
  // Role validation would need to be implemented in the service layer

  const adminGuard = createAuthGuard(services.tokenService)

  router.get('/courses', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = listQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const data = await services.academyService.getCourses(parsed.data)
      return respondSuccess(res, 200, data)
    } catch (err) {
      return next(err)
    }
  })

  router.get('/courses/featured', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = featuredQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const courses = await services.academyService.getFeaturedCourses(parsed.data.limit ?? 6)
      return respondSuccess(res, 200, courses, { limit: parsed.data.limit ?? 6 })
    } catch (err) {
      return next(err)
    }
  })

  router.get('/courses/recommended', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = recommendedQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const recommended = await services.academyService.getRecommendedCourses(req.user!.userId, parsed.data.limit ?? 6)
      const payload = recommended.map((item) => item.recommendation)
      return respondSuccess(res, 200, payload, { limit: parsed.data.limit ?? 6 })
    } catch (err) {
      return next(err)
    }
  })

  router.get('/courses/:id/tree', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const idResult = uuidSchema.safeParse(req.params.id)
    if (!idResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      const tree = await services.academyService.getCourseTree(idResult.data, { userId: req.user?.userId })
      if (!tree) {
        return respondError(res, 404, { code: 'NOT_FOUND', message: 'Curso não encontrado' })
      }
      return respondSuccess(res, 200, tree)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/progress', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = progressSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Payload inválido', parsed.error.flatten())
    }

    try {
      const progress = await services.academyService.updateProgress({
        userId: req.user!.userId,
        courseId: parsed.data.courseId,
        lessonId: parsed.data.lessonId,
      })
      return respondSuccess(res, 200, progress)
    } catch (err) {
      return next(err)
    }
  })

  router.get('/courses/:id/progress', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const courseIdResult = uuidSchema.safeParse(req.params.id)
    if (!courseIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      const progress = await services.academyService.getCourseProgress(courseIdResult.data, req.user!.userId)
      return respondSuccess(res, 200, progress)
    } catch (err) {
      return next(err)
    }
  })

  router.patch('/courses/:id/progress', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const courseIdResult = uuidSchema.safeParse(req.params.id)
    if (!courseIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    const bodyResult = courseProgressPatchBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      return respondValidationError(res, 'Payload inválido', bodyResult.error.flatten())
    }

    try {
      const progress = await services.academyService.saveCourseProgress({
        courseId: courseIdResult.data,
        userId: req.user!.userId,
        completedLessonIds: bodyResult.data.completedLessonIds ?? [],
        lastLessonId: bodyResult.data.lastLessonId ?? null,
      })
      return respondSuccess(res, 200, progress)
    } catch (err) {
      return next(err)
    }
  })

  router.get('/lessons/:id/comments', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonIdResult = uuidSchema.safeParse(req.params.id)
    if (!lessonIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    const queryResult = commentsQuerySchema.safeParse(req.query)
    if (!queryResult.success) {
      return respondValidationError(res, 'Parâmetros inválidos', queryResult.error.flatten())
    }

    try {
      const comments = await services.academyService.listLessonComments({
        lessonId: lessonIdResult.data,
        userId: req.user!.userId,
        page: queryResult.data.page,
        pageSize: queryResult.data.pageSize,
        after: queryResult.data.after,
      })
      return respondSuccess(res, 200, comments, {
        page: queryResult.data.page,
        pageSize: queryResult.data.pageSize,
      })
    } catch (err) {
      return next(err)
    }
  })

  router.get('/lessons/:id/progress', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonIdResult = uuidSchema.safeParse(req.params.id)
    if (!lessonIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      const snapshot = await services.academyService.getLessonProgressSnapshot(lessonIdResult.data, req.user!.userId)
      return respondSuccess(res, 200, snapshot, { intervalSeconds: LESSON_PROGRESS_INTERVAL_SECONDS })
    } catch (err) {
      return next(err)
    }
  })

  router.get('/lessons/:id/rating', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonIdResult = uuidSchema.safeParse(req.params.id)
    if (!lessonIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      const summary = await services.academyService.getLessonRatingSummary(lessonIdResult.data, {
        userId: req.user!.userId,
      })
      return respondSuccess(res, 200, summary)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/lessons/:id/rating', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonIdResult = uuidSchema.safeParse(req.params.id)
    if (!lessonIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    const bodyResult = lessonRatingBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      return respondValidationError(res, 'Payload inválido', bodyResult.error.flatten())
    }

    const ratingValue = bodyResult.data.value

    try {
      await services.academyService.rateLesson({
        lessonId: lessonIdResult.data,
        userId: req.user!.userId,
        value: ratingValue,
      })

      const summary = await services.academyService.getLessonRatingSummary(lessonIdResult.data, {
        userId: req.user!.userId,
      })

      return respondSuccess(res, 200, summary)
    } catch (err) {
      return next(err)
    }
  })

  router.delete('/lessons/:id/rating', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonIdResult = uuidSchema.safeParse(req.params.id)
    if (!lessonIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      await services.academyService.removeLessonRating({
        lessonId: lessonIdResult.data,
        userId: req.user!.userId,
      })
      return respondSuccess(res, 200, { ok: true as const })
    } catch (err) {
      return next(err)
    }
  })

  router.post('/lessons/:id/progress-tick', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonIdResult = uuidSchema.safeParse(req.params.id)
    if (!lessonIdResult.success) {
      return respondValidationError(res, 'ID inválido')
    }

    const bodyResult = lessonProgressTickBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      return respondValidationError(res, 'Payload inválido', bodyResult.error.flatten())
    }

    try {
      if (bodyResult.data.lessonId !== lessonIdResult.data) {
        return respondValidationError(res, 'Payload inválido', {
          fieldErrors: { lessonId: ['lessonId no corpo deve corresponder ao parâmetro de rota'] },
        })
      }

      const snapshot = await services.academyService.recordLessonProgressTick({
        lessonId: lessonIdResult.data,
        courseId: bodyResult.data.courseId,
        userId: req.user!.userId,
        positionMs: bodyResult.data.positionMs,
        durationMs: bodyResult.data.durationMs,
        completed: bodyResult.data.completed,
        emittedAt: bodyResult.data.emittedAt,
      })
      return respondSuccess(res, 200, snapshot, { intervalSeconds: LESSON_PROGRESS_INTERVAL_SECONDS })
    } catch (err) {
      return next(err)
    }
  })

  router.post('/lessons/:id/comments', authGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsedId = uuidSchema.safeParse(req.params.id)
    if (!parsedId.success) {
      return respondValidationError(res, 'ID inválido')
    }

    const parsedBody = commentSchema.safeParse(req.body)
    if (!parsedBody.success) {
      return respondValidationError(res, 'Dados inválidos', parsedBody.error.flatten())
    }

    try {
      const comment = await services.academyService.addLessonComment({
        lessonId: parsedId.data,
        userId: req.user!.userId,
        body: parsedBody.data.body,
      })
      return respondSuccess(res, 201, comment)
    } catch (err) {
      return next(err)
    }
  })

  router.post(
    '/lessons/:lessonId/comments/:commentId/replies',
    authGuard,
    async (req: Request, res: Response, next: NextFunction) => {
      const lessonId = uuidSchema.safeParse(req.params.lessonId)
      const commentId = uuidSchema.safeParse(req.params.commentId)
      if (!lessonId.success || !commentId.success) {
        return respondValidationError(res, 'Parâmetros de rota inválidos')
      }

      const bodyResult = replySchema.safeParse(req.body)
      if (!bodyResult.success) {
        return respondValidationError(res, 'Dados inválidos', bodyResult.error.flatten())
      }

      try {
        const reply = await services.academyService.addLessonCommentReply({
          commentId: commentId.data,
          userId: req.user!.userId,
          body: bodyResult.data.body,
          parentReplyId: bodyResult.data.parentReplyId,
        })
        return respondSuccess(res, 201, reply)
      } catch (err) {
        return next(err)
      }
    },
  )

  // ==================== ADMIN ENDPOINTS ====================

  // Course Management
  router.post('/admin/courses', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createCourseSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const course = await services.academyService.createCourse({
        ...parsed.data,
        createdBy: req.user!.userId,
      })
      return respondSuccess(res, 201, course)
    } catch (err) {
      return next(err)
    }
  })

  router.put('/admin/courses/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const courseId = uuidSchema.safeParse(req.params.id)
    if (!courseId.success) {
      return respondValidationError(res, 'ID inválido')
    }

    const parsed = updateCourseSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const course = await services.academyService.updateCourse(courseId.data, parsed.data)
      return respondSuccess(res, 200, course)
    } catch (err) {
      return next(err)
    }
  })

  router.delete('/admin/courses/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const courseId = uuidSchema.safeParse(req.params.id)
    if (!courseId.success) {
      return respondValidationError(res, 'ID inválido')
    }

    try {
      await services.academyService.deleteCourse(courseId.data)
      return respondSuccess(res, 204, null)
    } catch (err) {
      return next(err)
    }
  })

  // Module Management
  router.post('/admin/courses/:courseId/modules', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const courseId = uuidSchema.safeParse(req.params.courseId)
    if (!courseId.success) {
      return respondValidationError(res, 'ID do curso inválido')
    }

    const parsed = createModuleSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const module = await services.academyService.createModule({
        ...parsed.data,
        courseId: courseId.data,
      })
      return respondSuccess(res, 201, module)
    } catch (err) {
      return next(err)
    }
  })

  router.put('/admin/modules/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const moduleId = uuidSchema.safeParse(req.params.id)
    if (!moduleId.success) {
      return respondValidationError(res, 'ID do módulo inválido')
    }

    const parsed = createModuleSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const module = await services.academyService.updateModule(moduleId.data, parsed.data)
      return respondSuccess(res, 200, module)
    } catch (err) {
      return next(err)
    }
  })

  router.delete('/admin/modules/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const moduleId = uuidSchema.safeParse(req.params.id)
    if (!moduleId.success) {
      return respondValidationError(res, 'ID do módulo inválido')
    }

    try {
      await services.academyService.deleteModule(moduleId.data)
      return respondSuccess(res, 204, null)
    } catch (err) {
      return next(err)
    }
  })

  // Lesson Management
  router.post('/admin/lessons', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createLessonSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const lesson = await services.academyService.createLesson({
        ...parsed.data,
        createdBy: req.user!.userId,
      })
      return respondSuccess(res, 201, lesson)
    } catch (err) {
      return next(err)
    }
  })

  router.put('/admin/lessons/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonId = uuidSchema.safeParse(req.params.id)
    if (!lessonId.success) {
      return respondValidationError(res, 'ID da lição inválido')
    }

    const parsed = createLessonSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const lesson = await services.academyService.updateLesson(lessonId.data, parsed.data)
      return respondSuccess(res, 200, lesson)
    } catch (err) {
      return next(err)
    }
  })

  router.delete('/admin/lessons/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const lessonId = uuidSchema.safeParse(req.params.id)
    if (!lessonId.success) {
      return respondValidationError(res, 'ID da lição inválido')
    }

    try {
      await services.academyService.deleteLesson(lessonId.data)
      return respondSuccess(res, 204, null)
    } catch (err) {
      return next(err)
    }
  })

  // Comment Moderation
  router.get('/admin/comments/pending', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = commentsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return respondValidationError(res, 'Parâmetros inválidos', parsed.error.flatten())
    }

    try {
      const comments = await services.academyService.getPendingComments({
        page: parsed.data.page,
        pageSize: parsed.data.pageSize,
        after: parsed.data.after,
      })
      return respondSuccess(res, 200, comments)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/admin/comments/:id/moderate', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const commentId = uuidSchema.safeParse(req.params.id)
    if (!commentId.success) {
      return respondValidationError(res, 'ID do comentário inválido')
    }

    const parsed = moderateSingleCommentSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const comment = await services.academyService.moderateComment({
        commentId: commentId.data,
        moderatedBy: req.user!.userId,
        status: parsed.data.status,
      })
      return respondSuccess(res, 200, comment)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/admin/comments/bulk-moderate', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = moderateCommentSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      await services.academyService.bulkModerateComments({
        commentIds: parsed.data.commentIds,
        moderatedBy: req.user!.userId,
        status: parsed.data.status,
      })
      return respondSuccess(res, 200, { moderated: parsed.data.commentIds.length })
    } catch (err) {
      return next(err)
    }
  })

  // Resource Categories Management
  router.get('/admin/resources/categories', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await services.cybervaultService.getResourceCategories()
      return respondSuccess(res, 200, categories)
    } catch (err) {
      return next(err)
    }
  })

  router.post('/admin/resources/categories', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createResourceCategorySchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const category = await services.cybervaultService.createResourceCategory({
        ...parsed.data,
        createdBy: req.user!.userId,
      })
      return respondSuccess(res, 201, category)
    } catch (err) {
      return next(err)
    }
  })

  router.put('/admin/resources/categories/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const categoryId = uuidSchema.safeParse(req.params.id)
    if (!categoryId.success) {
      return respondValidationError(res, 'ID da categoria inválido')
    }

    const parsed = createResourceCategorySchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const category = await services.cybervaultService.updateResourceCategory(categoryId.data, parsed.data)
      return respondSuccess(res, 200, category)
    } catch (err) {
      return next(err)
    }
  })

  // Resource Management
  router.post('/admin/resources', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createResourceSchema.safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const resource = await services.cybervaultService.createResource({
        ...parsed.data,
        createdBy: req.user!.userId,
        downloadCount: 0,
      })
      return respondSuccess(res, 201, resource)
    } catch (err) {
      return next(err)
    }
  })

  router.put('/admin/resources/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = uuidSchema.safeParse(req.params.id)
    if (!resourceId.success) {
      return respondValidationError(res, 'ID do recurso inválido')
    }

    const parsed = createResourceSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return respondValidationError(res, 'Dados inválidos', parsed.error.flatten())
    }

    try {
      const resource = await services.cybervaultService.updateResource(resourceId.data, parsed.data)
      return respondSuccess(res, 200, resource)
    } catch (err) {
      return next(err)
    }
  })

  router.delete('/admin/resources/:id', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = uuidSchema.safeParse(req.params.id)
    if (!resourceId.success) {
      return respondValidationError(res, 'ID do recurso inválido')
    }

    try {
      await services.cybervaultService.deleteResource(resourceId.data)
      return respondSuccess(res, 204, null)
    } catch (err) {
      return next(err)
    }
  })

  // Analytics
  router.get('/admin/analytics/courses', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const analytics = await services.academyService.getCourseAnalytics()
      return respondSuccess(res, 200, analytics)
    } catch (err) {
      return next(err)
    }
  })

  router.get('/admin/analytics/engagement', adminGuard, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const analytics = await services.academyService.getEngagementAnalytics()
      return respondSuccess(res, 200, analytics)
    } catch (err) {
      return next(err)
    }
  })

  return router
}
