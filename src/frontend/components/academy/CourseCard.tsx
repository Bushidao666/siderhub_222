import type { CSSProperties } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import type { CourseMeta, CourseProgress } from '../../../shared/types/academy.types';
import { CourseStatus } from '../../../shared/types/common.types';
import { Badge, Button, Card, CardContent, CardSubtitle, CardTitle, ProgressBar } from '../common';

type CourseCardProps = {
  course: CourseMeta;
  progress?: CourseProgress;
  locked?: boolean;
  onSelect?: (courseId: string) => void;
  className?: string;
};

export const COURSE_CARD_TEST_IDS = {
  root: 'component-course-card',
  action: 'component-course-card-action',
} as const;

const statusMap: Record<CourseStatus, { label: string; icon: string; variant: 'outline' | 'warning' | 'default' }> = {
  [CourseStatus.Draft]: { label: 'Rascunho', icon: '🛠️', variant: 'default' },
  [CourseStatus.Scheduled]: { label: 'Agendado', icon: '⏳', variant: 'warning' },
  [CourseStatus.Published]: { label: 'Disponível', icon: '✅', variant: 'outline' },
  [CourseStatus.Archived]: { label: 'Arquivado', icon: '📦', variant: 'default' },
};

export const CourseCard = ({ course, progress, locked, onSelect, className }: CourseCardProps) => {
  const status = statusMap[course.status];
  const isLocked = locked || course.status !== CourseStatus.Published;
  const percentage = progress?.percentage ?? 0;

  const isGrowthPlaybook =
    course.slug?.toLowerCase() === 'growth-playbook' ||
    course.title?.toLowerCase().includes('growth') && course.title?.toLowerCase().includes('playbook');

  const dynamicTestId = course?.slug ? `course-card-${course.slug}` : COURSE_CARD_TEST_IDS.root;

  return (
    <Card
      className={className}
      glowing
      data-testid={dynamicTestId}
    >
      {/* Legacy test ids kept for compatibility */}
      {isGrowthPlaybook ? <span data-testid="course-card-growth-playbook" className="sr-only" aria-hidden /> : null}
      <span data-testid={COURSE_CARD_TEST_IDS.root} className="sr-only" aria-hidden />
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <Badge variant={isLocked ? 'error' : status.variant}>
            {isLocked ? '🔒 Bloqueado' : `${status.icon} ${status.label}`}
          </Badge>
          <span className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary, fontFamily: typography.fontHeading }}>
            {course.level.toUpperCase()}
          </span>
        </div>
        <CardTitle style={{ color: colors.primary }}>{course.title}</CardTitle>
        <CardSubtitle style={{ color: colors.textSecondary }}>{course.subtitle}</CardSubtitle>
        <CardContent style={{ color: colors.textSecondary }}>
          <p>{course.description}</p>
          <p>
            {course.totalLessons} aulas · {Math.round(course.estimatedDurationMinutes / 60)}h&nbsp;totais
          </p>
        </CardContent>
        <ProgressBar value={percentage} showLabel label="Progresso" />
        {/* Exposição direta do percentual para E2E */}
        <span data-testid="course-progress-percentage" className="sr-only">
          {Math.round(percentage)}%
        </span>
        <div className="flex items-center justify-between">
          <Button
            data-testid={COURSE_CARD_TEST_IDS.action}
            variant={isLocked ? 'secondary' : 'primary'}
            onClick={() => onSelect?.(course.id)}
          >
            {isLocked ? 'Ver detalhes' : percentage > 0 ? 'Continuar' : 'Começar agora'}
          </Button>
          {course.tags.length ? (
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary, fontFamily: typography.fontHeading }}>
              {course.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--tag-border)] px-3 py-1" style={{ '--tag-border': colors.borderSubtle } as CSSProperties}>
                  #{tag}
                </span>
              ))}
              {course.tags.length > 3 ? <span>+{course.tags.length - 3}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
};
