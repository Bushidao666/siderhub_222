import type { CSSProperties } from 'react';
import { Fragment, useMemo, useState } from 'react';

import { colors, glows, typography } from '../../../../shared/design/tokens';
import type { LessonComment, LessonCommentReply } from '../../../../shared/types/academy.types';
import { Button } from '../../common';
import { CommentForm } from './CommentForm';
import { PendingBadge } from './PendingBadge';

export type CommentAuthorMeta = {
  id: string;
  displayName?: string;
  role?: 'member' | 'mentor' | 'admin';
  avatarUrl?: string | null;
};

export type CommentThreadReply = LessonCommentReply & {
  author?: CommentAuthorMeta;
  replies?: CommentThreadReply[];
  pendingModeration?: boolean;
};

export type CommentThreadComment = LessonComment & {
  author?: CommentAuthorMeta;
  replies: CommentThreadReply[];
};

type ReplyHandler = (payload: { rootCommentId: string; parentId: string; body: string }) => Promise<void> | void;
type ModerationHandler = (payload: { commentId: string; replyId?: string }) => Promise<void> | void;

type CommentThreadProps = {
  comments: CommentThreadComment[];
  maxDepth?: number;
  allowReply?: boolean;
  allowModeration?: boolean;
  onReply?: ReplyHandler;
  onApprove?: ModerationHandler;
  onReject?: ModerationHandler;
  emptyState?: string;
  dataTestId?: string;
  replying?: boolean;
  replyError?: string | null;
};

const isPromise = (value: unknown): value is Promise<unknown> => {
  return typeof value === 'object' && value !== null && 'then' in value && typeof (value as Promise<unknown>).then === 'function';
};

type CommentNodeProps = {
  node: CommentThreadComment | CommentThreadReply;
  depth: number;
  rootId: string;
  isRoot: boolean;
  maxDepth: number;
  allowReply: boolean;
  allowModeration: boolean;
  replyingTo: string | null;
  onReplyClick: (targetId: string) => void;
  onReplySubmit: ReplyHandler | undefined;
  onApprove?: ModerationHandler;
  onReject?: ModerationHandler;
  closeReply: () => void;
  isReplying?: boolean;
  replyError?: string | null;
};

const formatAuthorLabel = (node: CommentThreadComment | CommentThreadReply) => {
  const { author } = node;
  if (author?.displayName) {
    return author.displayName;
  }
  if (author?.id) {
    return author.id;
  }
  if ('userId' in node) {
    return node.userId;
  }
  return 'Membro Blacksider';
};

const formatTimestamp = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('pt-BR');
  } catch {
    return iso;
  }
};

const baseCardStyle: CSSProperties = {
  '--comment-border': colors.borderPrimary,
  '--comment-bg': colors.bgPrimary,
  '--comment-glow': glows.sm,
};

const ReplyActions = ({
  targetId,
  rootId,
  allowReply,
  allowModeration,
  pendingModeration,
  onReplyClick,
  onApprove,
  onReject,
  isReplying,
}: {
  targetId: string;
  rootId: string;
  allowReply: boolean;
  allowModeration: boolean;
  pendingModeration?: boolean;
  onReplyClick: (id: string) => void;
  onApprove?: ModerationHandler;
  onReject?: ModerationHandler;
  isReplying?: boolean;
}) => {
  if (!allowReply && !allowModeration) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2" style={{ fontFamily: typography.fontHeading, letterSpacing: '0.12em' }}>
      {allowReply ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={Boolean(isReplying)}
          onClick={() => onReplyClick(targetId)}
          data-testid={`lesson-comment-reply-btn-${targetId}`}
        >
          Responder
        </Button>
      ) : null}
      {allowModeration && pendingModeration ? (
        <Fragment>
          {onApprove ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={Boolean(isReplying)}
              onClick={() => void onApprove({ commentId: rootId, replyId: targetId === rootId ? undefined : targetId })}
              data-testid={`lesson-comment-approve-${targetId}`}
            >
              Aprovar
            </Button>
          ) : null}
          {onReject ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={Boolean(isReplying)}
              onClick={() => void onReject({ commentId: rootId, replyId: targetId === rootId ? undefined : targetId })}
              data-testid={`lesson-comment-reject-${targetId}`}
            >
              Rejeitar
            </Button>
          ) : null}
        </Fragment>
      ) : null}
    </div>
  );
};

const CommentNode = ({
  node,
  depth,
  rootId,
  isRoot,
  maxDepth,
  allowReply,
  allowModeration,
  replyingTo,
  onReplyClick,
  onReplySubmit,
  onApprove,
  onReject,
  closeReply,
  isReplying,
  replyError,
}: CommentNodeProps) => {
  const canReply = allowReply && depth < maxDepth - 1 && Boolean(onReplySubmit);
  const pendingModeration = 'pendingModeration' in node ? node.pendingModeration : false;
  const replies = 'replies' in node && node.replies ? node.replies : [];
  const canModerateNode = allowModeration && pendingModeration && (onApprove || onReject);

  return (
    <article
      className="space-y-3 rounded-3xl border border-[var(--comment-border)] bg-[var(--comment-bg)] p-4 shadow-[var(--comment-glow)]"
      style={baseCardStyle}
      data-testid={isRoot ? 'lesson-comment-item' : 'lesson-comment-reply'}
      data-depth={depth}
      data-comment-id={node.id}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-3" style={{ fontFamily: typography.fontHeading }}>
          <span className="text-sm uppercase tracking-[0.18em]" style={{ color: colors.primary }}>
            {formatAuthorLabel(node)}
          </span>
          {node.author?.role ? (
            <span className="text-[0.65rem] uppercase tracking-[0.18em]" style={{ color: colors.textSecondary }}>
              {node.author.role}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: colors.textTertiary }}>
          <time>{formatTimestamp(node.createdAt)}</time>
          {pendingModeration ? <PendingBadge /> : null}
        </div>
      </header>
      <p className="whitespace-pre-wrap text-sm" style={{ color: colors.textPrimary }}>
        {'body' in node ? node.body : ''}
      </p>
      <ReplyActions
        targetId={node.id}
        rootId={rootId}
        allowReply={canReply}
        allowModeration={canModerateNode}
        pendingModeration={pendingModeration}
        onReplyClick={onReplyClick}
        onApprove={onApprove}
        onReject={onReject}
        isReplying={isReplying}
      />
      {replyingTo === node.id && onReplySubmit ? (
        <div className="pl-4">
          <CommentForm
            testId={`lesson-comment-reply-form-${node.id}`}
            label="Responder"
            submitLabel="Enviar reply"
            onCancel={closeReply}
            submitting={Boolean(isReplying)}
            error={replyError ?? undefined}
            onSubmit={(body) => {
              const result = onReplySubmit({ rootCommentId: rootId, parentId: node.id, body });
              if (isPromise(result)) {
                return result
                  .then((value) => {
                    closeReply();
                    return value;
                  })
                  .catch((error) => {
                    throw error;
                  });
              }
              closeReply();
              return result;
            }}
          />
        </div>
      ) : null}
      {replies.length > 0 ? (
        <div className="space-y-3 border-l border-[var(--reply-border)] pl-4" style={{ '--reply-border': colors.borderPrimary } as CSSProperties}>
          {replies.map((child) => (
            <CommentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              rootId={rootId}
              isRoot={false}
              maxDepth={maxDepth}
              allowReply={allowReply}
              allowModeration={allowModeration}
              replyingTo={replyingTo}
              onReplyClick={onReplyClick}
              onReplySubmit={onReplySubmit}
              onApprove={onApprove}
              onReject={onReject}
              closeReply={closeReply}
              isReplying={isReplying}
              replyError={replyError}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
};

export const CommentThread = ({
  comments,
  maxDepth = 3,
  allowReply = true,
  allowModeration = false,
  onReply,
  onApprove,
  onReject,
  emptyState = 'Seja o primeiro a comentar esta aula.',
  dataTestId = 'lesson-comment-thread',
  replying = false,
  replyError = null,
}: CommentThreadProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const closeReply = () => setReplyingTo(null);

  const handleReplyClick = (targetId: string) => {
    setReplyingTo((current) => (current === targetId ? null : targetId));
  };

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [comments]);

  if (sortedComments.length === 0) {
    return (
      <div
        data-testid={`${dataTestId}-empty`}
        className="rounded-3xl border border-dashed border-[var(--empty-border)] bg-[var(--empty-bg)] p-6 text-center text-sm"
        style={{ '--empty-border': colors.borderPrimary, '--empty-bg': colors.bgSecondary } as CSSProperties}
      >
        <p style={{ color: colors.textSecondary }}>{emptyState}</p>
      </div>
    );
  }

  return (
    <div data-testid={dataTestId} className="space-y-4">
      {sortedComments.map((comment) => (
        <CommentNode
          key={comment.id}
          node={comment}
          depth={0}
          rootId={comment.id}
          isRoot
          maxDepth={maxDepth}
          allowReply={allowReply}
          allowModeration={allowModeration}
          replyingTo={replyingTo}
          onReplyClick={handleReplyClick}
          onReplySubmit={onReply}
          onApprove={onApprove}
          onReject={onReject}
          closeReply={closeReply}
          isReplying={replying}
          replyError={replyError}
        />
      ))}
    </div>
  );
};

export default CommentThread;
