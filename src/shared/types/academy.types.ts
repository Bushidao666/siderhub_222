import { CourseStatus, LessonType, Nullable, UUID, Visibility } from './common.types';

export type LessonCommentModerationStatus = 'pending' | 'approved' | 'rejected';
export type CommentModerationStatus = LessonCommentModerationStatus;

export interface CourseMeta {
  id: UUID;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: Nullable<string>;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: CourseStatus;
  visibility: Visibility;
  estimatedDurationMinutes: number;
  totalLessons: number;
  tags: string[];
  releaseDate: Nullable<string>;
  isFeatured: boolean;
  recommendationScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: UUID;
  courseId: UUID;
  order: number;
  title: string;
  description: string;
  durationMinutes: number;
  dripReleaseAt: Nullable<string>;
  dripDaysAfter: Nullable<number>;
  dripAfterModuleId: Nullable<UUID>;
  lessons: Lesson[];
}

export interface LessonVideo {
  videoUrl: string;
  durationSeconds: number;
  captionsUrl: Nullable<string>;
  transcript: Nullable<string>;
}

export interface LessonDownloadable {
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
}

export interface LessonQuizQuestion {
  id: UUID;
  question: string;
  options: string[];
  correctIndex: number;
}

export type LessonContent =
  | { type: LessonType.Video; video: LessonVideo }
  | { type: LessonType.Article; bodyMarkdown: string }
  | { type: LessonType.Live; scheduledAt: string; meetingUrl: string }
  | { type: LessonType.Download; assets: LessonDownloadable[] }
  | { type: LessonType.Quiz; questions: LessonQuizQuestion[] };

export interface Lesson {
  id: UUID;
  moduleId: UUID;
  order: number;
  title: string;
  summary: string;
  type: LessonType;
  content: LessonContent;
  durationMinutes: number;
  isPreview: boolean;
  releaseAt: Nullable<string>;
}

export interface CourseTree extends CourseMeta {
  modules: CourseModule[];
}

export type LessonRatingValue = 1 | 2 | 3 | 4 | 5;

export interface LessonRating {
  id: UUID;
  lessonId: UUID;
  userId: UUID;
  value: LessonRatingValue;
  createdAt: string;
}

export interface LessonRatingSummary {
  lessonId: UUID;
  average: number;
  totalRatings: number;
  userRating?: LessonRatingValue;
}

export interface LessonRatingUpsert {
  lessonId: UUID;
  userId: UUID;
  value: LessonRatingValue;
}

export interface CourseProgress {
  courseId: UUID;
  userId: UUID;
  completedLessonIds: UUID[];
  percentage: number;
  lastLessonId: Nullable<UUID>;
  updatedAt: string;
}

export interface LessonProgressEvent {
  id: UUID;
  lessonId: UUID;
  userId: UUID;
  positionSeconds: number;
  occurredAt: string;
}

export interface LessonProgressAggregate {
  lessonId: UUID;
  userId: UUID;
  lastPositionSeconds: number;
  percentage: number;
  updatedAt: string;
}

export interface LessonProgressSnapshot {
  lessonId: UUID;
  courseId: UUID;
  userId: UUID;
  lastPositionMs: number;
  percentage: number;
  completed: boolean;
  updatedAt: string;
}

export interface LessonProgressTickPayload {
  lessonId: UUID;
  userId: UUID;
  courseId: UUID;
  durationMs: number;
  positionMs: number;
  completed: boolean;
  emittedAt: string;
}

export interface LessonComment {
  id: UUID;
  lessonId: UUID;
  userId: UUID;
  body: string;
  createdAt: string;
  updatedAt: string;
  pendingModeration: boolean;
  moderationStatus: LessonCommentModerationStatus;
  moderatedById: Nullable<UUID>;
  moderatedAt: Nullable<string>;
  replies: LessonCommentReply[];
}

export interface LessonCommentReply {
  id: UUID;
  commentId: UUID;
  parentReplyId: Nullable<UUID>;
  userId: UUID;
  body: string;
  createdAt: string;
  pendingModeration: boolean;
  moderationStatus: LessonCommentModerationStatus;
  moderatedById: Nullable<UUID>;
  moderatedAt: Nullable<string>;
  replies: LessonCommentReply[];
}

export interface CourseRecommendation {
  courseId: UUID;
  reason: string;
  badge?: 'new' | 'popular' | 'mentor_pick';
}
