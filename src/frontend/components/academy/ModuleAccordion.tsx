import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import type { CourseModule } from '../../../shared/types/academy.types';
import { LessonType } from '../../../shared/types/common.types';
import { Badge, Button, Card } from '../common';

type ModuleAccordionProps = {
  modules: CourseModule[];
  activeModuleId?: string;
  completedLessonIds?: string[];
  onSelectLesson?: (moduleId: string, lessonId: string) => void;
  loading?: boolean;
};

const lessonTypeDisplay: Record<LessonType, { icon: string; label: string }> = {
  [LessonType.Video]: { icon: '🎥', label: 'Vídeo' },
  [LessonType.Article]: { icon: '📝', label: 'Artigo' },
  [LessonType.Live]: { icon: '🔴', label: 'Live' },
  [LessonType.Download]: { icon: '📁', label: 'Download' },
  [LessonType.Quiz]: { icon: '🧠', label: 'Quiz' },
};

export const ModuleAccordion = ({ modules, activeModuleId, completedLessonIds, onSelectLesson, loading }: ModuleAccordionProps) => {
  const initialOpen = useMemo(() => activeModuleId ?? modules[0]?.id, [activeModuleId, modules]);
  const [openModuleId, setOpenModuleId] = useState<string | undefined>(initialOpen);

  useEffect(() => {
    setOpenModuleId(initialOpen);
  }, [initialOpen]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonModule key={index} />
        ))}
      </div>
    );
  }

  if (!modules.length) {
    return (
      <Card variant="outlined" className="text-center">
        <div className="space-y-2 py-6">
          <span className="text-xs uppercase tracking-[0.16em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
            Em breve
          </span>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Os módulos deste curso ainda estão sendo preparados.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const isOpen = openModuleId === module.id;
        const completedCount = completedLessonIds?.filter((id) => module.lessons.some((lesson) => lesson.id === id)).length ?? 0;
        const progressPercentage = module.lessons.length
          ? Math.round((completedCount / module.lessons.length) * 100)
          : 0;

        const triggerId = `${module.id}-trigger`;
        const panelId = `${module.id}-panel`;

        return (
          <Card key={module.id} variant="outlined" className="overflow-hidden" data-open={isOpen ? 'true' : undefined}>
            <button
              type="button"
              id={triggerId}
              className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left"
              onClick={() => setOpenModuleId(isOpen ? undefined : module.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm uppercase tracking-[0.16em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
                  Módulo {module.order}
                </span>
                <h3 className="text-lg uppercase tracking-[0.1em]" style={{ fontFamily: typography.fontHeading, color: colors.primary }}>
                  {module.title}
                </h3>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {module.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{progressPercentage}%</Badge>
                <span
                  className="text-2xl transition-transform duration-200"
                  style={{ color: colors.primary }}
                  aria-hidden
                >
                  {isOpen ? '−' : '+'}
                </span>
              </div>
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="space-y-3 border-t border-[var(--module-border)] bg-[var(--module-bg)] px-6 py-5"
                style={{ '--module-border': colors.borderPrimary, '--module-bg': colors.bgPrimary } as CSSProperties}
              >
                {module.lessons.map((lesson) => {
                  const type = lessonTypeDisplay[lesson.type];
                  const isCompleted = completedLessonIds?.includes(lesson.id) ?? false;
                  return (
                    <LessonRow
                      key={lesson.id}
                      moduleId={module.id}
                      lessonId={lesson.id}
                      icon={type.icon}
                      label={`${type.label} · ${lesson.durationMinutes}min`}
                      title={lesson.title}
                      completed={isCompleted}
                      locked={lesson.isPreview === false && !isCompleted && lesson.releaseAt ? new Date(lesson.releaseAt) > new Date() : false}
                      onSelectLesson={onSelectLesson}
                    />
                  );
                })}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
};

type LessonRowProps = {
  moduleId: string;
  lessonId: string;
  icon: string;
  label: string;
  title: string;
  completed: boolean;
  locked: boolean;
  onSelectLesson?: (moduleId: string, lessonId: string) => void;
};

const LessonRow = ({ moduleId, lessonId, icon, label, title, completed, locked, onSelectLesson }: LessonRowProps) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--lesson-border)] bg-[var(--lesson-bg)] px-4 py-3" style={{ '--lesson-border': colors.borderPrimary, '--lesson-bg': colors.bgSecondary } as CSSProperties}>
    <div className="flex flex-1 items-start gap-4">
      <span className="text-2xl" aria-hidden>
        {locked ? '🔒' : completed ? '✅' : icon}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <strong className="text-sm uppercase tracking-[0.12em]" style={{ fontFamily: typography.fontHeading, color: colors.primary }}>
          {title}
        </strong>
        <span className="text-xs" style={{ color: colors.textSecondary }}>
          {label}
        </span>
      </div>
    </div>
    <Button variant={locked ? 'ghost' : 'secondary'} disabled={locked} onClick={() => onSelectLesson?.(moduleId, lessonId)}>
      {locked ? 'Bloqueado' : completed ? 'Rever' : 'Assistir'}
    </Button>
  </div>
);

const SkeletonModule = () => (
  <div className="animate-pulse space-y-3 rounded-3xl border border-[var(--skeleton-border)] bg-[var(--skeleton-bg)] p-5" style={{ '--skeleton-border': colors.borderPrimary, '--skeleton-bg': colors.bgPrimary } as CSSProperties}>
    <div className="h-5 w-2/3 rounded-full bg-[var(--skeleton-border)]" />
    <div className="h-4 w-full rounded-full bg-[var(--skeleton-border)]" />
    <div className="h-4 w-3/4 rounded-full bg-[var(--skeleton-border)]" />
  </div>
);
