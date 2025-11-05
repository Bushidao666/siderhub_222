import request from 'supertest';
import type { Express } from 'express';

import type { ApiServices } from 'src/backend/api/types';
import { buildTestApp } from '../setup/supertest-app';
import { UserRole } from '@shared/types/common.types';
import type {
  LessonComment,
  LessonProgressSnapshot,
  LessonRatingSummary,
} from '@shared/types/academy.types';

const AUTH_HEADER = { Authorization: 'Bearer member-token' } as const;
const MEMBER_ID = 'member-1';
const LESSON_ID = '123e4567-e89b-12d3-a456-426614174000';

function makeApp(overrides: Partial<ApiServices> = {}) {
  const tokenService = overrides.tokenService ?? {
    verifyAccessToken: () => ({ userId: MEMBER_ID, sessionId: 'session-1', role: UserRole.Member }),
    generateAccessToken: () => 'access-token',
    generateRefreshToken: () => 'refresh-token',
    verifyRefreshToken: () => ({ userId: MEMBER_ID, sessionId: 'session-1', role: UserRole.Member }),
  };

  const defaultAcademyService = {
    getLessonRatingSummary: jest.fn(),
    rateLesson: jest.fn(),
    removeLessonRating: jest.fn(),
    getCourses: jest.fn(),
    getFeaturedCourses: jest.fn(),
    getRecommendedCourses: jest.fn(),
    getCourseTree: jest.fn(),
    updateProgress: jest.fn(),
    getCourseProgress: jest.fn(),
    saveCourseProgress: jest.fn(),
    listLessonComments: jest.fn(),
    getLessonProgressSnapshot: jest.fn(),
    recordLessonProgressTick: jest.fn(),
    addLessonComment: jest.fn(),
    addLessonCommentReply: jest.fn(),
  };

  const academyService = overrides.academyService
    ? { ...defaultAcademyService, ...overrides.academyService }
    : defaultAcademyService;

  const services: ApiServices = {
    authService: overrides.authService ?? ({} as any),
    tokenService: tokenService as ApiServices['tokenService'],
    academyService: academyService as any,
    hidraService: overrides.hidraService ?? ({} as any),
    cybervaultService: overrides.cybervaultService ?? ({} as any),
    adminService: overrides.adminService ?? ({} as any),
    hubService:
      overrides.hubService ??
      ({
        getOverview: async () => ({
          banners: [],
          academy: { featured: [], recommendations: [] },
          hidra: null,
          cybervault: { featuredResources: [] },
          generatedAt: new Date().toISOString(),
        }),
        getActiveBanners: async () => [],
      } as any),
  };

  const app = buildTestApp(services);
  return { app, services } as { app: Express; services: ApiServices };
}

describe('Academy API integration', () => {
  const sampleComment: LessonComment = {
    id: 'comment-1',
    lessonId: LESSON_ID,
    userId: 'mentor-1',
    body: 'A aula ficou excelente!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pendingModeration: false,
    moderationStatus: 'approved',
    moderatedById: 'admin-1',
    moderatedAt: new Date().toISOString(),
    replies: [
      {
        id: 'reply-1',
        commentId: 'comment-1',
        parentReplyId: null,
        userId: 'member-2',
        body: 'Obrigado pelo feedback!',
        createdAt: new Date().toISOString(),
        pendingModeration: false,
        moderationStatus: 'approved',
        moderatedById: null,
        moderatedAt: null,
        replies: [],
      },
    ],
  };

  const progressSnapshot: LessonProgressSnapshot = {
    lessonId: LESSON_ID,
    courseId: 'course-1',
    userId: MEMBER_ID,
    lastPositionMs: 42000,
    percentage: 65,
    completed: false,
    updatedAt: new Date().toISOString(),
  };

  describe('GET /api/academy/lessons/:id/rating', () => {
    it('returns lesson rating summary for authenticated member', async () => {
      const summary: LessonRatingSummary = {
        lessonId: LESSON_ID,
        average: 4.6,
        totalRatings: 12,
        userRating: 5,
      };

      const { app, services } = makeApp();
      (services.academyService.getLessonRatingSummary as jest.Mock).mockResolvedValue(summary);

      const res = await request(app)
        .get(`/api/academy/lessons/${LESSON_ID}/rating`)
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body?.data).toEqual(summary);
      expect(res.body?.success).toBe(true);
      expect(services.academyService.getLessonRatingSummary).toHaveBeenCalledWith(LESSON_ID, {
        userId: MEMBER_ID,
      });
    });

    it('rejects invalid lesson id', async () => {
      const { app } = makeApp();

      const res = await request(app)
        .get('/api/academy/lessons/not-a-uuid/rating')
        .set(AUTH_HEADER);

      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/academy/lessons/:id/rating', () => {
    it('records member rating and returns updated summary', async () => {
      const summary: LessonRatingSummary = {
        lessonId: LESSON_ID,
        average: 4.2,
        totalRatings: 18,
        userRating: 4,
      };

      const { app, services } = makeApp();
      (services.academyService.rateLesson as jest.Mock).mockResolvedValue(undefined);
      (services.academyService.getLessonRatingSummary as jest.Mock).mockResolvedValue(summary);

      const res = await request(app)
        .post(`/api/academy/lessons/${LESSON_ID}/rating`)
        .set(AUTH_HEADER)
        .send({ value: 4 });

      expect(res.status).toBe(200);
      expect(services.academyService.rateLesson).toHaveBeenCalledWith({
        lessonId: LESSON_ID,
        userId: MEMBER_ID,
        value: 4,
      });
      expect(services.academyService.getLessonRatingSummary).toHaveBeenCalledWith(LESSON_ID, {
        userId: MEMBER_ID,
      });
      expect(res.body?.data).toEqual(summary);
    });

    it('validates rating payload bounds', async () => {
      const { app, services } = makeApp();

      const res = await request(app)
        .post(`/api/academy/lessons/${LESSON_ID}/rating`)
        .set(AUTH_HEADER)
        .send({ value: 9 });

      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
      expect(services.academyService.rateLesson).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/academy/lessons/:id/rating', () => {
    it('removes member rating and acknowledges', async () => {
      const { app, services } = makeApp();
      (services.academyService.removeLessonRating as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete(`/api/academy/lessons/${LESSON_ID}/rating`)
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body?.data?.ok).toBe(true);
      expect(services.academyService.removeLessonRating).toHaveBeenCalledWith({
        lessonId: LESSON_ID,
        userId: MEMBER_ID,
      });
    });
  });

  describe('GET /api/academy/lessons/:id/comments', () => {
    it('returns paginated comments with nested replies', async () => {
      const { app, services } = makeApp();
      (services.academyService.listLessonComments as jest.Mock).mockResolvedValue([sampleComment]);

      const after = '123e4567-e89b-12d3-a456-426614174111';
      const res = await request(app)
        .get(`/api/academy/lessons/${LESSON_ID}/comments?page=2&pageSize=5&after=${after}`)
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body?.data?.[0]?.id).toBe('comment-1');
      expect(res.body?.data?.[0]?.replies?.[0]?.id).toBe('reply-1');
      expect(res.body?.meta).toMatchObject({ page: 2, pageSize: 5 });
      expect(services.academyService.listLessonComments).toHaveBeenCalledWith({
        lessonId: LESSON_ID,
        userId: MEMBER_ID,
        page: 2,
        pageSize: 5,
        after,
      });
    });

    it('validates pagination query params', async () => {
      const { app, services } = makeApp();

      const res = await request(app)
        .get(`/api/academy/lessons/${LESSON_ID}/comments?page=0&pageSize=500`)
        .set(AUTH_HEADER);

      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
      expect(services.academyService.listLessonComments).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/academy/lessons/:id/comments', () => {
    it('adds lesson comment on behalf of the member', async () => {
      const { app, services } = makeApp();
      (services.academyService.addLessonComment as jest.Mock).mockResolvedValue(sampleComment);

      const res = await request(app)
        .post(`/api/academy/lessons/${LESSON_ID}/comments`)
        .set(AUTH_HEADER)
        .send({ body: 'Muita informação prática, gostei!' });

      expect(res.status).toBe(201);
      expect(res.body?.data?.id).toBe('comment-1');
      expect(services.academyService.addLessonComment).toHaveBeenCalledWith({
        lessonId: LESSON_ID,
        userId: MEMBER_ID,
        body: 'Muita informação prática, gostei!',
      });
    });

    it('rejects invalid payload', async () => {
      const { app, services } = makeApp();

      const res = await request(app)
        .post(`/api/academy/lessons/${LESSON_ID}/comments`)
        .set(AUTH_HEADER)
        .send({ body: 'ok' });

      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
      expect(services.academyService.addLessonComment).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/academy/lessons/:lessonId/comments/:commentId/replies', () => {
    it('rejects invalid reply payload (min length)', async () => {
      const { app, services } = makeApp();
      const res = await request(app)
        .post(`/api/academy/lessons/${LESSON_ID}/comments/comment-1/replies`)
        .set(AUTH_HEADER)
        .send({ body: 'hey' }); // below min(4)

      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
      expect((services.academyService.addLessonCommentReply as jest.Mock)).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/academy/lessons/:id/progress', () => {
    it('returns snapshot with interval meta', async () => {
      const { app, services } = makeApp();
      (services.academyService.getLessonProgressSnapshot as jest.Mock).mockResolvedValue(progressSnapshot);

      const res = await request(app)
        .get(`/api/academy/lessons/${LESSON_ID}/progress`)
        .set(AUTH_HEADER);

      expect(res.status).toBe(200);
      expect(res.body?.data).toEqual(progressSnapshot);
      expect(res.body?.meta?.intervalSeconds).toBe(10);
      expect(services.academyService.getLessonProgressSnapshot).toHaveBeenCalledWith(
        LESSON_ID,
        MEMBER_ID,
      );
    });

    it('validates lesson id', async () => {
      const { app, services } = makeApp();

      const res = await request(app)
        .get('/api/academy/lessons/not-a-uuid/progress')
        .set(AUTH_HEADER);

      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
      expect(services.academyService.getLessonProgressSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/academy/lessons/:id/progress-tick', () => {
    it('records tick when payload lessonId matches route param', async () => {
      const { app, services } = makeApp();
      (services.academyService.recordLessonProgressTick as jest.Mock).mockResolvedValue(progressSnapshot);

      const res = await request(app)
        .post(`/api/academy/lessons/${LESSON_ID}/progress-tick`)
        .set(AUTH_HEADER)
        .send({
          lessonId: LESSON_ID,
          courseId: '123e4567-e89b-12d3-a456-426614174100',
          positionMs: 42000,
          durationMs: 90000,
          completed: false,
          emittedAt: '2025-11-03T12:00:00.000Z',
        });

      expect(res.status).toBe(200);
      expect(res.body?.meta?.intervalSeconds).toBe(10);
      expect(services.academyService.recordLessonProgressTick).toHaveBeenCalledWith({
        lessonId: LESSON_ID,
        courseId: '123e4567-e89b-12d3-a456-426614174100',
        userId: MEMBER_ID,
        positionMs: 42000,
        durationMs: 90000,
        completed: false,
        emittedAt: '2025-11-03T12:00:00.000Z',
      });
    });

    it('rejects mismatched lesson ids', async () => {
      const { app, services } = makeApp();

      const res = await request(app)
        .post(`/api/academy/lessons/${LESSON_ID}/progress-tick`)
        .set(AUTH_HEADER)
        .send({
          lessonId: '123e4567-e89b-12d3-a456-426614174999',
          courseId: '123e4567-e89b-12d3-a456-426614174100',
          positionMs: 1000,
        });

      expect(res.status).toBe(400);
      expect(res.body?.error?.code).toBe('VALIDATION_ERROR');
      expect(services.academyService.recordLessonProgressTick).not.toHaveBeenCalled();
    });
  });
});
