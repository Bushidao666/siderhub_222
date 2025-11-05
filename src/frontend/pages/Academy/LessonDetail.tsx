import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { VideoJsPlayer } from 'video.js';

import { colors, glows, surfaces, typography } from '../../../shared/design/tokens';
import type { Lesson } from '../../../shared/types/academy.types';
import { LessonType, UserRole } from '../../../shared/types/common.types';
import { mapApiError } from '../../../shared/utils/errorHandler';
import { LessonPlayer } from '../../components/academy/LessonPlayer';
import { useLessonComments } from '../../hooks/useLessonComments';
import { useLessonRating } from '../../hooks/useLessonRating';
import { useLessonVideoTracking } from '../../hooks/useLessonVideoTracking';
import { academyService } from '../../services/academyService';
import { selectUser, useAuthStore } from '../../store/auth';

const FALLBACK_VIDEO_URL = 'https://vjs.zencdn.net/v/oceans.mp4';

export const LessonDetail = () => {
  const { lessonId = 'lesson-placeholder' } = useParams<{ lessonId: string }>();
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);
  const [replySubmitError, setReplySubmitError] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const lesson: Lesson = useMemo(
    () => ({
      id: lessonId,
      moduleId: 'module-placeholder',
      order: 1,
      title: 'Conteúdo em preparação',
      summary: 'Estamos finalizando os detalhes desta aula neon. Enquanto isso, você pode revisar os materiais anteriores.',
      type: LessonType.Video,
      content: {
        type: LessonType.Video,
        video: {
          videoUrl: FALLBACK_VIDEO_URL,
          durationSeconds: 600,
          captionsUrl: null,
          transcript: null,
        },
      },
      durationMinutes: 10,
      isPreview: true,
      releaseAt: null,
    }),
    [lessonId]
  );

  const durationMs = lesson.content.type === LessonType.Video ? lesson.content.video.durationSeconds * 1000 : null;

  const lessonComments = useLessonComments({ lessonId, enabled: Boolean(lessonId) });
  const commentsErrorMessage = useMemo(() => {
    if (lessonComments.isLoading || lessonComments.isFetching) {
      return null;
    }
    if (!lessonComments.error) {
      return null;
    }
    if (lessonComments.comments.length > 0) {
      return null;
    }
    return mapApiError(lessonComments.error);
  }, [lessonComments.comments.length, lessonComments.error, lessonComments.isFetching, lessonComments.isLoading]);

  const user = useAuthStore(selectUser);
  const userRole = user?.role;
  const canModerate = Boolean(
    userRole && [UserRole.Mentor, UserRole.Admin, UserRole.SuperAdmin].includes(userRole),
  );
  const canInteract = Boolean(user);

  const handleSubmitComment = useCallback(
    async (body: string) => {
      setCommentSubmitError(null);
      try {
        await lessonComments.addCommentAsync({ body });
      } catch (error) {
        const message = mapApiError(error);
        setCommentSubmitError(message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [lessonComments],
  );

  const handleReplyToComment = useCallback(
    async ({ rootCommentId, parentId, body }: { rootCommentId: string; parentId: string; body: string }) => {
      setReplySubmitError(null);
      try {
        await lessonComments.addReplyAsync({
          commentId: rootCommentId,
          parentReplyId: parentId === rootCommentId ? null : parentId,
          body,
        });
      } catch (error) {
        const message = mapApiError(error);
        setReplySubmitError(message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [lessonComments],
  );

  const handleApproveComment = useCallback(
    async ({ commentId, replyId }: { commentId: string; replyId?: string }) => {
      setModerationError(null);
      if (!lessonId || lessonId === 'lesson-placeholder') {
        setModerationError('Aula inválida para moderação.');
        return;
      }
      try {
        if (replyId) {
          await academyService.approveLessonCommentReply(lessonId, commentId, replyId);
        } else {
          await academyService.approveLessonComment(lessonId, commentId);
        }
        await lessonComments.refetch();
      } catch (error) {
        const message = mapApiError(error);
        setModerationError(message);
      }
    },
    [lessonComments, lessonId],
  );

  const handleRejectComment = useCallback(
    async ({ commentId, replyId }: { commentId: string; replyId?: string }) => {
      setModerationError(null);
      if (!lessonId || lessonId === 'lesson-placeholder') {
        setModerationError('Aula inválida para moderação.');
        return;
      }
      try {
        if (replyId) {
          await academyService.rejectLessonCommentReply(lessonId, commentId, replyId);
        } else {
          await academyService.rejectLessonComment(lessonId, commentId);
        }
        await lessonComments.refetch();
      } catch (error) {
        const message = mapApiError(error);
        setModerationError(message);
      }
    },
    [lessonComments, lessonId],
  );

  const tracking = useLessonVideoTracking({
    lessonId,
    courseId: lesson.moduleId,
    durationMs,
    getPositionMs: () => (playerRef.current ? playerRef.current.currentTime() * 1000 : 0),
    isPlaying,
    enabled: Boolean(durationMs),
    onCompleted: () => setTrackingError(null),
    onError: (message) => setTrackingError(message),
  });

  const rating = useLessonRating({ lessonId, enabled: true });
  const ratingErrorMessage = rating.error instanceof Error ? rating.error.message : rating.error ? String(rating.error) : null;

  const handleVideoReady = useCallback(
    (player: VideoJsPlayer) => {
      cleanupRef.current?.();
      playerRef.current = player;

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        tracking.markCompleted();
      };

      player.on('play', handlePlay);
      player.on('pause', handlePause);
      player.on('ended', handleEnded);

      cleanupRef.current = () => {
        player.off('play', handlePlay);
        player.off('pause', handlePause);
        player.off('ended', handleEnded);
      };

      if (tracking.progress?.lastPositionMs) {
        player.currentTime(tracking.progress.lastPositionMs / 1000);
      }
    },
    [tracking]
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  useEffect(() => {
    if (!playerRef.current || !tracking.progress?.lastPositionMs) {
      return;
    }
    const seconds = tracking.progress.lastPositionMs / 1000;
    const current = playerRef.current.currentTime();
    if (Math.abs(current - seconds) > 1.5) {
      playerRef.current.currentTime(seconds);
    }
  }, [tracking.progress?.lastPositionMs]);

  return (
    <section className="space-y-8" data-testid="academy-lesson-detail">
      <header className="space-y-2">
        <p
          className="text-xs uppercase tracking-[0.22em]"
          style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
        >
          Aula Blacksider
        </p>
        <h1
          className="text-4xl uppercase"
          style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.text }}
        >
          {lesson.title}
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {lesson.summary}
        </p>
      </header>

      <LessonPlayer
        lesson={lesson}
        moduleTitle="Módulo neon em breve"
        comments={lessonComments.comments}
        commentsLoading={lessonComments.isLoading || lessonComments.isFetching}
        commentsError={commentsErrorMessage}
        onRetryComments={() => lessonComments.refetch()}
        onSubmitComment={handleSubmitComment}
        commentSubmitting={lessonComments.isSubmitting}
        commentSubmitError={commentSubmitError}
        commentReplying={lessonComments.isReplying}
        replySubmitError={replySubmitError}
        commentFormLabel="Participar da discussão"
        commentPlaceholder="Compartilhe um insight neon ou peça ajuda para os mentores..."
        commentEmptyState="Ainda não há comentários nesta aula. Seja o primeiro a participar!"
        canComment={canInteract}
        canReply={canInteract}
        maxReplyDepth={3}
        onReplyToComment={canInteract ? handleReplyToComment : undefined}
        allowModeration={canModerate}
        onApproveComment={canModerate ? handleApproveComment : undefined}
        onRejectComment={canModerate ? handleRejectComment : undefined}
        moderationError={moderationError}
        onVideoReady={handleVideoReady}
        onProgressTick={(payload) =>
          tracking.sendTick({ positionMs: payload.positionSeconds * 1000 })
        }
        onReachCompletionThreshold={() => tracking.markCompleted()}
        resumeSeconds={tracking.progress?.lastPositionMs ? tracking.progress.lastPositionMs / 1000 : undefined}
        ratingAverage={rating.averageRating}
        ratingCount={rating.totalRatings}
        userRating={rating.userRating}
        onSubmitRating={(value) => rating.setRatingAsync(value)}
        ratingSubmitting={rating.isSubmitting}
        ratingError={ratingErrorMessage}
      />

      {trackingError ? (
        <div
          className="rounded-2xl border border-[var(--err-border)] bg-[var(--err-bg)] p-4 text-sm"
          style={{ '--err-border': colors.accentError, '--err-bg': surfaces.errorTint } as CSSProperties}
        >
          {trackingError}
        </div>
      ) : null}
    </section>
  );
};

export default LessonDetail;
