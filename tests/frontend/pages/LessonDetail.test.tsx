import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { LessonComment } from '@shared/types/academy.types';
import { LessonDetail } from 'src/frontend/pages/Academy/LessonDetail';
import { renderWithProviders, resetAuthStore, setAuthenticatedUser } from '../test-utils';

const mockedUseLessonComments = vi.fn();
const mockedUseLessonRating = vi.fn();
const mockedUseLessonVideoTracking = vi.fn();

vi.mock('src/frontend/hooks/useLessonComments', () => ({
  useLessonComments: (...args: unknown[]) => mockedUseLessonComments(...args),
}));

vi.mock('src/frontend/hooks/useLessonRating', () => ({
  useLessonRating: (...args: unknown[]) => mockedUseLessonRating(...args),
}));

vi.mock('src/frontend/hooks/useLessonVideoTracking', () => ({
  useLessonVideoTracking: (...args: unknown[]) => mockedUseLessonVideoTracking(...args),
}));

vi.mock('video.js/dist/video-js.css', () => ({}), { virtual: true });
vi.mock('@silvermine/videojs-quality-selector/dist/css/quality-selector.css', () => ({}), { virtual: true });
vi.mock('videojs-contrib-quality-levels', () => ({}), { virtual: true });
vi.mock('videojs-hotkeys', () => ({}), { virtual: true });
vi.mock('@silvermine/videojs-quality-selector/dist/js/silvermine-videojs-quality-selector', () => ({}), {
  virtual: true,
});

let currentTime = 0;
const registeredHandlers: Record<string, Array<() => void>> = {};

vi.mock('video.js', () => ({
  default: (_element: HTMLVideoElement, _options: unknown, ready?: () => void) => {
    const player = {
      duration: vi.fn(() => 600),
      currentTime: vi.fn((value?: number) => {
        if (typeof value === 'number') {
          currentTime = value;
          return value;
        }
        return currentTime;
      }),
      hotkeys: vi.fn(),
      controlBar: {
        addChild: vi.fn(),
        getChild: vi.fn().mockReturnValue(undefined),
      },
      on: vi.fn((event: string, handler: () => void) => {
        registeredHandlers[event] = registeredHandlers[event] ?? [];
        registeredHandlers[event].push(handler);
      }),
      off: vi.fn((event: string) => {
        registeredHandlers[event] = [];
      }),
      dispose: vi.fn(),
    };

    if (ready) {
      Promise.resolve().then(() => {
        ready();
      });
    }

    return player;
  },
}));

const renderLessonDetail = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={["/academy/lessons/lesson-123"]}>
      <Routes>
        <Route path="/academy/lessons/:lessonId" element={<LessonDetail />} />
      </Routes>
    </MemoryRouter>,
  );

describe('LessonDetail page', () => {
  beforeEach(() => {
    resetAuthStore();
    setAuthenticatedUser();
    currentTime = 0;
    Object.keys(registeredHandlers).forEach((key) => {
      registeredHandlers[key] = [];
    });
  });

  it('renders comment threads and allows submitting a new comment', async () => {
    const user = userEvent.setup();
    const addCommentAsync = vi.fn().mockResolvedValue(undefined);
    const refetch = vi.fn();

    const commentTree: LessonComment[] = [
      {
        id: 'comment-1',
        lessonId: 'lesson-123',
        userId: 'mentor-1',
        body: 'Conteúdo muito rico! Revisem a aula antes da próxima campanha.',
        createdAt: '2025-11-03T10:00:00Z',
        updatedAt: '2025-11-03T10:00:00Z',
        pendingModeration: false,
        moderationStatus: 'approved',
        moderatedById: null,
        moderatedAt: null,
        replies: [
          {
            id: 'reply-1',
            commentId: 'comment-1',
            parentReplyId: null,
            userId: 'member-2',
            body: 'Valeu! Já estou aplicando as dicas.',
            createdAt: '2025-11-03T11:00:00Z',
            updatedAt: '2025-11-03T11:00:00Z',
            pendingModeration: false,
            moderationStatus: 'approved',
            moderatedById: null,
            moderatedAt: null,
            replies: [],
          },
        ],
      },
    ];

    mockedUseLessonComments.mockReturnValue({
      comments: commentTree,
      hasComments: true,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch,
      addComment: vi.fn(),
      addCommentAsync,
      addReply: vi.fn(),
      addReplyAsync: vi.fn(),
      isSubmitting: false,
      isReplying: false,
    });

    const setRatingAsync = vi.fn().mockResolvedValue(undefined);
    mockedUseLessonRating.mockReturnValue({
      summary: {
        lessonId: 'lesson-123',
        average: 4.5,
        totalRatings: 12,
        userRating: 4,
      },
      averageRating: 4.5,
      totalRatings: 12,
      userRating: 4,
      setRatingAsync,
      isSubmitting: false,
      error: null,
    });

    mockedUseLessonVideoTracking.mockReturnValue({
      progress: { lastPositionMs: 15000, completed: false },
      isTracking: true,
      isLoadingSnapshot: false,
      isSendingTick: false,
      lastError: null,
      sendTick: vi.fn(),
      markCompleted: vi.fn(),
      refetchSnapshot: vi.fn(),
    });

    renderLessonDetail();

    expect(await screen.findByTestId('academy-lesson-detail')).toBeInTheDocument();

    const commentsTab = await screen.findByRole('tab', { name: /comentários/i });
    await user.click(commentsTab);

    const rootComment = await screen.findByTestId('lesson-comment-item');
    expect(rootComment).toHaveTextContent(/Conteúdo muito rico!/i);

    const reply = await screen.findByTestId('lesson-comment-reply');
    expect(reply).toHaveTextContent(/Valeu! Já estou aplicando as dicas./i);
    expect(screen.getByTestId('lesson-rating-section')).toBeInTheDocument();

    const commentField = screen.getByRole('textbox', { name: /participar da discussão/i });
    await user.type(commentField, 'Comentário automatizado pelo QA');
    await user.click(screen.getByRole('button', { name: /publicar/i }));

    await waitFor(() => {
      expect(addCommentAsync).toHaveBeenCalledWith({ body: 'Comentário automatizado pelo QA' });
    });
  });

  it('exposes comment error state and retry action', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();

    mockedUseLessonComments.mockReturnValue({
      comments: [],
      hasComments: false,
      isLoading: false,
      isFetching: false,
      error: 'Não foi possível carregar os comentários desta aula.',
      refetch,
      addComment: vi.fn(),
      addCommentAsync: vi.fn(),
      addReply: vi.fn(),
      addReplyAsync: vi.fn(),
      isSubmitting: false,
      isReplying: false,
    });

    mockedUseLessonRating.mockReturnValue({
      summary: null,
      averageRating: 0,
      totalRatings: 0,
      userRating: null,
      setRatingAsync: vi.fn(),
      isSubmitting: false,
      error: null,
    });

    mockedUseLessonVideoTracking.mockReturnValue({
      progress: null,
      isTracking: false,
      isLoadingSnapshot: false,
      isSendingTick: false,
      lastError: null,
      sendTick: vi.fn(),
      markCompleted: vi.fn(),
      refetchSnapshot: vi.fn(),
    });

    renderLessonDetail();

    const commentsTab = await screen.findByRole('tab', { name: /comentários/i });
    await user.click(commentsTab);

    const errorBanner = await screen.findByTestId('lesson-comments-error');
    expect(errorBanner).toHaveTextContent(/erro inesperado/i);

    await user.click(await screen.findByRole('button', { name: /tentar novamente/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
