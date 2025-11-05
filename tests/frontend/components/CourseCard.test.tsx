import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CourseMeta, CourseProgress } from '@shared/types';
import { CourseStatus, Visibility } from '@shared/types';
import { CourseCard } from 'src/frontend/components/academy/CourseCard';

const createCourse = (overrides: Partial<CourseMeta> = {}): CourseMeta => ({
  id: overrides.id ?? 'course-1',
  slug: overrides.slug ?? 'growth-playbook',
  title: overrides.title ?? 'Playbook de Crescimento',
  subtitle: overrides.subtitle ?? 'Da primeira venda à escala previsível',
  description:
    overrides.description ??
    'Aprenda a desenhar campanhas de aquisição e retenção usando o Hidra e ativos do Cybervault.',
  coverImage: overrides.coverImage ?? null,
  level: overrides.level ?? 'beginner',
  status: overrides.status ?? CourseStatus.Published,
  visibility: overrides.visibility ?? Visibility.Members,
  estimatedDurationMinutes: overrides.estimatedDurationMinutes ?? 240,
  totalLessons: overrides.totalLessons ?? 18,
  tags: overrides.tags ?? ['growth', 'hidra', 'playbook'],
  releaseDate: overrides.releaseDate ?? null,
  isFeatured: overrides.isFeatured ?? false,
  recommendationScore: overrides.recommendationScore ?? 0,
  createdAt: overrides.createdAt ?? new Date('2025-10-01T10:00:00Z').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2025-10-15T10:00:00Z').toISOString(),
});

const createProgress = (overrides: Partial<CourseProgress> = {}): CourseProgress => ({
  courseId: overrides.courseId ?? 'course-1',
  userId: overrides.userId ?? 'user-1',
  completedLessonIds: overrides.completedLessonIds ?? ['lesson-1'],
  percentage: overrides.percentage ?? 55,
  lastLessonId: overrides.lastLessonId ?? 'lesson-2',
  updatedAt: overrides.updatedAt ?? new Date().toISOString(),
});

describe('CourseCard', () => {
  it('renders progress and triggers select callback', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<CourseCard course={createCourse()} progress={createProgress()} onSelect={onSelect} />);

    expect(screen.getByRole('heading', { name: /playbook de crescimento/i })).toBeInTheDocument();
    // Use a stable selector to avoid duplicate matches (visible label + sr-only)
    expect(screen.getByTestId('course-progress-percentage')).toHaveTextContent(/55%/i);

    await user.click(screen.getByRole('button', { name: /continuar/i }));
    expect(onSelect).toHaveBeenCalledWith('course-1');
  });

  it('marks card as locked when status is not published', () => {
    render(<CourseCard course={createCourse({ status: CourseStatus.Draft })} />);

    expect(screen.getByText(/bloqueado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver detalhes/i })).toBeInTheDocument();
  });
});
