import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  CommentThread,
  type CommentThreadComment,
} from 'src/frontend/components/academy/comments/CommentThread';

const createComment = (overrides: Partial<CommentThreadComment> = {}): CommentThreadComment => ({
  id: 'comment-1',
  lessonId: 'lesson-1',
  userId: 'user-1',
  body: 'Primeiro comentário neon',
  createdAt: '2025-11-03T10:00:00Z',
  updatedAt: '2025-11-03T10:00:00Z',
  pendingModeration: false,
  replies: [],
  ...overrides,
});

describe('CommentThread', () => {
  it('exibe badge de moderação pendente e aciona ações de aprovado/rejeitado', async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();

    render(
      <CommentThread
        comments={[createComment({ id: 'comment-approve', pendingModeration: true })]}
        allowModeration
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    expect(screen.getByTestId('lesson-comment-pending')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('lesson-comment-approve-comment-approve'));
    expect(onApprove).toHaveBeenCalledWith({ commentId: 'comment-approve', replyId: undefined });

    await user.click(screen.getByTestId('lesson-comment-reject-comment-approve'));
    expect(onReject).toHaveBeenCalledWith({ commentId: 'comment-approve', replyId: undefined });
  });

  it('permite abrir formulário de reply e enviar resposta', async () => {
    const onReply = vi.fn().mockResolvedValue(undefined);

    render(<CommentThread comments={[createComment()]} onReply={onReply} />);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('lesson-comment-reply-btn-comment-1'));

    const textarea = screen.getByRole('textbox', { name: /responder/i });
    await user.type(textarea, 'Curti demais essa aula!');
    await user.click(screen.getByRole('button', { name: /enviar reply/i }));

    await waitFor(() => expect(onReply).toHaveBeenCalled());
    expect(onReply).toHaveBeenCalledWith({
      rootCommentId: 'comment-1',
      parentId: 'comment-1',
      body: 'Curti demais essa aula!',
    });
    await waitFor(() => expect(screen.queryByTestId('lesson-comment-reply-form-comment-1')).not.toBeInTheDocument());
  });

  it('exibe estado vazio quando não há comentários', () => {
    render(<CommentThread comments={[]} emptyState="Sem comentários ainda." />);

    expect(screen.getByTestId('lesson-comment-thread-empty')).toHaveTextContent('Sem comentários ainda.');
  });
});
