import type { CSSProperties } from 'react';
import { useState, useCallback } from 'react';
import { colors, surfaces, typography } from '../../../shared/design/tokens';
import type { LessonComment, LessonCommentReply, CommentModerationStatus } from '../../../shared/types/academy.types';
import { Button, Card, CardContent, CardTitle, Input } from '../../components/common';

type CommentModerationProps = {
  comments: LessonComment[];
  loading?: boolean;
  error?: string | null;
  onApproveComment?: (commentId: string) => void;
  onRejectComment?: (commentId: string) => void;
  onApproveReply?: (replyId: string) => void;
  onRejectReply?: (replyId: string) => void;
  onBulkModerate?: (commentIds: string[], status: CommentModerationStatus) => void;
  onRetry?: () => void;
};

const moderationStatusLabels: Record<CommentModerationStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const moderationStatusColors: Record<CommentModerationStatus, { bg: string; text: string }> = {
  pending: { bg: surfaces.warningTint, text: colors.accentWarning },
  approved: { bg: surfaces.successTint, text: colors.accentSuccess },
  rejected: { bg: surfaces.errorTint, text: colors.accentError },
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
};

export const AdminCommentModeration = ({
  comments,
  loading = false,
  error,
  onApproveComment,
  onRejectComment,
  onApproveReply,
  onRejectReply,
  onBulkModerate,
  onRetry,
}: CommentModerationProps) => {
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [selectedReplies, setSelectedReplies] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<CommentModerationStatus | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingComments = comments.filter(comment => comment.moderationStatus === 'pending');
  const pendingReplies = comments.flatMap(comment =>
    comment.replies.filter(reply => reply.moderationStatus === 'pending')
  );

  const filteredComments = comments.filter((comment) => {
    const matchesSearch = comment.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.userId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || comment.moderationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectComment = useCallback((commentId: string, selected: boolean) => {
    setSelectedComments(prev =>
      selected
        ? [...prev, commentId]
        : prev.filter(id => id !== commentId)
    );
  }, []);

  const handleSelectReply = useCallback((replyId: string, selected: boolean) => {
    setSelectedReplies(prev =>
      selected
        ? [...prev, replyId]
        : prev.filter(id => id !== replyId)
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedComments.length + selectedReplies.length === pendingComments.length + pendingReplies.length) {
      setSelectedComments([]);
      setSelectedReplies([]);
    } else {
      setSelectedComments(pendingComments.map(c => c.id));
      setSelectedReplies(pendingReplies.map(r => r.id));
    }
  }, [pendingComments, pendingReplies, selectedComments.length, selectedReplies.length]);

  const handleBulkApprove = useCallback(() => {
    const allSelected = [...selectedComments, ...selectedReplies];
    if (onBulkModerate && allSelected.length > 0) {
      onBulkModerate(allSelected, 'approved');
      setSelectedComments([]);
      setSelectedReplies([]);
    }
  }, [selectedComments, selectedReplies, onBulkModerate]);

  const handleBulkReject = useCallback(() => {
    const allSelected = [...selectedComments, ...selectedReplies];
    if (onBulkModerate && allSelected.length > 0) {
      onBulkModerate(allSelected, 'rejected');
      setSelectedComments([]);
      setSelectedReplies([]);
    }
  }, [selectedComments, selectedReplies, onBulkModerate]);

  const CommentActions = ({
    itemId,
    itemType,
    status,
    onApprove,
    onReject
  }: {
    itemId: string;
    itemType: 'comment' | 'reply';
    status: CommentModerationStatus;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
  }) => {
    if (status === 'approved') return null;

    return (
      <div className="flex items-center gap-2">
        {status === 'pending' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onApprove?.(itemId)}
              className="text-[var(--approve-color)] hover:bg-[var(--approve-bg)]"
              style={{ '--approve-color': colors.accentSuccess, '--approve-bg': surfaces.successTint } as CSSProperties}
            >
              Aprovar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReject?.(itemId)}
              className="text-[var(--reject-color)] hover:bg-[var(--reject-bg)]"
              style={{ '--reject-color': colors.accentError, '--reject-bg': surfaces.errorTint } as CSSProperties}
            >
              Rejeitar
            </Button>
          </>
        )}
        {status === 'rejected' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onApprove?.(itemId)}
            className="text-[var(--approve-color)] hover:bg-[var(--approve-bg)]"
            style={{ '--approve-color': colors.accentSuccess, '--approve-bg': surfaces.successTint } as CSSProperties}
          >
            Aprovar mesmo assim
          </Button>
        )}
      </div>
    );
  };

  const CommentItem = ({
    comment,
    isReply = false,
    parentId
  }: {
    comment: LessonComment | LessonCommentReply;
    isReply?: boolean;
    parentId?: string;
  }) => {
    const isSelected = isReply
      ? selectedReplies.includes(comment.id)
      : selectedComments.includes(comment.id);

    const handleSelect = (selected: boolean) => {
      if (isReply) {
        handleSelectReply(comment.id, selected);
      } else {
        handleSelectComment(comment.id, selected);
      }
    };

    return (
      <div
        className={`rounded-lg border bg-[var(--comment-bg)] p-4 space-y-3 ${
          isReply ? 'ml-8 border-l-4' : 'border-[var(--comment-border)]'
        }`}
        style={{
          '--comment-bg': surfaces.bgSecondary,
          '--comment-border': colors.borderPrimary,
          '--comment-accent': colors.accentSuccess,
        } as CSSProperties}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium" style={{ color: colors.primary }}>
                {isReply ? 'Resposta' : 'Comentário'} • Usuário ID: {comment.userId.slice(-8)}
              </span>
              <div
                className="rounded-full px-2 py-1 text-xs"
                style={{
                  background: moderationStatusColors[comment.moderationStatus].bg,
                  color: moderationStatusColors[comment.moderationStatus].text,
                }}
              >
                {moderationStatusLabels[comment.moderationStatus]}
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
              {comment.body}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: colors.textTertiary }}>
              <span>Criado em {formatRelativeTime(comment.createdAt)}</span>
              {comment.updatedAt !== comment.createdAt && (
                <span>Editado em {formatRelativeTime(comment.updatedAt)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comment.moderationStatus === 'pending' && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleSelect(e.target.checked)}
                className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                style={{
                  '--checkbox-border': colors.borderPrimary,
                  '--checkbox-bg': colors.bgSecondary,
                  '--checkbox-checked': colors.accentSuccess,
                  '--checkbox-focus': colors.borderAccent,
                } as CSSProperties}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div />
          <CommentActions
            itemId={comment.id}
            itemType={isReply ? 'reply' : 'comment'}
            status={comment.moderationStatus}
            onApprove={isReply ? onApproveReply : onApproveComment}
            onReject={isReply ? onRejectReply : onRejectComment}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4" data-testid="comments-loading">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-3xl border border-[var(--skeleton-border)] bg-[var(--skeleton-bg)]"
            style={{
              '--skeleton-border': colors.borderPrimary,
              '--skeleton-bg': surfaces.bgSecondary,
            } as CSSProperties}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col gap-3 rounded-3xl border border-[var(--error-border)] bg-[var(--error-bg)] p-6 text-sm"
        data-testid="comments-error"
        style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
      >
        <span style={{ color: colors.accentError }}>{error}</span>
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  const stats = {
    total: comments.length,
    pending: comments.filter(c => c.moderationStatus === 'pending').length +
            comments.flatMap(c => c.replies.filter(r => r.moderationStatus === 'pending')).length,
    approved: comments.filter(c => c.moderationStatus === 'approved').length +
              comments.flatMap(c => c.replies.filter(r => r.moderationStatus === 'approved')).length,
    rejected: comments.filter(c => c.moderationStatus === 'rejected').length +
              comments.flatMap(c => c.replies.filter(r => r.moderationStatus === 'rejected')).length,
  };

  return (
    <div className="space-y-6" data-testid="admin-comment-moderation">
      <header className="space-y-1">
        <h1
          className="text-2xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Moderação de Comentários
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Revise e gerencie todos os comentários e respostas da Academy.
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.primary, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {stats.total}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Total
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentWarning, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {stats.pending}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Pendentes
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentSuccess, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {stats.approved}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Aprovados
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentError, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {stats.rejected}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Rejeitados
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <Card variant="outlined">
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Buscar comentários"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Conteúdo do comentário ou ID do usuário..."
            />
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                Status
              </label>
              <select
                className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                style={{
                  '--select-border': colors.borderPrimary,
                  '--select-bg': colors.bgSecondary,
                  '--select-focus': colors.borderAccent,
                } as CSSProperties}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CommentModerationStatus | 'all')}
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {stats.pending > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-[var(--bulk-border)] bg-[var(--bulk-bg)] p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedComments.length + selectedReplies.length === pendingComments.length + pendingReplies.length && pendingComments.length + pendingReplies.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border border-[var(--checkbox-border)] bg-[var(--checkbox-bg)] text-[var(--checkbox-checked)] focus:ring-[var(--checkbox-focus)]"
                  style={{
                    '--checkbox-border': colors.borderPrimary,
                    '--checkbox-bg': colors.bgSecondary,
                    '--checkbox-checked': colors.accentSuccess,
                    '--checkbox-focus': colors.borderAccent,
                  } as CSSProperties}
                />
                <span className="text-sm" style={{ color: colors.textPrimary }}>
                  {selectedComments.length + selectedReplies.length} de {pendingComments.length + pendingReplies.length} pendentes selecionados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={selectedComments.length + selectedReplies.length === 0}
                  className="text-[var(--approve-color)] hover:bg-[var(--approve-bg)]"
                  style={{ '--approve-color': colors.accentSuccess, '--approve-bg': surfaces.successTint } as CSSProperties}
                >
                  Aprovar Selecionados
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={selectedComments.length + selectedReplies.length === 0}
                  className="text-[var(--reject-color)] hover:bg-[var(--reject-bg)]"
                  style={{ '--reject-color': colors.accentError, '--reject-bg': surfaces.errorTint } as CSSProperties}
                >
                  Rejeitar Selecionados
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <Card variant="outlined" data-testid="comments-empty">
          <CardContent className="text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              {searchTerm || statusFilter !== 'all' ? 'Nenhum comentário encontrado' : 'Nenhum comentário ainda'}
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros ou termos de busca.'
                : 'Os comentários dos usuários aparecerão aqui para moderação.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div key={comment.id} data-testid={`comment-${comment.id}`}>
              <CommentItem comment={comment} />
              {comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isReply={true}
                      parentId={comment.id}
                      data-testid={`reply-${reply.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

AdminCommentModeration.displayName = 'AdminCommentModeration';