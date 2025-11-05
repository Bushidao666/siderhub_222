import { z } from 'zod';
import type {
  CourseMeta,
  CourseModule,
  CourseProgress,
  CourseRecommendation,
  CourseTree,
  Lesson,
  LessonComment,
  LessonCommentModerationStatus,
  LessonCommentReply,
  LessonProgressAggregate,
  LessonProgressSnapshot,
  LessonRating,
  LessonRatingSummary,
} from '@shared/types/academy.types';
import type { PaginatedResponse, Nullable, UUID } from '@shared/types';
import type { CommentModerationItem } from '@shared/types/admin.types';
import { CourseStatus, LessonType, Visibility } from '@shared/types/common.types';
import { AppError } from '../../errors/AppError';
import type { Logger } from '../../logger';
import { createLogger } from '../../logger';
import type {
  CourseListQuery,
  CourseListResult,
  CourseProgressRepository,
  CourseRepository,
  CourseRecommendationRepository,
  LessonCommentRepository,
  LessonCommentReplyRepository,
  LessonProgressRepository,
  LessonRatingRepository,
  LessonRepository,
  LessonWithCourse,
} from '../../repositories/academy';
import type { UserRepository } from '../../repositories/auth/UserRepository';

export interface GetCoursesParams {
  page?: number;
  pageSize?: number;
  status?: CourseStatus;
  visibility?: Visibility;
  tag?: string;
  search?: string;
}

export interface GetCourseTreeContext {
  userId?: UUID;
}

export interface AcademyServiceDeps {
  courseRepository: CourseRepository;
  lessonRepository: LessonRepository;
  progressRepository: CourseProgressRepository;
  lessonCommentRepository: LessonCommentRepository;
  lessonCommentReplyRepository: LessonCommentReplyRepository;
  recommendationRepository: CourseRecommendationRepository;
  lessonRatingRepository: LessonRatingRepository;
  lessonProgressRepository: LessonProgressRepository;
  userRepository: UserRepository;
  logger?: Logger;
  now?: () => Date;
}

export interface RecommendedCourse {
  course: CourseMeta;
  recommendation: CourseRecommendation;
}

const listCoursesSchema = z
  .object({
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    status: z.nativeEnum(CourseStatus).optional(),
    visibility: z.nativeEnum(Visibility).optional(),
    tag: z.string().min(1).max(50).optional(),
    search: z.string().min(2).max(160).optional(),
  })
  .default({});

const updateProgressSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
});

const courseProgressPatchSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  completedLessonIds: z.array(z.string().uuid()).max(1000).default([]),
  lastLessonId: z.string().uuid().nullable().optional(),
});

const addLessonCommentSchema = z.object({
  lessonId: z.string().uuid(),
  userId: z.string().uuid(),
  body: z.string().trim().min(4).max(1200),
});

const listLessonCommentsSchema = z.object({
  lessonId: z.string().uuid(),
  userId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  after: z.string().uuid().optional(),
});

const addLessonCommentReplySchema = z.object({
  commentId: z.string().uuid(),
  userId: z.string().uuid(),
  body: z.string().trim().min(4).max(1200),
  parentReplyId: z.string().uuid().optional(),
});

const listPendingCommentsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'rejected']).optional(),
});

const moderationListSchema = z.object({
  status: z.enum(['pending', 'rejected']).default('pending'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const moderateCommentSchema = z.object({
  commentId: z.string().uuid(),
  moderatorId: z.string().uuid(),
});

const moderateReplySchema = z.object({
  commentId: z.string().uuid(),
  replyId: z.string().uuid(),
  moderatorId: z.string().uuid(),
});

const featuredLimitSchema = z.number().int().min(1).max(24).default(6);
const recommendedLimitSchema = z.number().int().min(1).max(24).default(6);

const lessonRatingSchema = z.object({
  lessonId: z.string().uuid(),
  userId: z.string().uuid(),
  value: z.number().int().min(1).max(5),
});

const MAX_LESSON_PROGRESS_MS = 21_600_000; // 6h safety cap
const MAX_REPLY_DEPTH = 3;

const lessonProgressTickSchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid(),
  userId: z.string().uuid(),
  positionMs: z.number().int().min(0).max(MAX_LESSON_PROGRESS_MS),
  durationMs: z.number().int().min(0).max(MAX_LESSON_PROGRESS_MS).optional(),
  completed: z.boolean().optional(),
  emittedAt: z.string().datetime().optional(),
});

export class AcademyService {
  private readonly logger: Logger;

  constructor(private readonly deps: AcademyServiceDeps) {
    this.logger = deps.logger ?? createLogger('AcademyService');
  }

  async getCourses(params: GetCoursesParams = {}): Promise<PaginatedResponse<CourseMeta>> {
    const parsed = listCoursesSchema.parse(params);
    const query: CourseListQuery = {
      page: parsed.page ?? 1,
      pageSize: parsed.pageSize ?? 12,
      status: parsed.status,
      visibility: parsed.visibility,
      tag: parsed.tag,
      search: parsed.search,
    } satisfies CourseListQuery;

    const result = await this.deps.courseRepository.list(query);
    return this.toPaginatedResponse(query, result);
  }

  async getCourseTree(courseId: UUID, context?: GetCourseTreeContext): Promise<CourseTree | null> {
    const validatedCourseId = z.string().uuid().parse(courseId);
    const course = await this.deps.courseRepository.findTreeById(validatedCourseId);
    if (!course) {
      return null;
    }

    const now = this.now();
    let completedLessons = new Set<UUID>();
    if (context?.userId) {
      const progress = await this.deps.progressRepository.getByUserAndCourse(context.userId, validatedCourseId);
      completedLessons = new Set(progress?.completedLessonIds ?? []);
    }

    const modules = course.modules
      .map((module) => ({
        ...module,
        lessons: module.lessons.filter((lesson) =>
          this.isLessonAccessible(lesson, module, course, now, completedLessons),
        ),
      }))
      .filter((module) => module.lessons.length > 0);

    return { ...course, modules } satisfies CourseTree;
  }

  async getFeaturedCourses(limit = 6): Promise<CourseMeta[]> {
    const parsedLimit = featuredLimitSchema.parse(limit);
    return this.deps.courseRepository.listFeatured(parsedLimit);
  }

  async getRecommendedCourses(userId: UUID, limit = 6): Promise<RecommendedCourse[]> {
    const validatedUserId = z.string().uuid().parse(userId);
    const parsedLimit = recommendedLimitSchema.parse(limit);

    let recommendations = await this.deps.recommendationRepository.listForUser(validatedUserId, parsedLimit);
    if (recommendations.length === 0) {
      recommendations = await this.deps.recommendationRepository.listGlobal(parsedLimit);
    }
    if (recommendations.length === 0) {
      return [];
    }

    const courseIds = Array.from(new Set(recommendations.map((rec) => rec.courseId)));
    const courses = await this.deps.courseRepository.findByIds(courseIds);
    const courseMap = new Map(courses.map((course) => [course.id, course]));

    return recommendations
      .map((recommendation) => {
        const course = courseMap.get(recommendation.courseId);
        if (!course) {
          this.logger.warn('Recommendation course missing', {
            code: 'ACADEMY_RECOMMENDATION_MISSING_COURSE',
            courseId: recommendation.courseId,
            userId: validatedUserId,
          });
          return null;
        }
        return { course, recommendation } satisfies RecommendedCourse;
      })
      .filter((value): value is RecommendedCourse => value !== null);
  }

  async rateLesson(input: { lessonId: UUID; userId: UUID; value: number }): Promise<LessonRating> {
    const payload = lessonRatingSchema.parse(input);
    const lesson = await this.findLessonOrThrow(payload.lessonId);
    const courseTree = await this.ensureCourseTree(lesson.courseId);
    const progress = await this.getProgressContext(payload.userId, lesson.courseId);
    this.assertLessonAvailable(lesson, courseTree, this.now(), progress.completedLessonIds);

    const rating = await this.deps.lessonRatingRepository.upsert({
      lessonId: payload.lessonId,
      userId: payload.userId,
      value: payload.value,
      createdAt: this.nowIso(),
    });

    this.logger.info('Lesson rated', {
      lessonId: payload.lessonId,
      userId: payload.userId,
      value: payload.value,
    });

    return rating;
  }

  async removeLessonRating(input: { lessonId: UUID; userId: UUID }): Promise<void> {
    const lessonId = lessonRatingSchema.shape.lessonId.parse(input.lessonId);
    const userId = lessonRatingSchema.shape.userId.parse(input.userId);
    await this.deps.lessonRatingRepository.delete(userId, lessonId);
    this.logger.info('Lesson rating removed', { lessonId, userId });
  }

  async getLessonRatingSummary(lessonId: UUID, context?: { userId?: UUID }): Promise<LessonRatingSummary> {
    const validatedLessonId = lessonRatingSchema.shape.lessonId.parse(lessonId);
    const summary = await this.deps.lessonRatingRepository.getSummary(validatedLessonId);

    if (context?.userId) {
      const validatedUserId = lessonRatingSchema.shape.userId.parse(context.userId);
      const userRating = await this.deps.lessonRatingRepository.findByUserAndLesson(validatedUserId, validatedLessonId);
      if (userRating) {
        summary.userRating = userRating.value;
      } else if ('userRating' in summary) {
        delete summary.userRating;
      }
    } else if ('userRating' in summary) {
      delete summary.userRating;
    }

    return summary;
  }

  async recordLessonProgressTick(input: {
    lessonId: UUID;
    userId: UUID;
    courseId: UUID;
    positionMs: number;
    durationMs?: number;
    completed?: boolean;
    emittedAt?: string;
  }): Promise<LessonProgressSnapshot> {
    const payload = lessonProgressTickSchema.parse(input);
    const lesson = await this.findLessonOrThrow(payload.lessonId);
    if (lesson.courseId !== payload.courseId) {
      throw new AppError({
        code: 'ACADEMY_LESSON_COURSE_MISMATCH',
        message: 'Aula não pertence ao curso informado',
        statusCode: 400,
      });
    }

    const courseTree = await this.ensureCourseTree(lesson.courseId);
    const progressContext = await this.getProgressContext(payload.userId, lesson.courseId);
    this.assertLessonAvailable(lesson, courseTree, this.now(), progressContext.completedLessonIds);

    const durationMs = this.resolveLessonDurationMs(lesson, payload.durationMs);
    const clampedPositionMs = this.clampPositionMs(payload.positionMs, durationMs);
    const positionSeconds = Math.floor(clampedPositionMs / 1000);
    const denominator = durationMs > 0 ? durationMs : Math.max(this.getLessonDurationSeconds(lesson) * 1000, 1);
    const rawPercentage = denominator === 0 ? 0 : Math.round((clampedPositionMs / denominator) * 100);
    let percentage = Math.min(100, Math.max(0, rawPercentage));
    if (payload.completed) {
      percentage = 100;
    }

    const aggregate = await this.deps.lessonProgressRepository.recordTick({
      lessonId: payload.lessonId,
      userId: payload.userId,
      positionSeconds,
      occurredAt: this.resolveEmittedAt(payload.emittedAt),
      percentage,
    });

    this.logger.debug('Lesson progress tick recorded', {
      lessonId: payload.lessonId,
      userId: payload.userId,
      positionSeconds,
      percentage,
    });

    return this.toLessonProgressSnapshot({
      lesson,
      userId: payload.userId,
      aggregate,
      progressContext,
      overrides: {
        lastPositionMs: clampedPositionMs,
        percentage,
        completed: payload.completed,
        updatedAt: aggregate.updatedAt,
      },
    });
  }

  async getLessonProgressSnapshot(lessonId: UUID, userId: UUID): Promise<LessonProgressSnapshot> {
    const validatedLessonId = lessonProgressTickSchema.shape.lessonId.parse(lessonId);
    const validatedUserId = lessonProgressTickSchema.shape.userId.parse(userId);
    const lesson = await this.findLessonOrThrow(validatedLessonId);
    const progressContext = await this.getProgressContext(validatedUserId, lesson.courseId);
    const aggregate = await this.deps.lessonProgressRepository.getAggregate(validatedLessonId, validatedUserId);

    return this.toLessonProgressSnapshot({
      lesson,
      userId: validatedUserId,
      aggregate,
      progressContext,
    });
  }

  async getLessonProgressAggregate(lessonId: UUID, userId: UUID): Promise<LessonProgressAggregate | null> {
    const validatedLessonId = lessonProgressTickSchema.shape.lessonId.parse(lessonId);
    const validatedUserId = lessonProgressTickSchema.shape.userId.parse(userId);
    return this.deps.lessonProgressRepository.getAggregate(validatedLessonId, validatedUserId);
  }

  async updateProgress(input: { userId: UUID; courseId: UUID; lessonId: UUID }): Promise<CourseProgress> {
    const payload = updateProgressSchema.parse(input);
    const now = this.now();

    const lesson = await this.findLessonOrThrow(payload.lessonId);
    if (lesson.courseId !== payload.courseId) {
      throw new AppError({ code: 'ACADEMY_LESSON_MISMATCH', message: 'Aula não pertence ao curso informado', statusCode: 400 });
    }
    const courseTree = await this.ensureCourseTree(payload.courseId);
    const progress = await this.getProgressContext(payload.userId, payload.courseId);
    this.assertLessonAvailable(lesson, courseTree, now, progress.completedLessonIds);

    const accessibleLessonOrder = this.collectAccessibleLessonOrder(courseTree, now, progress.completedLessonIds);
    if (!accessibleLessonOrder.has(payload.lessonId)) {
      throw new AppError({ code: 'ACADEMY_LESSON_LOCKED', message: 'Aula ainda não liberada', statusCode: 403 });
    }

    const updatedCompleted = new Set(progress.completedLessonIds);
    updatedCompleted.add(payload.lessonId);

    const sanitized = Array.from(updatedCompleted).filter((id) => accessibleLessonOrder.has(id));
    const orderedCompleted = sanitized.sort(
      (a, b) => (accessibleLessonOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (accessibleLessonOrder.get(b) ?? Number.MAX_SAFE_INTEGER),
    );

    const totalAccessible = accessibleLessonOrder.size;
    const percentage = totalAccessible === 0 ? 0 : Math.min(100, Math.round((orderedCompleted.length / totalAccessible) * 100));

    const progressRecord = await this.deps.progressRepository.upsert({
      userId: payload.userId,
      courseId: payload.courseId,
      completedLessonIds: orderedCompleted,
      percentage,
      lastLessonId: payload.lessonId,
      updatedAt: this.nowIso(),
    });

    this.logger.info('Course progress updated', {
      userId: payload.userId,
      courseId: payload.courseId,
      lessonId: payload.lessonId,
      percentage,
    });

    return progressRecord;
  }

  async getCourseProgress(courseId: UUID, userId: UUID): Promise<CourseProgress> {
    const validatedCourseId = courseProgressPatchSchema.shape.courseId.parse(courseId);
    const validatedUserId = courseProgressPatchSchema.shape.userId.parse(userId);
    await this.ensureCourseTree(validatedCourseId);

    const existing = await this.deps.progressRepository.getByUserAndCourse(validatedUserId, validatedCourseId);
    if (existing) {
      return existing;
    }

    return {
      courseId: validatedCourseId,
      userId: validatedUserId,
      completedLessonIds: [],
      percentage: 0,
      lastLessonId: null,
      updatedAt: this.nowIso(),
    };
  }

  async saveCourseProgress(input: {
    userId: UUID;
    courseId: UUID;
    completedLessonIds: UUID[];
    lastLessonId?: Nullable<UUID>;
  }): Promise<CourseProgress> {
    const payload = courseProgressPatchSchema.parse({
      ...input,
      lastLessonId: input.lastLessonId ?? null,
    });

    const courseTree = await this.ensureCourseTree(payload.courseId);
    const now = this.now();

    const allLessonIds = new Set<UUID>();
    for (const module of courseTree.modules) {
      for (const lesson of module.lessons) {
        allLessonIds.add(lesson.id);
      }
    }

    const requestedSet = new Set<UUID>();
    for (const lessonId of payload.completedLessonIds) {
      if (allLessonIds.has(lessonId)) {
        requestedSet.add(lessonId);
      }
    }

    const accessibleOrder = this.collectAccessibleLessonOrder(courseTree, now, requestedSet);
    const orderedAccessibleIds = Array.from(accessibleOrder.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([lessonId]) => lessonId);

    const sanitizedCompleted = orderedAccessibleIds.filter((lessonId) => requestedSet.has(lessonId));
    const totalAccessible = accessibleOrder.size || orderedAccessibleIds.length || allLessonIds.size;
    const percentage =
      totalAccessible > 0 ? Math.min(100, Math.round((sanitizedCompleted.length / totalAccessible) * 100)) : 0;

    let lastLessonId = payload.lastLessonId;
    if (lastLessonId && !sanitizedCompleted.includes(lastLessonId)) {
      lastLessonId = sanitizedCompleted[sanitizedCompleted.length - 1] ?? null;
    }
    if (!lastLessonId && sanitizedCompleted.length > 0) {
      lastLessonId = sanitizedCompleted[sanitizedCompleted.length - 1] ?? null;
    }

    const progressRecord = await this.deps.progressRepository.upsert({
      userId: payload.userId,
      courseId: payload.courseId,
      completedLessonIds: sanitizedCompleted,
      percentage,
      lastLessonId: lastLessonId ?? null,
      updatedAt: this.nowIso(),
    });

    this.logger.info('Course progress snapshot saved', {
      userId: payload.userId,
      courseId: payload.courseId,
      completedLessons: sanitizedCompleted.length,
      percentage,
    });

    return progressRecord;
  }

  async addLessonComment(input: { lessonId: UUID; userId: UUID; body: string }): Promise<LessonComment> {
    const payload = addLessonCommentSchema.parse(input);
    const lesson = await this.findLessonOrThrow(payload.lessonId);
    const courseTree = await this.ensureCourseTree(lesson.courseId);
    const progress = await this.getProgressContext(payload.userId, lesson.courseId);
    this.assertLessonAvailable(lesson, courseTree, this.now(), progress.completedLessonIds);

    if (!lesson.isCommentingEnabled) {
      throw new AppError({ code: 'ACADEMY_COMMENTS_DISABLED', message: 'Comentários desabilitados para esta aula', statusCode: 403 });
    }

    const pendingModeration = lesson.isCommentingModerated;
    const comment = await this.deps.lessonCommentRepository.create({
      lessonId: payload.lessonId,
      userId: payload.userId,
      body: payload.body,
      pendingModeration,
      moderationStatus: pendingModeration ? 'pending' : 'approved',
    });

    this.logger.info('Lesson comment created', {
      lessonId: payload.lessonId,
      userId: payload.userId,
      pendingModeration: lesson.isCommentingModerated,
    });

    return comment;
  }

  async addLessonCommentReply(input: {
    commentId: UUID;
    userId: UUID;
    body: string;
    parentReplyId?: Nullable<UUID>;
  }): Promise<LessonCommentReply> {
    const payload = addLessonCommentReplySchema.parse(input);
    const comment = await this.deps.lessonCommentRepository.findById(payload.commentId);
    if (!comment) {
      throw new AppError({ code: 'ACADEMY_COMMENT_NOT_FOUND', message: 'Comentário não encontrado', statusCode: 404 });
    }

    const lesson = await this.findLessonOrThrow(comment.lessonId);
    const courseTree = await this.ensureCourseTree(lesson.courseId);
    const progress = await this.getProgressContext(payload.userId, lesson.courseId);
    this.assertLessonAvailable(lesson, courseTree, this.now(), progress.completedLessonIds);

    if (!lesson.isCommentingEnabled) {
      throw new AppError({ code: 'ACADEMY_COMMENTS_DISABLED', message: 'Comentários desabilitados para esta aula', statusCode: 403 });
    }

    if (comment.moderationStatus === 'rejected') {
      throw new AppError({ code: 'ACADEMY_COMMENT_REJECTED', message: 'Não é possível responder a comentários rejeitados', statusCode: 403 });
    }

    let parentReply: LessonCommentReply | null = null;
    if (payload.parentReplyId) {
      parentReply = await this.deps.lessonCommentReplyRepository.findById(payload.parentReplyId);
      if (!parentReply || parentReply.commentId !== payload.commentId) {
        throw new AppError({ code: 'ACADEMY_COMMENT_REPLY_PARENT_NOT_FOUND', message: 'Reply pai inválido', statusCode: 404 });
      }
      const parentDepth = await this.getReplyDepth(parentReply);
      if (parentDepth >= MAX_REPLY_DEPTH) {
        throw new AppError({
          code: 'ACADEMY_COMMENT_REPLY_DEPTH_EXCEEDED',
          message: 'Limite de replies encadeados atingido',
          statusCode: 400,
        });
      }
      if (parentReply.moderationStatus === 'rejected') {
        throw new AppError({
          code: 'ACADEMY_COMMENT_REPLY_REJECTED',
          message: 'Não é possível responder a um reply rejeitado',
          statusCode: 403,
        });
      }
    }

    const pendingModeration =
      comment.pendingModeration || comment.moderationStatus !== 'approved' || parentReply?.pendingModeration === true;
    const moderationStatus: LessonCommentModerationStatus = pendingModeration ? 'pending' : 'approved';

    const reply = await this.deps.lessonCommentReplyRepository.create({
      commentId: payload.commentId,
      userId: payload.userId,
      body: payload.body,
      parentReplyId: payload.parentReplyId ?? null,
      pendingModeration,
      moderationStatus,
    });

    this.logger.info('Lesson comment reply created', {
      code: 'ACADEMY_COMMENT_REPLY_CREATED',
      commentId: payload.commentId,
      replyId: reply.id,
      parentReplyId: payload.parentReplyId ?? null,
      userId: payload.userId,
      pendingModeration,
    });

    return reply;
  }

  async listLessonComments(input: {
    lessonId: UUID;
    userId: UUID;
    page?: number;
    pageSize?: number;
    after?: UUID;
  }): Promise<LessonComment[]> {
    const payload = listLessonCommentsSchema.parse(input);
    const lesson = await this.findLessonOrThrow(payload.lessonId);
    const courseTree = await this.ensureCourseTree(lesson.courseId);
    const progress = await this.getProgressContext(payload.userId, lesson.courseId);
    this.assertLessonAvailable(lesson, courseTree, this.now(), progress.completedLessonIds);

    const comments = await this.deps.lessonCommentRepository.listByLesson({
      lessonId: payload.lessonId,
      page: payload.page,
      pageSize: payload.pageSize,
      after: payload.after,
    });
    if (comments.length === 0) {
      return [];
    }

    const replies = await this.deps.lessonCommentReplyRepository.listByComments(comments.map((comment) => comment.id));
    const repliesByComment = this.groupRepliesByComment(replies);

    return comments.map((comment) => ({
      ...comment,
      replies: this.buildReplyTree(repliesByComment.get(comment.id) ?? []),
    }));
  }

  async listPendingComments(input: {
    page?: number;
    pageSize?: number;
    status?: Extract<LessonCommentModerationStatus, 'pending' | 'rejected'>;
  } = {}): Promise<LessonComment[]> {
    const payload = listPendingCommentsSchema.parse(input);
    const comments = await this.deps.lessonCommentRepository.listPending({
      page: payload.page,
      pageSize: payload.pageSize,
      status: payload.status ?? 'pending',
    });

    if (comments.length === 0) {
      return [];
    }

    const replies = await this.deps.lessonCommentReplyRepository.listByComments(comments.map((comment) => comment.id));
    const repliesByComment = this.groupRepliesByComment(replies);

    return comments.map((comment) => ({
      ...comment,
      replies: this.buildReplyTree(repliesByComment.get(comment.id) ?? []),
    }));
  }

  async listPendingModerationItems(input: {
    status?: Extract<LessonCommentModerationStatus, 'pending' | 'rejected'>;
    page?: number;
    pageSize?: number;
  } = {}): Promise<CommentModerationItem[]> {
    const payload = moderationListSchema.parse(input);

    // Fetch comments matching status
    const comments = await this.deps.lessonCommentRepository.listPending({
      page: payload.page,
      pageSize: payload.pageSize,
      status: payload.status,
    });

    // Fetch replies matching status (global, independent of parent comment status)
    const replies = await this.deps.lessonCommentReplyRepository.listByStatus({
      status: payload.status,
      page: payload.page,
      pageSize: payload.pageSize,
    });

    // Build maps for enrichment
    const userIds = new Set<UUID>();
    for (const c of comments) userIds.add(c.userId);
    for (const r of replies) userIds.add(r.userId);

    const usersById = new Map<UUID, { displayName: string }>();
    await Promise.all(
      Array.from(userIds).map(async (id) => {
        const u = await this.deps.userRepository.findById(id);
        if (u) {
          usersById.set(id, { displayName: u.profile.displayName });
        }
      }),
    );

    // Helper: enrich lesson/course metadata
    const lessonMetaCache = new Map<UUID, { courseId: UUID; lessonTitle: string; courseTitle: string }>();
    const resolveLessonMeta = async (lessonId: UUID) => {
      const cached = lessonMetaCache.get(lessonId);
      if (cached) return cached;
      const lesson = await this.findLessonOrThrow(lessonId);
      const courseTree = await this.ensureCourseTree(lesson.courseId);
      const meta = { courseId: lesson.courseId, lessonTitle: lesson.title, courseTitle: courseTree.title };
      lessonMetaCache.set(lessonId, meta);
      return meta;
    };

    // Map comments
    const items: CommentModerationItem[] = [];
    for (const c of comments) {
      const { courseId, lessonTitle, courseTitle } = await resolveLessonMeta(c.lessonId);
      items.push({
        id: c.id,
        entityId: c.id,
        commentId: c.id,
        lessonId: c.lessonId,
        courseId,
        lessonTitle,
        courseTitle,
        userId: c.userId,
        userDisplayName: usersById.get(c.userId)?.displayName ?? '',
        body: c.body,
        createdAt: c.createdAt,
        pendingModeration: c.pendingModeration,
        moderationStatus: c.moderationStatus,
        moderatedById: c.moderatedById,
        moderatedAt: c.moderatedAt,
        type: 'comment',
        depth: 0,
      });
    }

    // Map replies
    for (const r of replies) {
      const parentComment = await this.deps.lessonCommentRepository.findById(r.commentId);
      if (!parentComment) {
        // Skip orphaned reply but log
        this.logger.warn('Orphaned reply without parent comment', { code: 'ACADEMY_REPLY_ORPHAN', replyId: r.id, commentId: r.commentId });
        continue;
      }
      const { courseId, lessonTitle, courseTitle } = await resolveLessonMeta(parentComment.lessonId);
      const depth = await this.getReplyDepth(r);
      items.push({
        id: r.id,
        entityId: r.id,
        commentId: parentComment.id,
        lessonId: parentComment.lessonId,
        courseId,
        lessonTitle,
        courseTitle,
        userId: r.userId,
        userDisplayName: usersById.get(r.userId)?.displayName ?? '',
        body: r.body,
        createdAt: r.createdAt,
        pendingModeration: r.pendingModeration,
        moderationStatus: r.moderationStatus,
        moderatedById: r.moderatedById,
        moderatedAt: r.moderatedAt,
        type: 'reply',
        depth,
      });
    }

    // Sort by createdAt ascending to match queue semantics
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return items;
  }

  async approveComment(input: { commentId: UUID; moderatorId: UUID }): Promise<LessonComment> {
    const payload = moderateCommentSchema.parse(input);
    const comment = await this.deps.lessonCommentRepository.findById(payload.commentId);
    if (!comment) {
      throw new AppError({ code: 'ACADEMY_COMMENT_NOT_FOUND', message: 'Comentário não encontrado', statusCode: 404 });
    }

    if (comment.moderationStatus === 'approved' && !comment.pendingModeration) {
      return comment;
    }

    const moderatedAt = this.nowIso();
    const updated = await this.deps.lessonCommentRepository.updateModeration({
      commentId: payload.commentId,
      moderatorId: payload.moderatorId,
      status: 'approved',
      moderatedAt,
    });

    await this.updateRepliesModeration(updated.id, payload.moderatorId, 'approved', moderatedAt);

    this.logger.info('Lesson comment approved', {
      code: 'ACADEMY_COMMENT_APPROVED',
      commentId: payload.commentId,
      moderatorId: payload.moderatorId,
    });

    return updated;
  }

  async moderateComment(input: { commentId: UUID; moderatedBy: UUID; status: 'approved' | 'rejected' }): Promise<LessonComment> {
    const payload = moderateCommentSchema.parse({
      commentId: input.commentId,
      moderatorId: input.moderatedBy,
    });

    const comment = await this.deps.lessonCommentRepository.findById(payload.commentId);
    if (!comment) {
      throw new AppError({ code: 'ACADEMY_COMMENT_NOT_FOUND', message: 'Comentário não encontrado', statusCode: 404 });
    }

    if ((input.status === 'approved' && comment.moderationStatus === 'approved' && !comment.pendingModeration) ||
        (input.status === 'rejected' && comment.moderationStatus === 'rejected' && !comment.pendingModeration)) {
      return comment;
    }

    const moderatedAt = this.nowIso();
    const updated = await this.deps.lessonCommentRepository.updateModeration({
      commentId: payload.commentId,
      moderatorId: payload.moderatorId,
      status: input.status,
      moderatedAt,
    });

    await this.updateRepliesModeration(updated.id, payload.moderatorId, input.status, moderatedAt);

    this.logger.info('Lesson comment moderated', {
      code: 'ACADEMY_COMMENT_MODERATED',
      commentId: payload.commentId,
      moderatorId: payload.moderatorId,
      status: input.status,
    });

    return updated;
  }

  async bulkModerateComments(input: { commentIds: UUID[]; moderatedBy: UUID; status: 'approved' | 'rejected' }): Promise<void> {
    const updatePromises = input.commentIds.map(commentId =>
      this.moderateComment({
        commentId,
        moderatedBy: input.moderatedBy,
        status: input.status,
      })
    );

    await Promise.all(updatePromises);

    this.logger.info('Bulk comment moderation completed', {
      code: 'ACADEMY_BULK_COMMENT_MODERATION',
      count: input.commentIds.length,
      status: input.status,
    });
  }


  async rejectComment(input: { commentId: UUID; moderatorId: UUID }): Promise<LessonComment> {
    const payload = moderateCommentSchema.parse(input);
    const comment = await this.deps.lessonCommentRepository.findById(payload.commentId);
    if (!comment) {
      throw new AppError({ code: 'ACADEMY_COMMENT_NOT_FOUND', message: 'Comentário não encontrado', statusCode: 404 });
    }

    if (comment.moderationStatus === 'rejected' && !comment.pendingModeration) {
      return comment;
    }

    const moderatedAt = this.nowIso();
    const updated = await this.deps.lessonCommentRepository.updateModeration({
      commentId: payload.commentId,
      moderatorId: payload.moderatorId,
      status: 'rejected',
      moderatedAt,
    });

    await this.updateRepliesModeration(updated.id, payload.moderatorId, 'rejected', moderatedAt);

    this.logger.info('Lesson comment rejected', {
      code: 'ACADEMY_COMMENT_REJECTED',
      commentId: payload.commentId,
      moderatorId: payload.moderatorId,
    });

    return updated;
  }

  async approveReply(input: { commentId: UUID; replyId: UUID; moderatorId: UUID }): Promise<LessonCommentReply> {
    const payload = moderateReplySchema.parse(input);

    const comment = await this.deps.lessonCommentRepository.findById(payload.commentId);
    if (!comment) {
      throw new AppError({ code: 'ACADEMY_COMMENT_NOT_FOUND', message: 'Comentário não encontrado', statusCode: 404 });
    }

    const reply = await this.deps.lessonCommentReplyRepository.findById(payload.replyId);
    if (!reply || reply.commentId !== payload.commentId) {
      throw new AppError({ code: 'ACADEMY_COMMENT_REPLY_PARENT_NOT_FOUND', message: 'Reply não pertence ao comentário', statusCode: 404 });
    }

    const moderatedAt = this.nowIso();
    // Approve target if pending
    const targetUpdated = reply.moderationStatus === 'pending'
      ? await this.deps.lessonCommentReplyRepository.updateModeration({
          replyId: payload.replyId,
          moderatorId: payload.moderatorId,
          status: 'approved',
          moderatedAt,
        })
      : reply;

    // Approve only pending descendants
    await this.updateReplySubtreeModeration({
      commentId: payload.commentId,
      rootReplyId: payload.replyId,
      moderatorId: payload.moderatorId,
      status: 'approved',
      moderatedAt,
    });

    this.logger.info('Lesson comment reply approved', {
      code: 'ACADEMY_REPLY_APPROVED',
      commentId: payload.commentId,
      replyId: payload.replyId,
      moderatorId: payload.moderatorId,
    });

    return targetUpdated;
  }

  async rejectReply(input: { commentId: UUID; replyId: UUID; moderatorId: UUID }): Promise<LessonCommentReply> {
    const payload = moderateReplySchema.parse(input);

    const comment = await this.deps.lessonCommentRepository.findById(payload.commentId);
    if (!comment) {
      throw new AppError({ code: 'ACADEMY_COMMENT_NOT_FOUND', message: 'Comentário não encontrado', statusCode: 404 });
    }

    const reply = await this.deps.lessonCommentReplyRepository.findById(payload.replyId);
    if (!reply || reply.commentId !== payload.commentId) {
      throw new AppError({ code: 'ACADEMY_COMMENT_REPLY_PARENT_NOT_FOUND', message: 'Reply não pertence ao comentário', statusCode: 404 });
    }

    const moderatedAt = this.nowIso();
    // Reject target if not already rejected
    const targetUpdated = reply.moderationStatus !== 'rejected'
      ? await this.deps.lessonCommentReplyRepository.updateModeration({
          replyId: payload.replyId,
          moderatorId: payload.moderatorId,
          status: 'rejected',
          moderatedAt,
        })
      : reply;

    // Reject all descendants (except those already rejected)
    await this.updateReplySubtreeModeration({
      commentId: payload.commentId,
      rootReplyId: payload.replyId,
      moderatorId: payload.moderatorId,
      status: 'rejected',
      moderatedAt,
    });

    this.logger.info('Lesson comment reply rejected', {
      code: 'ACADEMY_REPLY_REJECTED',
      commentId: payload.commentId,
      replyId: payload.replyId,
      moderatorId: payload.moderatorId,
    });

    return targetUpdated;
  }


  async listRecommendations(userId: UUID, limit = 6): Promise<CourseRecommendation[]> {
    const recommended = await this.getRecommendedCourses(userId, limit);
    return recommended.map((item) => item.recommendation);
  }

  // Admin methods for course and module management

  async getCourse(courseId: UUID): Promise<any> {
    const validatedCourseId = z.string().uuid().parse(courseId);
    const course = await this.deps.courseRepository.findTreeById(validatedCourseId);
    if (!course) {
      throw new AppError({ code: 'ACADEMY_COURSE_NOT_FOUND', message: 'Curso não encontrado', statusCode: 404 });
    }
    return course;
  }

  async getCourseModules(courseId: UUID): Promise<any[]> {
    const validatedCourseId = z.string().uuid().parse(courseId);
    const courseTree = await this.ensureCourseTree(validatedCourseId);
    return courseTree.modules;
  }

  async updateCourseDripConfig(courseId: UUID, config: any): Promise<void> {
    const validatedCourseId = z.string().uuid().parse(courseId);

    // Validate that course exists
    await this.ensureCourseTree(validatedCourseId);

    // Update course with drip configuration
    await this.deps.courseRepository.update(validatedCourseId, {
      dripEnabled: config.enabled,
      dripType: config.type,
      dripReleaseDate: config.releaseDate,
      dripDaysAfterEnrollment: config.daysAfterEnrollment,
    });

    this.logger.info('Course drip configuration updated', {
      courseId: validatedCourseId,
      config,
    });
  }

  async updateModuleDripConfig(moduleId: UUID, config: any): Promise<void> {
    const validatedModuleId = z.string().uuid().parse(moduleId);

    // Check if module exists
    const module = await this.deps.courseRepository.findModuleById(validatedModuleId);
    if (!module) {
      throw new AppError({ code: 'ACADEMY_MODULE_NOT_FOUND', message: 'Módulo não encontrado', statusCode: 404 });
    }

    // Update module with drip configuration
    await this.deps.courseRepository.updateModule(validatedModuleId, {
      dripType: config.type,
      dripReleaseAt: config.releaseDate,
      dripDaysAfter: config.daysAfter,
      dripAfterModuleId: config.afterModuleId,
    });

    this.logger.info('Module drip configuration updated', {
      moduleId: validatedModuleId,
      config,
    });
  }

  async bulkUpdateModuleDripConfigs(moduleConfigs: { moduleId: UUID; config: any }[]): Promise<void> {
    const updatePromises = moduleConfigs.map(({ moduleId, config }) =>
      this.updateModuleDripConfig(moduleId, config)
    );

    await Promise.all(updatePromises);

    this.logger.info('Bulk module drip configurations updated', {
      count: moduleConfigs.length,
    });
  }

  async updateComplexDripConfig(courseId: UUID, config: any): Promise<void> {
    const validatedCourseId = z.string().uuid().parse(courseId);

    // Validate that course exists
    await this.ensureCourseTree(validatedCourseId);

    // Update course-level drip settings
    const hasAnyDripRules = config.modules.some((m: any) => m.enabled && m.dripRule.type !== 'none');
    await this.deps.courseRepository.update(validatedCourseId, {
      dripEnabled: hasAnyDripRules || config.unlockOnEnrollment || config.autoUnlockFirstModule,
      dripType: config.defaultDripType === 'none' ? 'none' : 'enrollment',
    });

    // Update each module's drip configuration
    const moduleUpdatePromises = config.modules.map(async (moduleConfig: any) => {
      const { id, dripRule, enabled } = moduleConfig;

      return this.deps.courseRepository.updateModule(id, {
        dripType: enabled ? dripRule.type : 'none',
        dripReleaseAt: dripRule.type === 'date' ? dripRule.releaseDate : null,
        dripDaysAfter: dripRule.type === 'days_after' ? dripRule.daysAfter : null,
        dripAfterModuleId: dripRule.type === 'after_completion' ? dripRule.afterModuleId : null,
      });
    });

    await Promise.all(moduleUpdatePromises);

    this.logger.info('Complex drip configuration updated', {
      courseId: validatedCourseId,
      modulesCount: config.modules.length,
      enabledModules: config.modules.filter((m: any) => m.enabled).length,
    });
  }

  // Course CRUD methods for admin

  async createCourse(input: any): Promise<any> {
    const course = await this.deps.courseRepository.create({
      ...input,
      createdAt: this.nowIso(),
      updatedAt: this.nowIso(),
    });

    this.logger.info('Course created', {
      courseId: course.id,
      title: course.title,
    });

    return course;
  }

  async updateCourse(courseId: UUID, updates: any): Promise<any> {
    const validatedCourseId = z.string().uuid().parse(courseId);

    const course = await this.deps.courseRepository.update(validatedCourseId, {
      ...updates,
      updatedAt: this.nowIso(),
    });

    this.logger.info('Course updated', {
      courseId: validatedCourseId,
      updates: Object.keys(updates),
    });

    return course;
  }

  async deleteCourse(courseId: UUID): Promise<void> {
    const validatedCourseId = z.string().uuid().parse(courseId);

    await this.deps.courseRepository.delete(validatedCourseId);

    this.logger.info('Course deleted', {
      courseId: validatedCourseId,
    });
  }

  // Module CRUD methods for admin

  async createModule(input: any): Promise<any> {
    const module = await this.deps.courseRepository.createModule({
      ...input,
      createdAt: this.nowIso(),
      updatedAt: this.nowIso(),
    });

    this.logger.info('Module created', {
      moduleId: module.id,
      courseId: input.courseId,
      title: module.title,
    });

    return module;
  }

  async updateModule(moduleId: UUID, updates: any): Promise<any> {
    const validatedModuleId = z.string().uuid().parse(moduleId);

    const module = await this.deps.courseRepository.updateModule(validatedModuleId, {
      ...updates,
      updatedAt: this.nowIso(),
    });

    this.logger.info('Module updated', {
      moduleId: validatedModuleId,
      updates: Object.keys(updates),
    });

    return module;
  }

  async deleteModule(moduleId: UUID): Promise<void> {
    const validatedModuleId = z.string().uuid().parse(moduleId);

    await this.deps.courseRepository.deleteModule(validatedModuleId);

    this.logger.info('Module deleted', {
      moduleId: validatedModuleId,
    });
  }

  // Lesson CRUD methods for admin

  async createLesson(input: any): Promise<any> {
    const lesson = await this.deps.lessonRepository.create({
      ...input,
      createdAt: this.nowIso(),
      updatedAt: this.nowIso(),
    });

    this.logger.info('Lesson created', {
      lessonId: lesson.id,
      moduleId: input.moduleId,
      title: lesson.title,
    });

    return lesson;
  }

  async updateLesson(lessonId: UUID, updates: any): Promise<any> {
    const validatedLessonId = z.string().uuid().parse(lessonId);

    const lesson = await this.deps.lessonRepository.update(validatedLessonId, {
      ...updates,
      updatedAt: this.nowIso(),
    });

    this.logger.info('Lesson updated', {
      lessonId: validatedLessonId,
      updates: Object.keys(updates),
    });

    return lesson;
  }

  async deleteLesson(lessonId: UUID): Promise<void> {
    const validatedLessonId = z.string().uuid().parse(lessonId);

    await this.deps.lessonRepository.delete(validatedLessonId);

    this.logger.info('Lesson deleted', {
      lessonId: validatedLessonId,
    });
  }

  // Analytics methods for admin

  async getCourseAnalytics(): Promise<any> {
    // Implementation would depend on specific analytics requirements
    // For now, return a placeholder
    return {
      totalCourses: 0,
      totalStudents: 0,
      completionRate: 0,
      averageProgress: 0,
    };
  }

  async getEngagementAnalytics(): Promise<any> {
    // Implementation would depend on specific analytics requirements
    // For now, return a placeholder
    return {
      totalComments: 0,
      totalRatings: 0,
      averageRating: 0,
      activeUsers: 0,
    };
  }

  private groupRepliesByComment(replies: LessonCommentReply[]): Map<UUID, LessonCommentReply[]> {
    const map = new Map<UUID, LessonCommentReply[]>();
    for (const reply of replies) {
      const list = map.get(reply.commentId) ?? [];
      list.push(reply);
      map.set(reply.commentId, list);
    }
    return map;
  }

  private buildReplyTree(replies: LessonCommentReply[]): LessonCommentReply[] {
    if (replies.length === 0) {
      return [];
    }

    const clone = (reply: LessonCommentReply): LessonCommentReply => ({
      ...reply,
      replies: [],
    });

    const childrenByParent = new Map<UUID | null, LessonCommentReply[]>();
    for (const reply of replies) {
      const node = clone(reply);
      const parentKey = node.parentReplyId ?? null;
      const bucket = childrenByParent.get(parentKey) ?? [];
      bucket.push(node);
      childrenByParent.set(parentKey, bucket);
    }

    const sortByCreatedAt = (items: LessonCommentReply[]) =>
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const buildLevel = (parentId: UUID | null, depth: number): LessonCommentReply[] => {
      const bucket = childrenByParent.get(parentId) ?? [];
      sortByCreatedAt(bucket);

      return bucket.map((node) => {
        if (depth >= MAX_REPLY_DEPTH) {
          node.replies = [];
          return node;
        }
        node.replies = buildLevel(node.id, depth + 1);
        return node;
      });
    };

    return buildLevel(null, 1);
  }

  private async getReplyDepth(reply: LessonCommentReply): Promise<number> {
    let depth = 1;
    let currentParentId = reply.parentReplyId ?? null;
    while (currentParentId) {
      depth += 1;
      if (depth >= MAX_REPLY_DEPTH) {
        break;
      }
      const parent = await this.deps.lessonCommentReplyRepository.findById(currentParentId);
      if (!parent) {
        break;
      }
      currentParentId = parent.parentReplyId ?? null;
    }
    return depth;
  }

  private async updateRepliesModeration(
    commentId: UUID,
    moderatorId: UUID,
    status: Extract<LessonCommentModerationStatus, 'approved' | 'rejected'>,
    moderatedAt: string,
  ): Promise<void> {
    const replies = await this.deps.lessonCommentReplyRepository.listByComments([commentId]);
    if (replies.length === 0) {
      return;
    }

    const filtered = replies.filter((reply) =>
      status === 'approved' ? reply.moderationStatus === 'pending' : reply.moderationStatus !== 'rejected',
    );

    if (filtered.length === 0) {
      return;
    }

    await Promise.all(
      filtered.map((reply) =>
        this.deps.lessonCommentReplyRepository.updateModeration({
          replyId: reply.id,
          moderatorId,
          status,
          moderatedAt,
        }),
      ),
    );
  }

  private async updateReplySubtreeModeration(params: {
    commentId: UUID;
    rootReplyId: UUID;
    moderatorId: UUID;
    status: Extract<LessonCommentModerationStatus, 'approved' | 'rejected'>;
    moderatedAt: string;
  }): Promise<void> {
    const replies = await this.deps.lessonCommentReplyRepository.listByComments([params.commentId]);
    if (replies.length === 0) {
      return;
    }

    // Build parent->children map
    const childrenByParent = new Map<UUID | null, LessonCommentReply[]>();
    for (const r of replies) {
      const key = r.parentReplyId ?? null;
      const bucket = childrenByParent.get(key) ?? [];
      bucket.push(r);
      childrenByParent.set(key, bucket);
    }

    // Collect descendants starting from rootReplyId (excluding root itself)
    const stack: UUID[] = [params.rootReplyId];
    const descendants: LessonCommentReply[] = [];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const children = childrenByParent.get(current) ?? [];
      for (const child of children) {
        descendants.push(child);
        stack.push(child.id);
      }
    }

    if (descendants.length === 0) {
      return;
    }

    const toUpdate = descendants.filter((r) =>
      params.status === 'approved' ? r.moderationStatus === 'pending' : r.moderationStatus !== 'rejected',
    );

    if (toUpdate.length === 0) {
      return;
    }

    await Promise.all(
      toUpdate.map((r) =>
        this.deps.lessonCommentReplyRepository.updateModeration({
          replyId: r.id,
          moderatorId: params.moderatorId,
          status: params.status,
          moderatedAt: params.moderatedAt,
        }),
      ),
    );
  }


  private toPaginatedResponse(query: CourseListQuery, result: CourseListResult): PaginatedResponse<CourseMeta> {
    const pageSize = query.pageSize;
    const totalPages = pageSize === 0 ? 0 : Math.ceil(result.totalItems / pageSize);
    return {
      items: result.items,
      page: query.page,
      pageSize,
      totalItems: result.totalItems,
      totalPages,
    } satisfies PaginatedResponse<CourseMeta>;
  }

  private toLessonProgressSnapshot(params: {
    lesson: LessonWithCourse;
    userId: UUID;
    aggregate: LessonProgressAggregate | null;
    progressContext: { record: CourseProgress | null; completedLessonIds: Set<UUID> };
    overrides?: {
      lastPositionMs?: number;
      percentage?: number;
      completed?: boolean;
      updatedAt?: string;
    };
  }): LessonProgressSnapshot {
    const aggregatePositionMs = params.aggregate ? Math.max(params.aggregate.lastPositionSeconds, 0) * 1000 : 0;
    const overridePosition = params.overrides?.lastPositionMs;
    const lastPositionMs =
      overridePosition !== undefined ? Math.max(overridePosition, aggregatePositionMs) : aggregatePositionMs;

    const basePercentage = params.aggregate?.percentage ?? 0;
    const percentage = Math.min(100, Math.max(0, params.overrides?.percentage ?? basePercentage));

    const completedFromProgress = params.progressContext.completedLessonIds.has(params.lesson.id);
    const completedOverride = params.overrides?.completed;
    const completed =
      (completedOverride ?? false) ||
      completedFromProgress ||
      percentage >= 95;

    const updatedAt = params.overrides?.updatedAt ?? params.aggregate?.updatedAt ?? this.nowIso();

    return {
      lessonId: params.lesson.id,
      courseId: params.lesson.courseId,
      userId: params.userId,
      lastPositionMs,
      percentage,
      completed,
      updatedAt,
    } satisfies LessonProgressSnapshot;
  }

  private resolveLessonDurationMs(lesson: LessonWithCourse, providedDurationMs?: number): number {
    const lessonDurationMs = Math.max(this.getLessonDurationSeconds(lesson), 0) * 1000;
    if (typeof providedDurationMs === 'number') {
      const normalizedProvided = Math.min(Math.max(providedDurationMs, 0), MAX_LESSON_PROGRESS_MS);
      return Math.max(lessonDurationMs, normalizedProvided);
    }
    return lessonDurationMs;
  }

  private clampPositionMs(positionMs: number, durationMs: number): number {
    const upperBound = durationMs > 0 ? durationMs : MAX_LESSON_PROGRESS_MS;
    return Math.max(0, Math.min(positionMs, upperBound));
  }

  private resolveEmittedAt(emittedAt?: string): string {
    if (!emittedAt) {
      return this.nowIso();
    }
    const parsed = new Date(emittedAt);
    if (Number.isNaN(parsed.getTime())) {
      return this.nowIso();
    }
    return parsed.toISOString();
  }

  private async findLessonOrThrow(lessonId: UUID): Promise<LessonWithCourse> {
    const lesson = await this.deps.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError({ code: 'ACADEMY_LESSON_NOT_FOUND', message: 'Aula não encontrada', statusCode: 404 });
    }
    return lesson;
  }

  private collectAccessibleLessonOrder(course: CourseTree, now: Date, completedLessons: Set<UUID>): Map<UUID, number> {
    const orderMap = new Map<UUID, number>();
    let index = 0;
    const modulesSorted = [...course.modules].sort((a, b) => a.order - b.order);
    for (const module of modulesSorted) {
      const sortedLessons = [...module.lessons].sort((a, b) => a.order - b.order);
      for (const lesson of sortedLessons) {
        if (this.isLessonAccessible(lesson, module, course, now, completedLessons)) {
          orderMap.set(lesson.id, index);
          index += 1;
        }
      }
    }
    return orderMap;
  }

  private async ensureCourseTree(courseId: UUID): Promise<CourseTree> {
    const tree = await this.deps.courseRepository.findTreeById(courseId);
    if (!tree) {
      throw new AppError({ code: 'ACADEMY_COURSE_NOT_FOUND', message: 'Curso não encontrado', statusCode: 404 });
    }
    return tree;
  }

  private async getProgressContext(userId: UUID, courseId: UUID): Promise<{ record: CourseProgress | null; completedLessonIds: Set<UUID> }> {
    const record = await this.deps.progressRepository.getByUserAndCourse(userId, courseId);
    return {
      record,
      completedLessonIds: new Set(record?.completedLessonIds ?? []),
    };
  }

  private assertLessonAvailable(
    lesson: LessonWithCourse,
    course: CourseTree,
    now: Date,
    completedLessons: Set<UUID>,
  ): void {
    if (!this.isLessonUnlocked(lesson, course, now, completedLessons)) {
      throw new AppError({ code: 'ACADEMY_LESSON_LOCKED', message: 'Aula ainda não liberada', statusCode: 403 });
    }
  }

  private isLessonUnlocked(
    lesson: Lesson,
    course: CourseTree,
    now: Date,
    completedLessons: Set<UUID>,
  ): boolean {
    const module = course.modules.find((item) => item.id === lesson.moduleId);
    if (!module) {
      return false;
    }
    return this.isLessonAccessible(lesson, module, course, now, completedLessons);
  }

  private isLessonAccessible(
    lesson: Lesson,
    module: CourseModule,
    course: CourseTree,
    now: Date,
    completedLessons: Set<UUID>,
  ): boolean {
    if (lesson.isPreview) {
      return true;
    }

    if (!this.isModuleAccessible(module, course, now, completedLessons)) {
      return false;
    }

    const releaseAt = this.parseIsoDate(lesson.releaseAt);
    if (releaseAt && releaseAt > now) {
      return false;
    }

    return true;
  }

  private isModuleAccessible(
    module: CourseModule,
    course: CourseTree,
    now: Date,
    completedLessons: Set<UUID>,
  ): boolean {
    const explicitRelease = this.parseIsoDate(module.dripReleaseAt);
    if (explicitRelease && explicitRelease > now) {
      return false;
    }

    if (module.dripAfterModuleId) {
      const dependency = course.modules.find((item) => item.id === module.dripAfterModuleId);
      if (!dependency) {
        return false;
      }
      const dependencyLessonIds = dependency.lessons.map((lesson) => lesson.id);
      const dependencyCompleted = dependencyLessonIds.every((id) => completedLessons.has(id));
      if (!dependencyCompleted) {
        return false;
      }
    }

    if (module.dripDaysAfter != null) {
      const referenceDate = this.resolveModuleDripReferenceDate(module, course);
      if (referenceDate) {
        const unlockDate = new Date(referenceDate.getTime() + module.dripDaysAfter * 86_400_000);
        if (unlockDate > now) {
          return false;
        }
      }
    }

    return true;
  }

  private resolveModuleDripReferenceDate(module: CourseModule, course: CourseTree): Date | null {
    const explicit = this.parseIsoDate(module.dripReleaseAt);
    if (explicit) {
      return explicit;
    }

    if (module.dripAfterModuleId) {
      const dependency = course.modules.find((item) => item.id === module.dripAfterModuleId);
      const dependencyRelease = dependency ? this.parseIsoDate(dependency.dripReleaseAt) : null;
      if (dependencyRelease) {
        return dependencyRelease;
      }
    }

    return this.parseIsoDate(course.releaseDate);
  }

  private parseIsoDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  }

  private getLessonDurationSeconds(lesson: Lesson): number {
    const durationFromMinutes = Math.max(lesson.durationMinutes * 60, 0);
    if (lesson.type === LessonType.Video && 'video' in lesson.content) {
      const video = lesson.content.video;
      return Math.max(video?.durationSeconds ?? durationFromMinutes, durationFromMinutes);
    }
    return durationFromMinutes;
  }

  private now(): Date {
    return this.deps.now ? this.deps.now() : new Date();
  }

  private nowIso(): string {
    return this.now().toISOString();
  }
}
