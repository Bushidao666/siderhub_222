import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LessonPlayer } from 'src/frontend/components/academy/LessonPlayer';
import { LessonType } from '@shared/types';
import type { Lesson, LessonComment } from '@shared/types';

vi.mock('video.js/dist/video-js.css', () => ({}), { virtual: true });
vi.mock('@silvermine/videojs-quality-selector/dist/css/quality-selector.css', () => ({}), { virtual: true });
vi.mock('videojs-contrib-quality-levels', () => ({}), { virtual: true });
vi.mock('videojs-hotkeys', () => ({}), { virtual: true });
vi.mock('@silvermine/videojs-quality-selector/dist/js/silvermine-videojs-quality-selector', () => ({}), {
  virtual: true,
});

let currentTime = 0;
let handlers: Record<string, Array<() => void>> = {};
let lastPlayer: any;

vi.mock('video.js', () => ({
  default: (element: HTMLVideoElement, _options: unknown, ready?: () => void) => {
    const player = {
      duration: vi.fn(() => 0),
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
        handlers[event] = handlers[event] ?? [];
        handlers[event].push(handler);
      }),
      off: vi.fn((event: string) => {
        handlers[event] = [];
      }),
      dispose: vi.fn(),
    };
    lastPlayer = player;
    if (ready) {
      Promise.resolve().then(() => {
        ready.call(player);
      });
    }
    return player;
  },
}));

const createLesson = (): Lesson => ({
  id: 'lesson-1',
  moduleId: 'module-1',
  order: 1,
  title: 'Video Avançado',
  summary: 'Domine o Hidra com vídeos neon.',
  type: LessonType.Video,
  durationMinutes: 10,
  isPreview: false,
  releaseAt: null,
  content: {
    type: LessonType.Video,
    video: {
      videoUrl: 'https://cdn.example.com/video.mp4',
      durationSeconds: 600,
      captionsUrl: null,
      transcript: 'Conteúdo transcrito.',
    },
  },
});

describe('LessonPlayer', () => {
  beforeEach(() => {
    currentTime = 0;
    handlers = {};
    lastPlayer = null;
  });

  it('renders video player with rating and emits progress events', async () => {
    const onProgressTick = vi.fn();
    const onThreshold = vi.fn();
    const onSubmitRating = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <LessonPlayer
        lesson={createLesson()}
        moduleTitle="Módulo 1"
        comments={[]}
        ratingAverage={4.5}
        ratingCount={25}
        userRating={4}
        onSubmitRating={onSubmitRating}
        onProgressTick={onProgressTick}
        onReachCompletionThreshold={onThreshold}
      />,
    );

    await waitFor(() => expect(lastPlayer?.controlBar.addChild).toHaveBeenCalledWith('QualitySelector'));
    expect(screen.getByTestId('rating-average')).toHaveTextContent(/4.5/);

    await user.click(screen.getByTestId('rating-star-5'));
    expect(onSubmitRating).toHaveBeenCalledWith(5);

    currentTime = 12;
    await waitFor(() => expect(handlers.timeupdate).toBeDefined());
    handlers.timeupdate?.forEach((fn) => fn());
    expect(onProgressTick).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonId: 'lesson-1',
        positionSeconds: 12,
      }),
    );

    currentTime = 550;
    handlers.timeupdate?.forEach((fn) => fn());
    expect(onThreshold).toHaveBeenCalled();
    const lastCall = onThreshold.mock.calls.at(-1)?.[0];
    expect(lastCall).toMatchObject({ lessonId: 'lesson-1' });
    expect(lastCall.percentage).toBeGreaterThanOrEqual(90);
  });

  it('renderiza seção de comentários com formulário e badge pendente', async () => {
    const user = userEvent.setup();
    const onSubmitComment = vi.fn().mockResolvedValue(undefined);
    const comments: LessonComment[] = [
      {
        id: 'comment-1',
        lessonId: 'lesson-1',
        userId: 'mentor-1',
        body: 'Primeira dúvida neon.',
        createdAt: '2025-11-03T12:00:00Z',
        updatedAt: '2025-11-03T12:00:00Z',
        pendingModeration: true,
        replies: [],
      },
    ];

    render(
      <LessonPlayer
        lesson={createLesson()}
        moduleTitle="Módulo 1"
        comments={comments}
        onSubmitComment={onSubmitComment}
        commentsLoading={false}
        ratingAverage={4.5}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /comentários/i }));
    expect(screen.getByTestId('lesson-comment-pending')).toBeInTheDocument();

    const textarea = screen.getByRole('textbox', { name: /adicionar comentário/i });
    await user.type(textarea, 'Comentário enviado para teste');
    await user.click(screen.getByRole('button', { name: /publicar/i }));

    await waitFor(() => expect(onSubmitComment).toHaveBeenCalledWith('Comentário enviado para teste'));
  });
});
