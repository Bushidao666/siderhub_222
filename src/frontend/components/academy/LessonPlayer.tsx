import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import videojs from 'video.js';
import type { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hotkeys';
import '@silvermine/videojs-quality-selector/dist/js/silvermine-videojs-quality-selector';
import '@silvermine/videojs-quality-selector/dist/css/quality-selector.css';

import { colors, glows, surfaces, typography } from '../../../shared/design/tokens';
import type {
  Lesson,
  LessonComment,
  LessonDownloadable,
  LessonContent,
  LessonRatingValue,
} from '../../../shared/types/academy.types';
import { LessonType } from '../../../shared/types/common.types';
import { Badge, Button, Card, CardContent, CardTitle, Tabs } from '../common';
import { CommentForm } from './comments/CommentForm';
import { CommentThread, type CommentThreadComment } from './comments/CommentThread';
import { RatingStars } from './RatingStars';

type VideoProgressPayload = {
  lessonId: string;
  positionSeconds: number;
  durationSeconds: number;
  percentage: number;
};

type CommentReplyHandler = (payload: { rootCommentId: string; parentId: string; body: string }) => Promise<void> | void;
type CommentModerationHandler = (payload: { commentId: string; replyId?: string }) => Promise<void> | void;

type LessonPlayerProps = {
  lesson: Lesson;
  moduleTitle: string;
  comments?: LessonComment[];
  onToggleCompleted?: (lessonId: string) => void;
  isCompleted?: boolean;
  isLoading?: boolean;
  onDownloadAsset?: (asset: LessonDownloadable) => void;
  onJoinLive?: (url: string) => void;
  resumeSeconds?: number;
  onVideoReady?: (player: VideoJsPlayer) => void;
  onProgressTick?: (payload: VideoProgressPayload) => void;
  onReachCompletionThreshold?: (payload: VideoProgressPayload) => void;
  ratingAverage?: number | null;
  ratingCount?: number;
  userRating?: LessonRatingValue | null;
  onSubmitRating?: (value: LessonRatingValue) => Promise<void> | void;
  ratingSubmitting?: boolean;
  ratingError?: string | null;
  commentsLoading?: boolean;
  commentsError?: string | null;
  onRetryComments?: () => void;
  onSubmitComment?: (body: string) => Promise<void> | void;
  commentSubmitting?: boolean;
  commentSubmitError?: string | null;
  commentReplying?: boolean;
  replySubmitError?: string | null;
  commentFormLabel?: string;
  commentPlaceholder?: string;
  canComment?: boolean;
  canReply?: boolean;
  maxReplyDepth?: number;
  onReplyToComment?: CommentReplyHandler;
  allowModeration?: boolean;
  onApproveComment?: CommentModerationHandler;
  onRejectComment?: CommentModerationHandler;
  commentEmptyState?: string;
  moderationError?: string | null;
};

type LessonVideoPlayerProps = {
  lessonId: string;
  sourceUrl: string;
  poster?: string | null;
  resumeSeconds?: number;
  onReady?: (player: VideoJsPlayer) => void;
  onProgressTick?: (payload: VideoProgressPayload) => void;
  onReachCompletionThreshold?: (payload: VideoProgressPayload) => void;
  estimatedDurationSeconds?: number;
};

const VIDEO_POSTER_FALLBACK =
  'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1200&q=80';

const contentTabs = [
  { id: 'content', label: 'Conteúdo' },
  { id: 'materials', label: 'Materiais' },
  { id: 'comments', label: 'Comentários' },
];

export const LessonPlayer = ({
  lesson,
  moduleTitle,
  comments = [],
  onToggleCompleted,
  isCompleted,
  isLoading,
  onDownloadAsset,
  onJoinLive,
  resumeSeconds,
  onVideoReady,
  onProgressTick,
  onReachCompletionThreshold,
  ratingAverage = null,
  ratingCount = 0,
  userRating = null,
  onSubmitRating,
  ratingSubmitting,
  ratingError,
  commentsLoading = false,
  commentsError = null,
  onRetryComments,
  onSubmitComment,
  commentSubmitting = false,
  commentSubmitError = null,
  commentReplying = false,
  replySubmitError = null,
  commentFormLabel = 'Adicionar comentário',
  commentPlaceholder = 'Compartilhe seus aprendizados ou dúvidas sobre esta aula...',
  canComment,
  canReply,
  maxReplyDepth = 3,
  onReplyToComment,
  allowModeration = false,
  onApproveComment,
  onRejectComment,
  commentEmptyState,
  moderationError = null,
}: LessonPlayerProps) => {
  const isLive = lesson.type === LessonType.Live;
  const liveContent = lesson.content.type === LessonType.Live ? lesson.content : null;
  const hasAssets = lesson.type === LessonType.Download && lesson.content.type === LessonType.Download;
  const commentThreadItems = useMemo<CommentThreadComment[]>(() => {
    return comments.map((comment) => ({
      ...comment,
      replies: comment.replies ?? [],
    }));
  }, [comments]);
  const hasComments = commentThreadItems.length > 0;
  const isVideoLesson = lesson.content.type === LessonType.Video;

  const tabs = useMemo(() => {
    const commentsBadge = commentsLoading ? (
      <Badge variant="outline">...</Badge>
    ) : (
      <Badge variant="outline">{commentThreadItems.length}</Badge>
    );
    return contentTabs.map((tab) => {
      if (tab.id === 'materials' && !hasAssets) {
        return { ...tab, disabled: true };
      }
      if (tab.id === 'comments') {
        if (commentsError) {
          return { ...tab, badge: <Badge variant="outline">!</Badge> };
        }
        return { ...tab, badge: commentsBadge };
      }
      return tab;
    });
  }, [commentThreadItems.length, commentsError, commentsLoading, hasAssets]);

  const handleProgress = useCallback(
    (payload: VideoProgressPayload) => {
      onProgressTick?.(payload);
    },
    [onProgressTick],
  );

  const handleThreshold = useCallback(
    (payload: VideoProgressPayload) => {
      onReachCompletionThreshold?.(payload);
    },
    [onReachCompletionThreshold],
  );

  const resolvedCanComment = Boolean(onSubmitComment) && (canComment ?? true);
  const resolvedCanReply = Boolean(onReplyToComment) && (canReply ?? true);

  const commentsSection = (
    <div className="space-y-4" data-testid="lesson-comments-section">
      {commentsError ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--comment-error-border)] bg-[var(--comment-error-bg)] p-4 text-sm"
          style={{
            '--comment-error-border': colors.accentError,
            '--comment-error-bg': 'rgba(255, 51, 51, 0.08)',
            color: colors.accentError,
          } as CSSProperties}
          data-testid="lesson-comments-error"
        >
          <span>{commentsError}</span>
          {onRetryComments ? (
            <Button type="button" size="sm" variant="ghost" onClick={onRetryComments}>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : null}

      {resolvedCanComment ? (
        <CommentForm
          label={commentFormLabel}
          placeholder={commentPlaceholder}
          onSubmit={(body) => onSubmitComment?.(body)}
          submitting={commentSubmitting}
          error={commentSubmitError ?? undefined}
        />
      ) : null}

      {commentsLoading ? (
        <CommentThreadSkeleton />
      ) : (
        <CommentThread
          comments={commentThreadItems}
          maxDepth={maxReplyDepth}
          allowReply={resolvedCanReply}
          onReply={resolvedCanReply ? onReplyToComment : undefined}
          allowModeration={allowModeration && Boolean(onApproveComment || onRejectComment)}
          onApprove={allowModeration ? onApproveComment : undefined}
          onReject={allowModeration ? onRejectComment : undefined}
          emptyState={commentEmptyState}
          replying={commentReplying}
        />
      )}
      {replySubmitError ? (
        <div
          className="rounded-3xl border border-[var(--reply-error-border)] bg-[var(--reply-error-bg)] p-3 text-sm"
          style={{
            '--reply-error-border': colors.accentError,
            '--reply-error-bg': surfaces.errorTint,
            color: colors.accentError,
          } as CSSProperties}
          data-testid="lesson-comments-reply-error"
        >
          {replySubmitError}
        </div>
      ) : null}
      {moderationError ? (
        <div
          className="rounded-3xl border border-[var(--moderation-error-border)] bg-[var(--moderation-error-bg)] p-3 text-sm"
          style={{
            '--moderation-error-border': colors.accentWarning,
            '--moderation-error-bg': surfaces.infoTint,
            color: colors.accentWarning,
          } as CSSProperties}
          data-testid="lesson-comments-moderation-error"
        >
          {moderationError}
        </div>
      ) : null}
    </div>
  );

  if (isLoading) {
    return <LessonPlayerSkeleton />;
  }

  return (
    <Card glowing className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Badge variant="outline">{moduleTitle}</Badge>
        <CardTitle className="text-3xl" style={{ color: colors.primary }}>
          {lesson.title}
        </CardTitle>
        <CardContent style={{ color: colors.textSecondary }}>{lesson.summary}</CardContent>
        <div
          className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em]"
          style={{ color: colors.textSecondary, fontFamily: typography.fontHeading }}
        >
          <span>Tipo: {lessonTypeLabel(lesson.type)}</span>
          <span>Duração: {lesson.durationMinutes}min</span>
          {lesson.releaseAt ? <span>Liberado em: {new Date(lesson.releaseAt).toLocaleString('pt-BR')}</span> : null}
        </div>
      </div>
      <div
        className="relative overflow-hidden rounded-3xl border border-[var(--player-border)] bg-[var(--player-bg)] shadow-[var(--player-shadow)]"
        style={{
          '--player-border': colors.borderPrimary,
          '--player-bg': colors.bgPrimary,
          '--player-shadow': glows.md,
        } as CSSProperties}
      >
        {isVideoLesson ? (
          <LessonVideoPlayer
            lessonId={lesson.id}
            sourceUrl={lesson.content.video.videoUrl}
            resumeSeconds={resumeSeconds}
            onReady={onVideoReady}
            onProgressTick={handleProgress}
            onReachCompletionThreshold={handleThreshold}
            estimatedDurationSeconds={lesson.content.video.durationSeconds}
          />
        ) : (
          renderMedia(lesson.content)
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3
          className="text-sm uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
        >
          Avaliação da aula
        </h3>
        <RatingStars
          averageRating={ratingAverage}
          totalRatings={ratingCount}
          userRating={userRating}
          onRate={onSubmitRating}
          submitting={Boolean(ratingSubmitting)}
        />
        {ratingError ? (
          <span className="text-xs" style={{ color: colors.accentError }}>
            {ratingError}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => onToggleCompleted?.(lesson.id)}
          data-testid="lesson-complete"
        >
          {isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
        </Button>
        {isLive && liveContent ? (
          <Button
            variant="primary"
            onClick={() => {
              if (onJoinLive) {
                onJoinLive(liveContent.meetingUrl);
                return;
              }
              if (typeof window !== 'undefined') {
                window.open(liveContent.meetingUrl, '_blank', 'noopener');
              }
            }}
          >
            Entrar na sessão
          </Button>
        ) : null}
      </div>
      <Tabs
        tabs={tabs}
        defaultValue="content"
        renderContent={(tab) => {
          switch (tab.id) {
            case 'materials':
              return renderMaterials(lesson.content, onDownloadAsset);
            case 'comments':
              return commentsSection;
            default:
              return renderLessonContent(lesson.content);
          }
        }}
      />
    </Card>
  );
};

const lessonTypeLabel = (type: LessonType): string => {
  switch (type) {
    case LessonType.Video:
      return 'Vídeo';
    case LessonType.Article:
      return 'Artigo';
    case LessonType.Live:
      return 'Live';
    case LessonType.Download:
      return 'Download';
    case LessonType.Quiz:
      return 'Quiz';
    default:
      return 'Conteúdo';
  }
};

const LessonVideoPlayer = ({
  lessonId,
  sourceUrl,
  poster,
  resumeSeconds,
  onReady,
  onProgressTick,
  onReachCompletionThreshold,
  estimatedDurationSeconds,
}: LessonVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const lastTickRef = useRef(0);
  const thresholdTriggeredRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }

    const options: VideoJsPlayerOptions = {
      controls: true,
      preload: 'auto',
      autoplay: false,
      responsive: true,
      fluid: true,
      poster: poster ?? VIDEO_POSTER_FALLBACK,
      sources: [
        {
          src: sourceUrl,
          type: 'video/mp4',
        },
      ],
      controlBar: {
        pictureInPictureToggle: true,
        playbackRateMenuButton: true,
        volumePanel: {
          inline: false,
        },
      },
    };

    const player = videojs(videoRef.current, options, () => {
      if (resumeSeconds && resumeSeconds > 0) {
        player.currentTime(resumeSeconds);
      }
      if (typeof player.hotkeys === 'function') {
        player.hotkeys({
          volumeStep: 0.1,
          seekStep: 10,
          enableModifiersForNumbers: false,
        });
      }
      if (player.controlBar?.addChild) {
        // avoids duplicate quality selector if component remounts
        if (!player.controlBar.getChild('QualitySelector')) {
          player.controlBar.addChild('QualitySelector');
        }
      }
      onReady?.(player);
    });

    playerRef.current = player;

    const reportProgress = () => {
      const duration = player.duration() || estimatedDurationSeconds || 0;
      if (!duration || Number.isNaN(duration)) {
        return;
      }
      const currentTime = player.currentTime();
      const percentage = Math.min(100, (currentTime / duration) * 100);
      const payload: VideoProgressPayload = {
        lessonId,
        positionSeconds: Math.floor(currentTime),
        durationSeconds: Math.floor(duration),
        percentage,
      };

      const currentTick = Math.floor(currentTime / 10);
      if (currentTick > lastTickRef.current) {
        lastTickRef.current = currentTick;
        onProgressTick?.(payload);
      }

      if (!thresholdTriggeredRef.current && percentage >= 90) {
        thresholdTriggeredRef.current = true;
        onReachCompletionThreshold?.(payload);
      }
    };

    player.on('timeupdate', reportProgress);
    player.on('seeked', reportProgress);
    player.on('ended', reportProgress);

    return () => {
      player.off('timeupdate', reportProgress);
      player.off('seeked', reportProgress);
      player.off('ended', reportProgress);
      player.dispose();
      playerRef.current = null;
      lastTickRef.current = 0;
      thresholdTriggeredRef.current = false;
    };
  }, [estimatedDurationSeconds, lessonId, onProgressTick, onReady, onReachCompletionThreshold, resumeSeconds, sourceUrl, poster]);

  useEffect(() => {
    if (resumeSeconds && playerRef.current && resumeSeconds > 0) {
      playerRef.current.currentTime(resumeSeconds);
    }
  }, [resumeSeconds]);

  return (
    <div data-testid="lesson-video-player" className="aspect-video">
      <video ref={videoRef} className="video-js vjs-big-play-centered h-full w-full" playsInline data-setup="{}" />
    </div>
  );
};

const renderMedia = (content: LessonContent): ReactNode => {
  if (content.type === LessonType.Live) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4" style={{ color: colors.textSecondary }}>
        <span className="text-4xl" aria-hidden>
          🔴
        </span>
        <p>Live agendada para {new Date(content.scheduledAt).toLocaleString('pt-BR')}</p>
        <p className="text-sm">Link da sala: {content.meetingUrl}</p>
      </div>
    );
  }

  return (
    <div className="flex h-64 items-center justify-center" style={{ color: colors.textSecondary }}>
      <p>Conteúdo disponível nas abas abaixo.</p>
    </div>
  );
};

const renderLessonContent = (content: LessonContent): ReactNode => {
  switch (content.type) {
    case LessonType.Video:
      return (
        <div className="space-y-4 text-sm" style={{ color: colors.textSecondary }}>
          <p>Duração total: {Math.round(content.video.durationSeconds / 60)} minutos</p>
          {content.video.transcript ? (
            <details
              className="rounded-2xl border border-[var(--transcript-border)] bg-[var(--transcript-bg)] p-4"
              style={{ '--transcript-border': colors.borderPrimary, '--transcript-bg': colors.bgPrimary } as CSSProperties}
            >
              <summary
                className="cursor-pointer text-xs uppercase tracking-[0.18em]"
                style={{ fontFamily: typography.fontHeading }}
              >
                Ver transcrição
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-sm" style={{ color: colors.textSecondary }}>
                {content.video.transcript}
              </pre>
            </details>
          ) : null}
        </div>
      );
    case LessonType.Article:
      return (
        <article className="prose prose-invert max-w-none text-sm" style={{ color: colors.textSecondary }}>
          <p className="whitespace-pre-wrap">{content.bodyMarkdown}</p>
        </article>
      );
    case LessonType.Live:
      return (
        <div className="space-y-3 text-sm" style={{ color: colors.textSecondary }}>
          <p>Live exclusiva. Verifique sua conexão antes do horário marcado.</p>
          <p>Agenda: {new Date(content.scheduledAt).toLocaleString('pt-BR')}</p>
        </div>
      );
    case LessonType.Download:
      return renderMaterials(content, undefined);
    case LessonType.Quiz:
      return (
        <div className="space-y-3 text-sm" style={{ color: colors.textSecondary }}>
          <p>Quiz com {content.questions.length} perguntas.</p>
          <p>As respostas corretas serão exibidas após o envio.</p>
        </div>
      );
    default:
      return null;
  }
};

const renderMaterials = (
  content: LessonContent,
  onDownloadAsset?: (asset: LessonDownloadable) => void,
): ReactNode => {
  if (content.type !== LessonType.Download) {
    return (
      <p className="text-sm" style={{ color: colors.textSecondary }}>
        Nenhum material adicional disponível para esta aula.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {content.assets.map((asset) => (
        <li
          key={asset.fileUrl}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--asset-border)] bg-[var(--asset-bg)] px-4 py-3"
          style={{ '--asset-border': colors.borderPrimary, '--asset-bg': colors.bgSecondary } as CSSProperties}
        >
          <div className="flex flex-col">
            <span className="text-sm" style={{ color: colors.textPrimary }}>
              {asset.fileName}
            </span>
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              {(asset.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
          <Button variant="secondary" onClick={() => onDownloadAsset?.(asset)} disabled={!onDownloadAsset}>
            Download
          </Button>
        </li>
      ))}
    </ul>
  );
};

const CommentThreadSkeleton = () => (
  <div
    className="space-y-3 rounded-3xl border border-[var(--skeleton-border)] bg-[var(--skeleton-bg)] p-4"
    style={{ '--skeleton-border': colors.borderPrimary, '--skeleton-bg': colors.bgPrimary } as CSSProperties}
    data-testid="lesson-comments-loading"
  >
    {[0, 1].map((key) => (
      <div key={`comment-skeleton-${key}`} className="space-y-2">
        <div className="h-4 w-2/3 rounded-full bg-[var(--skeleton-border)]" />
        <div className="h-12 rounded-2xl bg-[var(--skeleton-border)]" />
      </div>
    ))}
  </div>
);

const LessonPlayerSkeleton = () => (
  <div
    className="animate-pulse space-y-4 rounded-3xl border border-[var(--skeleton-border)] bg-[var(--skeleton-bg)] p-6"
    style={{ '--skeleton-border': colors.borderPrimary, '--skeleton-bg': colors.bgPrimary } as CSSProperties}
  >
    <div className="h-6 w-1/3 rounded-full bg-[var(--skeleton-border)]" />
    <div className="h-4 w-2/3 rounded-full bg-[var(--skeleton-border)]" />
    <div className="h-64 rounded-3xl bg-[var(--skeleton-border)]" />
    <div className="h-4 w-full rounded-full bg-[var(--skeleton-border)]" />
  </div>
);
