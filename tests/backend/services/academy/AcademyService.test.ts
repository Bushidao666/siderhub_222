import type {
  CourseMeta,
  CourseProgress,
  CourseTree,
  Lesson,
  LessonComment,
  LessonCommentReply,
  CourseModule,
  LessonRating,
  LessonProgressAggregate,
} from '@shared/types/academy.types';
import type { UUID } from '@shared/types/common.types';
import { CourseStatus, LessonType, Visibility } from '@shared/types/common.types';
import { AcademyService, type AcademyServiceDeps } from 'src/backend/services/academy/AcademyService';

const uuid = (value: string) => value as UUID;
const COURSE_ID = uuid('11111111-1111-4111-8111-111111111111');
const MODULE_ID = uuid('22222222-2222-4222-8222-222222222222');
const LESSON_RELEASED_ID = uuid('33333333-3333-4333-8333-333333333333');
const LESSON_FUTURE_ID = uuid('44444444-4444-4444-8444-444444444444');
const LESSON_ACCESSIBLE_ID = uuid('55555555-5555-4555-8555-555555555555');
const LESSON_LOCKED_ID = uuid('66666666-6666-4666-8666-666666666666');
const USER_ID = uuid('77777777-7777-4777-8777-777777777777');
const COMMENT_ID = uuid('88888888-8888-4888-8888-888888888888');
const REPLY_ID = uuid('99999999-9999-4999-8999-999999999999');
const CHILD_REPLY_ID = uuid('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
const GRANDCHILD_REPLY_ID = uuid('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

const buildCourseMeta = (overrides: Partial<CourseMeta> = {}): CourseMeta => ({
  id: COURSE_ID,
  slug: 'sample-course',
  title: 'Sample Course',
  subtitle: 'Subtitle',
  description: 'Description',
  coverImage: null,
  level: 'beginner',
  status: CourseStatus.Published,
  visibility: Visibility.Members,
  estimatedDurationMinutes: 0,
  totalLessons: 2,
  tags: [],
  releaseDate: null,
  isFeatured: false,
  recommendationScore: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const buildLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: overrides.id ?? LESSON_RELEASED_ID,
  moduleId: overrides.moduleId ?? MODULE_ID,
  order: 1,
  title: 'Lesson',
  summary: 'Summary',
  type: LessonType.Video,
  content: { type: LessonType.Video, video: { videoUrl: '', durationSeconds: 120, captionsUrl: null, transcript: null } },
  durationMinutes: 2,
  isPreview: false,
  releaseAt: null,
  ...overrides,
});

const buildModule = (lessons: Lesson[]): CourseModule => ({
  id: MODULE_ID,
  courseId: COURSE_ID,
  order: 1,
  title: 'Module',
  description: 'Desc',
  durationMinutes: 10,
  dripReleaseAt: null,
  dripDaysAfter: null,
  dripAfterModuleId: null,
  lessons,
});

const buildComment = (overrides: Partial<LessonComment> = {}): LessonComment => ({
  id: COMMENT_ID,
  lessonId: LESSON_RELEASED_ID,
  userId: USER_ID,
  body: 'Great lesson!',
  createdAt: '2025-01-01T12:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  pendingModeration: false,
  moderationStatus: 'approved',
  moderatedById: null,
  moderatedAt: null,
  replies: [],
  ...overrides,
});

const buildReply = (overrides: Partial<LessonCommentReply> = {}): LessonCommentReply => ({
  id: REPLY_ID,
  commentId: COMMENT_ID,
  parentReplyId: null,
  userId: USER_ID,
  body: 'Reply!',
  createdAt: '2025-01-01T12:05:00Z',
  pendingModeration: false,
  moderationStatus: 'approved',
  moderatedById: null,
  moderatedAt: null,
  replies: [],
  ...overrides,
});

describe('AcademyService', () => {
  const courseRepository = {
    list: jest.fn(),
    findTreeById: jest.fn(),
  };
  const lessonRepository = {
    findById: jest.fn(),
  };
  const progressRepository = {
    getByUserAndCourse: jest.fn(),
    upsert: jest.fn(),
  };
  const lessonCommentRepository = {
    create: jest.fn(),
    listByLesson: jest.fn(),
    findById: jest.fn(),
    listPending: jest.fn(),
    updateModeration: jest.fn(),
  };
  const lessonCommentReplyRepository = {
    create: jest.fn(),
    listByComments: jest.fn(),
    findById: jest.fn(),
    updateModeration: jest.fn(),
  };
  const recommendationRepository = {
    listForUser: jest.fn(),
    listGlobal: jest.fn(),
  };
  const lessonRatingRepository = {
    upsert: jest.fn(),
    findByUserAndLesson: jest.fn(),
    getSummary: jest.fn(),
    delete: jest.fn(),
  };
  const lessonProgressRepository = {
    recordTick: jest.fn(),
    getAggregate: jest.fn(),
  };

  const userRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    updateLastLoginAt: jest.fn(),
    list: jest.fn(),
  };

  let service: AcademyService;

  beforeEach(() => {
    const deps: AcademyServiceDeps = {
      courseRepository: courseRepository as any,
      lessonRepository: lessonRepository as any,
      progressRepository: progressRepository as any,
      lessonCommentRepository: lessonCommentRepository as any,
      lessonCommentReplyRepository: lessonCommentReplyRepository as any,
      recommendationRepository: recommendationRepository as any,
      lessonRatingRepository: lessonRatingRepository as any,
      lessonProgressRepository: lessonProgressRepository as any,
      userRepository: userRepository as any,
      now: () => new Date('2025-01-01T12:00:00Z'),
    };
    service = new AcademyService(deps);
    lessonCommentReplyRepository.listByComments.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('filters unreleased lessons when returning course tree', async () => {
    const futureLesson = buildLesson({ id: LESSON_FUTURE_ID, releaseAt: '2025-01-02T00:00:00Z' });
    const releasedLesson = buildLesson({ id: LESSON_RELEASED_ID, releaseAt: '2024-12-31T00:00:00Z' });
    const courseTree: CourseTree = {
      ...buildCourseMeta(),
      modules: [buildModule([futureLesson, releasedLesson])],
    };
    courseRepository.findTreeById.mockResolvedValue(courseTree);

    const result = await service.getCourseTree(COURSE_ID);

    expect(result).not.toBeNull();
    expect(result?.modules[0].lessons).toHaveLength(1);
    expect(result?.modules[0].lessons[0].id).toBe(LESSON_RELEASED_ID);
  });

  it('updates progress considering only accessible lessons', async () => {
    const accessibleLesson = buildLesson({ id: LESSON_ACCESSIBLE_ID, releaseAt: null });
    const lockedLesson = buildLesson({ id: LESSON_LOCKED_ID, releaseAt: '2025-02-01T00:00:00Z' });
    const courseTree: CourseTree = {
      ...buildCourseMeta({ totalLessons: 2 }),
      modules: [buildModule([accessibleLesson, lockedLesson])],
    };

    courseRepository.findTreeById.mockResolvedValue(courseTree);
    lessonRepository.findById.mockResolvedValue({
      ...accessibleLesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
    });
    progressRepository.getByUserAndCourse.mockResolvedValue(null);

    const expectedProgress: CourseProgress = {
      courseId: COURSE_ID,
      userId: USER_ID,
      completedLessonIds: [LESSON_ACCESSIBLE_ID],
      percentage: 100,
      lastLessonId: LESSON_ACCESSIBLE_ID,
      updatedAt: '2025-01-01T12:00:00.000Z',
    };

    progressRepository.upsert.mockResolvedValue(expectedProgress);

    const output = await service.updateProgress({
      userId: USER_ID,
      courseId: COURSE_ID,
      lessonId: LESSON_ACCESSIBLE_ID,
    });

    expect(progressRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        completedLessonIds: [LESSON_ACCESSIBLE_ID],
        percentage: 100,
      }),
    );
    expect(output).toEqual(expectedProgress);
  });

  it('adds comments respecting moderation flag', async () => {
    const lesson = buildLesson();
    lessonRepository.findById.mockResolvedValue({
      ...lesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: true,
    });
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lesson])],
    });

    const comment = buildComment({
      lessonId: lesson.id,
      pendingModeration: true,
      moderationStatus: 'pending',
    });
    lessonCommentRepository.create.mockResolvedValue(comment);

    const result = await service.addLessonComment({
      lessonId: lesson.id,
      userId: USER_ID,
      body: 'Great lesson!',
    });

    expect(lessonCommentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ pendingModeration: true, moderationStatus: 'pending' }),
    );
    expect(result).toEqual(comment);
  });

  it('lists comments for an accessible lesson', async () => {
    const lesson = buildLesson({ id: LESSON_ACCESSIBLE_ID });
    lessonRepository.findById.mockResolvedValue({
      ...lesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
    });
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lesson])],
    });
    progressRepository.getByUserAndCourse.mockResolvedValue(null);

    const comment = buildComment({ lessonId: lesson.id });
    lessonCommentRepository.listByLesson.mockResolvedValue([comment]);
    lessonCommentReplyRepository.listByComments.mockResolvedValue([]);

    const result = await service.listLessonComments({
      lessonId: lesson.id,
      userId: USER_ID,
      page: 1,
      pageSize: 10,
    });

    expect(lessonCommentRepository.listByLesson).toHaveBeenCalledWith({
      lessonId: lesson.id,
      page: 1,
      pageSize: 10,
      after: undefined,
    });
    expect(result).toEqual([comment]);
  });

  it('nests replies up to three levels when listing comments', async () => {
    const lesson = buildLesson({ id: LESSON_ACCESSIBLE_ID });
    lessonRepository.findById.mockResolvedValue({
      ...lesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
    });
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lesson])],
    });
    progressRepository.getByUserAndCourse.mockResolvedValue(null);

    const comment = buildComment({ lessonId: lesson.id });
    lessonCommentRepository.listByLesson.mockResolvedValue([comment]);

    const replyLevel1 = buildReply({ id: REPLY_ID, createdAt: '2025-01-01T12:05:00Z' });
    const replyLevel2 = buildReply({
      id: CHILD_REPLY_ID,
      parentReplyId: REPLY_ID,
      createdAt: '2025-01-01T12:06:00Z',
    });
    const replyLevel3 = buildReply({
      id: GRANDCHILD_REPLY_ID,
      parentReplyId: CHILD_REPLY_ID,
      createdAt: '2025-01-01T12:07:00Z',
    });
    const replyLevel4 = buildReply({
      id: uuid('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      parentReplyId: GRANDCHILD_REPLY_ID,
      createdAt: '2025-01-01T12:08:00Z',
    });

    lessonCommentReplyRepository.listByComments.mockResolvedValue([
      replyLevel1,
      replyLevel2,
      replyLevel3,
      replyLevel4,
    ]);

    const [result] = await service.listLessonComments({
      lessonId: lesson.id,
      userId: USER_ID,
    });

    expect(result.replies).toHaveLength(1);
    expect(result.replies[0].id).toBe(REPLY_ID);
    expect(result.replies[0].replies).toHaveLength(1);
    expect(result.replies[0].replies[0].id).toBe(CHILD_REPLY_ID);
    expect(result.replies[0].replies[0].replies).toHaveLength(1);
    expect(result.replies[0].replies[0].replies[0].id).toBe(GRANDCHILD_REPLY_ID);
    expect(result.replies[0].replies[0].replies[0].replies).toHaveLength(0);
  });

  it('adds replies inheriting pending moderation from the parent comment', async () => {
    const lesson = buildLesson({ id: LESSON_ACCESSIBLE_ID });
    lessonRepository.findById.mockResolvedValue({
      ...lesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: true,
    });
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lesson])],
    });
    progressRepository.getByUserAndCourse.mockResolvedValue(null);

    const comment = buildComment({
      lessonId: lesson.id,
      pendingModeration: true,
      moderationStatus: 'pending',
    });
    lessonCommentRepository.findById.mockResolvedValue(comment);

    const createdReply = buildReply({
      pendingModeration: true,
      moderationStatus: 'pending',
      body: 'Thanks!',
    });
    lessonCommentReplyRepository.create.mockResolvedValue(createdReply);

    const result = await service.addLessonCommentReply({
      commentId: comment.id,
      userId: USER_ID,
      body: 'Thanks!',
    });

    expect(lessonCommentReplyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingModeration: true,
        moderationStatus: 'pending',
      }),
    );
    expect(result.pendingModeration).toBe(true);
  });

  it('blocks creating replies deeper than the allowed depth', async () => {
    const lesson = buildLesson({ id: LESSON_ACCESSIBLE_ID });
    lessonRepository.findById.mockResolvedValue({
      ...lesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
    });
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lesson])],
    });
    progressRepository.getByUserAndCourse.mockResolvedValue(null);

    const comment = buildComment({ lessonId: lesson.id });
    lessonCommentRepository.findById.mockResolvedValue(comment);

    const level1 = buildReply({ id: REPLY_ID, parentReplyId: null });
    const level2 = buildReply({ id: CHILD_REPLY_ID, parentReplyId: REPLY_ID });
    const level3 = buildReply({ id: GRANDCHILD_REPLY_ID, parentReplyId: CHILD_REPLY_ID });

    lessonCommentReplyRepository.findById.mockImplementation(async (id: UUID) => {
      if (id === GRANDCHILD_REPLY_ID) {
        return level3;
      }
      if (id === CHILD_REPLY_ID) {
        return level2;
      }
      if (id === REPLY_ID) {
        return level1;
      }
      return null;
    });

    await expect(
      service.addLessonCommentReply({
        commentId: comment.id,
        userId: USER_ID,
        body: 'Too deep',
        parentReplyId: GRANDCHILD_REPLY_ID,
      }),
    ).rejects.toMatchObject({ code: 'ACADEMY_COMMENT_REPLY_DEPTH_EXCEEDED' });
  });

  it('approves a pending comment and cascades moderation to replies', async () => {
    const pendingComment = buildComment({ pendingModeration: true, moderationStatus: 'pending' });
    const approvedComment = buildComment({ pendingModeration: false, moderationStatus: 'approved' });

    lessonCommentRepository.findById.mockResolvedValue(pendingComment);
    lessonCommentRepository.updateModeration.mockResolvedValue(approvedComment);

    const pendingReply = buildReply({
      id: REPLY_ID,
      pendingModeration: true,
      moderationStatus: 'pending',
    });
    const alreadyApprovedReply = buildReply({
      id: CHILD_REPLY_ID,
      pendingModeration: false,
      moderationStatus: 'approved',
    });

    lessonCommentReplyRepository.listByComments.mockResolvedValue([pendingReply, alreadyApprovedReply]);
    lessonCommentReplyRepository.updateModeration.mockResolvedValue(
      buildReply({ id: REPLY_ID, pendingModeration: false, moderationStatus: 'approved' }),
    );

    const result = await service.approveComment({ commentId: pendingComment.id, moderatorId: USER_ID });

    expect(lessonCommentRepository.updateModeration).toHaveBeenCalledWith({
      commentId: pendingComment.id,
      moderatorId: USER_ID,
      status: 'approved',
      moderatedAt: expect.any(String),
    });
    expect(lessonCommentReplyRepository.updateModeration).toHaveBeenCalledTimes(1);
    expect(lessonCommentReplyRepository.updateModeration).toHaveBeenCalledWith({
      replyId: REPLY_ID,
      moderatorId: USER_ID,
      status: 'approved',
      moderatedAt: expect.any(String),
    });
    expect(result.moderationStatus).toBe('approved');
  });

  it('rejects a comment and marks replies as rejected', async () => {
    const comment = buildComment({ pendingModeration: false, moderationStatus: 'approved' });
    const rejectedComment = buildComment({ pendingModeration: false, moderationStatus: 'rejected' });

    lessonCommentRepository.findById.mockResolvedValue(comment);
    lessonCommentRepository.updateModeration.mockResolvedValue(rejectedComment);

    const replyOne = buildReply({ id: REPLY_ID, moderationStatus: 'approved', pendingModeration: false });
    const replyTwo = buildReply({ id: CHILD_REPLY_ID, moderationStatus: 'pending', pendingModeration: true });
    lessonCommentReplyRepository.listByComments.mockResolvedValue([replyOne, replyTwo]);
    lessonCommentReplyRepository.updateModeration.mockResolvedValue(
      buildReply({ id: REPLY_ID, moderationStatus: 'rejected', pendingModeration: false }),
    );

    const result = await service.rejectComment({ commentId: comment.id, moderatorId: USER_ID });

    expect(lessonCommentRepository.updateModeration).toHaveBeenCalledWith({
      commentId: comment.id,
      moderatorId: USER_ID,
      status: 'rejected',
      moderatedAt: expect.any(String),
    });
    expect(lessonCommentReplyRepository.updateModeration).toHaveBeenCalledTimes(2);
    expect(lessonCommentReplyRepository.updateModeration).toHaveBeenCalledWith({
      replyId: REPLY_ID,
      moderatorId: USER_ID,
      status: 'rejected',
      moderatedAt: expect.any(String),
    });
    expect(lessonCommentReplyRepository.updateModeration).toHaveBeenCalledWith({
      replyId: CHILD_REPLY_ID,
      moderatorId: USER_ID,
      status: 'rejected',
      moderatedAt: expect.any(String),
    });
    expect(result.moderationStatus).toBe('rejected');
  });

  it('lists pending comments including their replies', async () => {
    const pendingComment = buildComment({ pendingModeration: true, moderationStatus: 'pending' });
    lessonCommentRepository.listPending.mockResolvedValue([pendingComment]);
    const pendingReply = buildReply({ moderationStatus: 'pending', pendingModeration: true });
    lessonCommentReplyRepository.listByComments.mockResolvedValue([pendingReply]);

    const [result] = await service.listPendingComments({ page: 1, pageSize: 5 });

    expect(lessonCommentRepository.listPending).toHaveBeenCalledWith({
      page: 1,
      pageSize: 5,
      status: 'pending',
    });
    expect(result.replies).toHaveLength(1);
    expect(result.replies[0].id).toBe(pendingReply.id);
  });

  it('blocks listing comments when lesson is locked', async () => {
    const lockedLesson = buildLesson({ id: LESSON_LOCKED_ID, releaseAt: '2025-02-01T00:00:00Z' });
    lessonRepository.findById.mockResolvedValue({
      ...lockedLesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
    });
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lockedLesson])],
    });
    progressRepository.getByUserAndCourse.mockResolvedValue(null);

    await expect(
      service.listLessonComments({
        lessonId: lockedLesson.id,
        userId: USER_ID,
      }),
    ).rejects.toMatchObject({ code: 'ACADEMY_LESSON_LOCKED' });
  });
  it('rates an accessible lesson and persists rating metadata', async () => {
    const lesson = {
      ...buildLesson({ id: LESSON_ACCESSIBLE_ID, releaseAt: null }),
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
      courseReleaseDate: null,
      moduleDripReleaseAt: null,
      moduleDripDaysAfter: null,
      moduleDripAfterModuleId: null,
    };
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lesson])],
    });
    lessonRepository.findById.mockResolvedValue(lesson);
    progressRepository.getByUserAndCourse.mockResolvedValue(null);
    const rating: LessonRating = {
      id: uuid('99999999-9999-4999-8999-999999999998'),
      lessonId: lesson.id,
      userId: USER_ID,
      value: 5,
      createdAt: '2025-01-01T12:00:00.000Z',
    };
    lessonRatingRepository.upsert.mockResolvedValue(rating);

    const result = await service.rateLesson({ lessonId: lesson.id, userId: USER_ID, value: 5 });

    expect(lessonRatingRepository.upsert).toHaveBeenCalledWith({
      lessonId: lesson.id,
      userId: USER_ID,
      value: 5,
      createdAt: '2025-01-01T12:00:00.000Z',
    });
    expect(result).toEqual(rating);
  });

  it('blocks rating when lesson is locked by drip rules', async () => {
    const courseLesson = buildLesson({ id: LESSON_LOCKED_ID, releaseAt: null });
    const lockedModule: CourseModule = {
      ...buildModule([courseLesson]),
      dripReleaseAt: '2025-02-01T00:00:00Z',
    };
    const futureLesson = {
      ...courseLesson,
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
      courseReleaseDate: null,
      moduleDripReleaseAt: lockedModule.dripReleaseAt,
      moduleDripDaysAfter: null,
      moduleDripAfterModuleId: null,
    };
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [lockedModule],
    });
    lessonRepository.findById.mockResolvedValue(futureLesson);
    progressRepository.getByUserAndCourse.mockResolvedValue(null);

    const accessibleMap = (service as any).collectAccessibleLessonOrder({
      ...buildCourseMeta(),
      modules: [lockedModule],
    }, new Date('2025-01-01T12:00:00Z'), new Set());
    expect(accessibleMap.has(futureLesson.id)).toBe(false);

    await expect(service.rateLesson({ lessonId: futureLesson.id, userId: USER_ID, value: 4 })).rejects.toMatchObject({
      code: 'ACADEMY_LESSON_LOCKED',
      statusCode: 403,
    });
    expect(lessonRatingRepository.upsert).not.toHaveBeenCalled();
  });

  it('records progress ticks clamping position and calculating percentage', async () => {
    const lesson = {
      ...buildLesson({
        id: LESSON_ACCESSIBLE_ID,
        content: {
          type: LessonType.Video,
          video: { videoUrl: 'https://cdn', durationSeconds: 200, captionsUrl: null, transcript: null },
        },
      }),
      courseId: COURSE_ID,
      isCommentingEnabled: true,
      isCommentingModerated: false,
      courseReleaseDate: null,
      moduleDripReleaseAt: null,
      moduleDripDaysAfter: null,
      moduleDripAfterModuleId: null,
    };
    const aggregate: LessonProgressAggregate = {
      lessonId: lesson.id,
      userId: USER_ID,
      lastPositionSeconds: 200,
      percentage: 100,
      updatedAt: '2025-01-01T12:00:00.000Z',
    };
    courseRepository.findTreeById.mockResolvedValue({
      ...buildCourseMeta(),
      modules: [buildModule([lesson])],
    });
    lessonRepository.findById.mockResolvedValue(lesson);
    progressRepository.getByUserAndCourse.mockResolvedValue(null);
    lessonProgressRepository.recordTick.mockResolvedValue(aggregate);

    const result = await service.recordLessonProgressTick({
      lessonId: lesson.id,
      courseId: COURSE_ID,
      userId: USER_ID,
      positionMs: 350_000,
      durationMs: 200_000,
      completed: true,
      emittedAt: '2025-01-01T11:59:30.000Z',
    });

    expect(lessonProgressRepository.recordTick).toHaveBeenCalledWith({
      lessonId: lesson.id,
      userId: USER_ID,
      positionSeconds: 200,
      occurredAt: '2025-01-01T11:59:30.000Z',
      percentage: 100,
    });
    expect(result).toEqual({
      lessonId: lesson.id,
      courseId: COURSE_ID,
      userId: USER_ID,
      lastPositionMs: 200_000,
      percentage: 100,
      completed: true,
      updatedAt: '2025-01-01T12:00:00.000Z',
    });
  });

});
