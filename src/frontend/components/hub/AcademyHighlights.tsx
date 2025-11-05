import type { CSSProperties } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import type { CourseMeta, CourseProgress, CourseRecommendation } from '../../../shared/types/academy.types';
import { CourseStatus } from '../../../shared/types/common.types';
import { Badge, Button, Card, CardContent, CardSubtitle, CardTitle, ProgressBar } from '../common';

export interface AcademyHighlightItem {
  course: CourseMeta;
  progress?: CourseProgress;
  recommendation?: CourseRecommendation;
  locked?: boolean;
  nextLessonTitle?: string;
}

type AcademyHighlightsProps = {
  items: AcademyHighlightItem[];
  loading?: boolean;
  onSelectCourse?: (courseId: string) => void;
};

const statusDisplay: Record<CourseStatus, { label: string; icon: string; badgeVariant: 'default' | 'warning' | 'outline' | 'error' }> = {
  [CourseStatus.Draft]: { label: 'Rascunho', icon: '🛠️', badgeVariant: 'default' },
  [CourseStatus.Scheduled]: { label: 'Agendado', icon: '⏳', badgeVariant: 'warning' },
  [CourseStatus.Published]: { label: 'Disponível', icon: '✅', badgeVariant: 'outline' },
  [CourseStatus.Archived]: { label: 'Arquivado', icon: '📦', badgeVariant: 'default' },
};

const recommendationLabel = (badge?: CourseRecommendation['badge']): string | null => {
  switch (badge) {
    case 'new':
      return 'Novidade';
    case 'popular':
      return 'Popular entre os membros';
    case 'mentor_pick':
      return 'Seleção dos mentores';
    default:
      return null;
  }
};

export const AcademyHighlights = ({ items, loading, onSelectCourse }: AcademyHighlightsProps) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <Card variant="outlined" className="text-center">
        <CardTitle className="text-base" style={{ color: colors.primary }}>
          Nenhum curso disponível ainda
        </CardTitle>
        <CardSubtitle style={{ color: colors.textSecondary }}>
          Assim que novos cursos forem liberados, eles aparecerão aqui.
        </CardSubtitle>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ course, progress, recommendation, locked, nextLessonTitle }) => {
        const percentage = progress?.percentage ?? 0;
        const status = statusDisplay[course.status];
        const isLocked = locked || course.status !== CourseStatus.Published;
        const badgeVariant = isLocked ? 'error' : status.badgeVariant;
        const badgeLabel = isLocked ? '🔒 Bloqueado' : `${status.icon} ${status.label}`;
        const actionLabel = isLocked ? 'Ver detalhes' : percentage > 0 ? 'Continuar' : 'Começar';

        return (
          <Card key={course.id} className="flex h-full flex-col overflow-hidden" variant="solid" glowing>
            <div className="relative h-40 overflow-hidden rounded-2xl">
              {course.coverImage ? (
                <img src={course.coverImage} alt="Capa do curso" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[var(--course-placeholder)]"
                  style={{ '--course-placeholder': colors.bgTertiary } as CSSProperties}
                >
                  <span className="text-4xl" aria-hidden>
                    📚
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,10,0.95)] via-[rgba(10,10,10,0.6)] to-transparent" aria-hidden />
              <div className="absolute left-4 top-4 flex gap-3">
                <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                {recommendationLabel(recommendation?.badge) ? (
                  <Badge variant="outline">{recommendationLabel(recommendation?.badge) as string}</Badge>
                ) : null}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 pt-4">
              <CardTitle className="text-xl" style={{ color: colors.primary }}>
                {course.title}
              </CardTitle>
              <CardContent style={{ color: colors.textSecondary }}>{course.subtitle}</CardContent>
              <div className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                <p>{`${course.totalLessons} aulas · ${Math.round(course.estimatedDurationMinutes / 60)}h`}</p>
                {nextLessonTitle ? <p>Próxima aula: {nextLessonTitle}</p> : null}
              </div>
              <ProgressBar value={percentage} showLabel label="Progresso" />
              <div className="mt-auto flex items-center justify-between">
                <Button variant={isLocked ? 'secondary' : 'primary'} onClick={() => onSelectCourse?.(course.id)}>
                  {actionLabel}
                </Button>
                {recommendation?.reason ? (
                  <span className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary, fontFamily: typography.fontHeading }}>
                    {recommendation.reason}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

type SkeletonCardProps = {
  titleWidth?: string;
};

const SkeletonCard = ({ titleWidth = '70%' }: SkeletonCardProps) => (
  <div
    className="animate-pulse space-y-4 rounded-3xl border border-[var(--skeleton-border)] bg-[var(--skeleton-bg)] p-6"
    style={{ '--skeleton-border': colors.borderPrimary, '--skeleton-bg': colors.bgPrimary } as CSSProperties}
  >
    <div className="h-40 rounded-2xl bg-[var(--skeleton-border)]" />
    <div className="h-6 rounded-full bg-[var(--skeleton-border)]" style={{ width: titleWidth }} />
    <div className="h-4 rounded-full bg-[var(--skeleton-border)]" style={{ width: '90%' }} />
    <div className="h-4 rounded-full bg-[var(--skeleton-border)]" style={{ width: '60%' }} />
    <div className="h-3 rounded-full bg-[var(--skeleton-border)]" style={{ width: '80%' }} />
  </div>
);
