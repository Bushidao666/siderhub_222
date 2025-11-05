import request from 'supertest'
import type { Express } from 'express'
import { buildTestApp } from '../setup/supertest-app'
import type { ApiServices } from 'src/backend/api/types'
import { UserRole } from '@shared/types/common.types'
import { AppError } from 'src/backend/errors/AppError'

const baseCoursesResponse = {
  items: [
    {
      id: 'course-1',
      slug: 'intro',
      title: 'Intro Course',
      subtitle: 'Basics',
      description: 'Learn the basics',
      coverImage: null,
      level: 'beginner',
      status: 'published',
      visibility: 'members',
      estimatedDurationMinutes: 60,
      totalLessons: 10,
      tags: ['start'],
      releaseDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  page: 1,
  pageSize: 12,
  totalItems: 1,
  totalPages: 1,
}

const baseFeaturedCourses = [
  {
    id: 'course-1',
    slug: 'intro',
    title: 'Intro Course',
    subtitle: 'Basics',
    description: 'Learn the basics',
    coverImage: null,
    level: 'beginner',
    status: 'published',
    visibility: 'members',
    estimatedDurationMinutes: 60,
    totalLessons: 10,
    tags: ['start'],
    releaseDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const baseRecommendations = [
  {
    course: baseFeaturedCourses[0],
    recommendation: {
      courseId: 'course-1',
      reason: 'based_on_activity',
      badge: 'popular',
    },
  },
]

const baseProgressResponse = {
  id: 'progress-1',
  userId: 'u-1',
  courseId: '123e4567-e89b-12d3-a456-426614174002',
  completedLessonIds: ['123e4567-e89b-12d3-a456-426614174003'],
  percentage: 100,
  lastLessonId: '123e4567-e89b-12d3-a456-426614174003',
  updatedAt: new Date().toISOString(),
}

const baseLessonProgressSnapshot = {
  lessonId: '123e4567-e89b-12d3-a456-426614174004',
  courseId: '123e4567-e89b-12d3-a456-426614174002',
  userId: 'u-1',
  lastPositionMs: 120_000,
  percentage: 60,
  completed: false,
  updatedAt: new Date().toISOString(),
}

const baseCommentResponse = {
  id: 'comment-1',
  lessonId: '123e4567-e89b-12d3-a456-426614174004',
  userId: 'u-1',
  body: 'Great lesson',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pendingModeration: false,
  moderationStatus: 'approved',
  moderatedById: null,
  moderatedAt: null,
  replies: [],
}

const baseLessonComments = [baseCommentResponse]

function buildAcademyServiceMock(overrides: Record<string, unknown> = {}) {
  return {
    getCourses: async () => baseCoursesResponse,
    getCourseTree: async () => null,
    getFeaturedCourses: async () => baseFeaturedCourses,
    getRecommendedCourses: async () => baseRecommendations,
    updateProgress: async () => baseProgressResponse,
    getCourseProgress: async () => baseProgressResponse,
    saveCourseProgress: async () => baseProgressResponse,
    addLessonComment: async () => baseCommentResponse,
    rateLesson: async () => ({
      id: 'rating-1',
      lessonId: '123e4567-e89b-12d3-a456-426614174004',
      userId: 'u-1',
      value: 5,
      createdAt: new Date().toISOString(),
    }),
    getLessonRatingSummary: async () => ({
      lessonId: '123e4567-e89b-12d3-a456-426614174004',
      average: 4.5,
      totalRatings: 12,
      userRating: 5,
    }),
    removeLessonRating: async () => undefined,
    recordLessonProgressTick: async () => baseLessonProgressSnapshot,
    getLessonProgressSnapshot: async () => baseLessonProgressSnapshot,
    listLessonComments: async () => baseLessonComments,
    ...overrides,
  }
}

function makeApp(overrides: Partial<ApiServices> = {}): Express {
  const { academyService: academyOverrides, ...restOverrides } = overrides
  const tokenService = {
    verifyAccessToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
    generateAccessToken: () => 'access',
    generateRefreshToken: () => 'refresh',
    verifyRefreshToken: (_: string) => ({ userId: 'u-1', sessionId: 's-1', role: UserRole.Member }),
  } as any

  const academyServiceOverrides = academyOverrides
    ? (academyOverrides as unknown as Record<string, unknown>)
    : {}
  const academyService = buildAcademyServiceMock(academyServiceOverrides)

  const services = {
    authService: {} as any,
    tokenService,
    academyService,
    hidraService: {} as any,
    cybervaultService: {} as any,
    adminService: {} as any,
    hubService: {
      getOverview: async () => ({
        banners: [],
        academy: { featured: [], recommendations: [] },
        hidra: null,
        cybervault: { featuredResources: [] },
        generatedAt: new Date().toISOString(),
      }),
      getActiveBanners: async () => [],
    } as any,
    ...restOverrides,
  } as unknown as ApiServices

  return buildTestApp(services)
}

describe('Academy API', () => {
  it('returns paginated courses', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/academy/courses?page=1')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.items?.[0]?.id).toBe('course-1')
    expect(res.body?.data?.page).toBe(1)
  })

  it('validates progress payload', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/academy/progress')
      .set('Authorization', 'Bearer token')
      .send({ courseId: 'not-a-uuid' })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('updates progress for valid body', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/academy/progress')
      .set('Authorization', 'Bearer token')
      .send({
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        lessonId: '123e4567-e89b-12d3-a456-426614174003',
      })

    expect(res.status).toBe(200)
    expect(res.body?.data?.percentage).toBe(100)
  })

  it('returns course progress snapshot for authenticated user', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/academy/courses/123e4567-e89b-12d3-a456-426614174002/progress')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.courseId).toBe('123e4567-e89b-12d3-a456-426614174002')
    expect(res.body?.data?.completedLessonIds?.length).toBeGreaterThanOrEqual(0)
  })

  it('updates course progress snapshot via PATCH', async () => {
    const saveCourseProgress = jest.fn().mockResolvedValue({
      courseId: '123e4567-e89b-12d3-a456-426614174002',
      userId: 'u-1',
      completedLessonIds: [
        '123e4567-e89b-12d3-a456-426614174010',
        '123e4567-e89b-12d3-a456-426614174011',
      ],
      percentage: 42,
      lastLessonId: '123e4567-e89b-12d3-a456-426614174011',
      updatedAt: new Date().toISOString(),
    })
    const app = makeApp({ academyService: { saveCourseProgress } as any })

    const res = await request(app)
      .patch('/api/academy/courses/123e4567-e89b-12d3-a456-426614174002/progress')
      .set('Authorization', 'Bearer token')
      .send({
        completedLessonIds: [
          '123e4567-e89b-12d3-a456-426614174010',
          '123e4567-e89b-12d3-a456-426614174011',
        ],
        lastLessonId: '123e4567-e89b-12d3-a456-426614174011',
        percentage: 90,
      })

    expect(res.status).toBe(200)
    expect(saveCourseProgress).toHaveBeenCalledWith({
      courseId: '123e4567-e89b-12d3-a456-426614174002',
      userId: 'u-1',
      completedLessonIds: [
        '123e4567-e89b-12d3-a456-426614174010',
        '123e4567-e89b-12d3-a456-426614174011',
      ],
      lastLessonId: '123e4567-e89b-12d3-a456-426614174011',
    })
    expect(res.body?.data?.percentage).toBe(42)
  })

  it('validates course progress payload on PATCH', async () => {
    const app = makeApp()
    const res = await request(app)
      .patch('/api/academy/courses/123e4567-e89b-12d3-a456-426614174002/progress')
      .set('Authorization', 'Bearer token')
      .send({
        completedLessonIds: ['not-a-uuid'],
      })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('creates lesson comment', async () => {
    let receivedBody: string | null = null
    const customAcademyService = {
      getCourses: async () => baseCoursesResponse,
      getCourseTree: async () => null,
      updateProgress: async () => baseProgressResponse,
      addLessonComment: async ({ body }: { body: string }) => {
        receivedBody = body
        return { ...baseCommentResponse, body }
      },
    }

    const app = makeApp({ academyService: customAcademyService as any })
    const res = await request(app)
      .post('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/comments')
      .set('Authorization', 'Bearer token')
      .send({ body: 'Nice lesson!' })

    expect(res.status).toBe(201)
    expect(res.body?.data?.body).toBe('Nice lesson!')
    expect(receivedBody).toBe('Nice lesson!')
  })

  it('creates lesson comment reply', async () => {
    const addLessonCommentReply = jest.fn().mockResolvedValue({
      id: 'reply-1',
      commentId: '123e4567-e89b-12d3-a456-426614170000',
      parentReplyId: null,
      userId: 'u-1',
      body: 'I agree',
      createdAt: new Date().toISOString(),
      pendingModeration: false,
      moderationStatus: 'approved',
      moderatedById: null,
      moderatedAt: null,
      replies: [],
    })

    const app = makeApp({
      academyService: { addLessonCommentReply } as any,
    })

    const res = await request(app)
      .post(
        '/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/comments/123e4567-e89b-12d3-a456-426614170000/replies',
      )
      .set('Authorization', 'Bearer token')
      .send({ body: 'I agree' })

    expect(res.status).toBe(201)
    expect(addLessonCommentReply).toHaveBeenCalledWith(
      expect.objectContaining({
        commentId: '123e4567-e89b-12d3-a456-426614170000',
        userId: 'u-1',
        body: 'I agree',
      }),
    )
    expect(res.body?.data?.id).toBe('reply-1')
  })

  it('lists lesson comments with pagination defaults', async () => {
    const commentsStub = [
      {
        ...baseCommentResponse,
        id: 'comment-2',
        createdAt: '2025-01-02T12:00:00Z',
        updatedAt: '2025-01-02T12:00:00Z',
        pendingModeration: true,
        moderationStatus: 'pending',
        replies: [
          {
            id: 'reply-1',
            commentId: 'comment-2',
            parentReplyId: null,
            userId: 'u-2',
            body: 'First reply',
            createdAt: '2025-01-02T12:01:00Z',
            pendingModeration: true,
            moderationStatus: 'pending',
            moderatedById: null,
            moderatedAt: null,
            replies: [
              {
                id: 'reply-2',
                commentId: 'comment-2',
                parentReplyId: 'reply-1',
                userId: 'u-3',
                body: 'Nested reply',
                createdAt: '2025-01-02T12:02:00Z',
                pendingModeration: false,
                moderationStatus: 'approved',
                moderatedById: 'mentor-1',
                moderatedAt: '2025-01-03T10:00:00Z',
                replies: [],
              },
            ],
          },
        ],
      },
    ]

    const listLessonComments = jest.fn().mockResolvedValue(commentsStub)
    const app = makeApp({ academyService: { listLessonComments } as any })

    const res = await request(app)
      .get('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/comments')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data).toEqual(commentsStub)
    expect(res.body?.data?.[0]?.pendingModeration).toBe(true)
    expect(res.body?.data?.[0]?.replies?.[0]?.replies?.[0]?.id).toBe('reply-2')
    expect(res.body?.meta).toMatchObject({ page: 1, pageSize: 20 })
    expect(listLessonComments).toHaveBeenCalledWith({
      lessonId: '123e4567-e89b-12d3-a456-426614174004',
      userId: 'u-1',
      page: 1,
      pageSize: 20,
      after: undefined,
    })
  })

  it('returns featured courses respecting limit meta', async () => {
    const getFeaturedCourses = jest.fn().mockResolvedValue(baseFeaturedCourses)
    const app = makeApp({ academyService: { getFeaturedCourses } as any })

    const res = await request(app)
      .get('/api/academy/courses/featured?limit=3')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.meta?.limit).toBe(3)
    expect(res.body?.data?.[0]?.id).toBe('course-1')
    expect(getFeaturedCourses).toHaveBeenCalledWith(3)
  })

  it('returns recommended course DTOs for current user', async () => {
    const getRecommendedCourses = jest.fn().mockResolvedValue(baseRecommendations)
    const app = makeApp({ academyService: { getRecommendedCourses } as any })

    const res = await request(app)
      .get('/api/academy/courses/recommended')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.[0]?.courseId).toBe('course-1')
    expect(getRecommendedCourses).toHaveBeenCalledWith('u-1', 6)
  })

  it('rates a lesson successfully returning summary', async () => {
    const summary = {
      lessonId: '123e4567-e89b-12d3-a456-426614174004',
      average: 4.7,
      totalRatings: 13,
      userRating: 4,
    }
    const rateLesson = jest.fn().mockResolvedValue({
      id: 'rating-1',
      lessonId: summary.lessonId,
      userId: 'u-1',
      value: 4,
      createdAt: new Date().toISOString(),
    })
    const getLessonRatingSummary = jest.fn().mockResolvedValue(summary)
    const app = makeApp({
      academyService: {
        rateLesson,
        getLessonRatingSummary,
      } as any,
    })
    const res = await request(app)
      .post('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/rating')
      .set('Authorization', 'Bearer token')
      .send({ value: 4 })

    expect(res.status).toBe(200)
    expect(res.body?.data).toEqual(summary)
    expect(rateLesson).toHaveBeenCalledWith({
      lessonId: '123e4567-e89b-12d3-a456-426614174004',
      userId: 'u-1',
      value: 4,
    })
    expect(getLessonRatingSummary).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174004', {
      userId: 'u-1',
    })
  })

  it('validates rating payload', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/rating')
      .set('Authorization', 'Bearer token')
      .send({ value: 9 })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('returns 403 when lesson is locked for rating', async () => {
    const app = makeApp({
      academyService: {
        rateLesson: async () => {
          throw new AppError({ code: 'ACADEMY_LESSON_LOCKED', message: 'locked', statusCode: 403 })
        },
      } as any,
    })

    const res = await request(app)
      .post('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/rating')
      .set('Authorization', 'Bearer token')
      .send({ value: 4 })

    expect(res.status).toBe(403)
    expect(res.body?.error?.code).toBe('ACADEMY_LESSON_LOCKED')
  })

  it('returns lesson rating summary', async () => {
    const app = makeApp()
    const res = await request(app)
      .get('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/rating')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.average).toBe(4.5)
  })

  it('removes a lesson rating', async () => {
    let removed = false
    const app = makeApp({
      academyService: {
        removeLessonRating: async () => {
          removed = true
        },
      } as any,
    })

    const res = await request(app)
      .delete('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/rating')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.ok).toBe(true)
    expect(removed).toBe(true)
  })

  it('records lesson progress tick', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/progress-tick')
      .set('Authorization', 'Bearer token')
      .send({
        lessonId: '123e4567-e89b-12d3-a456-426614174004',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        positionMs: 90_000,
      })

    expect(res.status).toBe(200)
    expect(res.body?.data?.lastPositionMs).toBeGreaterThan(0)
    expect(res.body?.meta?.intervalSeconds).toBe(10)
  })

  it('validates progress tick payload', async () => {
    const app = makeApp()
    const res = await request(app)
      .post('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/progress-tick')
      .set('Authorization', 'Bearer token')
      .send({
        lessonId: '123e4567-e89b-12d3-a456-426614174004',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        positionMs: -10,
      })

    expect(res.status).toBe(400)
    expect(res.body?.error?.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when progress tick targets missing lesson', async () => {
    const app = makeApp({
      academyService: {
        recordLessonProgressTick: async () => {
          throw new AppError({ code: 'ACADEMY_LESSON_NOT_FOUND', message: 'not found', statusCode: 404 })
        },
      } as any,
    })

    const res = await request(app)
      .post('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174888/progress-tick')
      .set('Authorization', 'Bearer token')
      .send({
        lessonId: '123e4567-e89b-12d3-a456-426614174888',
        courseId: '123e4567-e89b-12d3-a456-426614174002',
        positionMs: 30_000,
      })

    expect(res.status).toBe(404)
    expect(res.body?.error?.code).toBe('ACADEMY_LESSON_NOT_FOUND')
  })

  it('returns lesson progress snapshot', async () => {
    const getLessonProgressSnapshot = jest.fn().mockResolvedValue(baseLessonProgressSnapshot)
    const app = makeApp({ academyService: { getLessonProgressSnapshot } as any })

    const res = await request(app)
      .get('/api/academy/lessons/123e4567-e89b-12d3-a456-426614174004/progress')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body?.data?.lessonId).toBe(baseLessonProgressSnapshot.lessonId)
    expect(res.body?.meta?.intervalSeconds).toBe(10)
    expect(getLessonProgressSnapshot).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174004',
      'u-1',
    )
  })
})
