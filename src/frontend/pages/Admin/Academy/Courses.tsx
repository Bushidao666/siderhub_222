import type { CSSProperties } from 'react';
import { useState } from 'react';
import { colors, surfaces, typography } from '../../../../shared/design/tokens';
import type { CourseMeta } from '../../../../shared/types/academy.types';
import { Button, Card, CardContent, CardTitle, Input } from '../../../components/common';

type CoursesManagementProps = {
  courses: CourseMeta[];
  loading?: boolean;
  error?: string | null;
  onCourseSelect?: (course: CourseMeta) => void;
  onCourseCreate?: () => void;
  onCourseEdit?: (course: CourseMeta) => void;
  onCourseDelete?: (courseId: string) => void;
  onDripConfig?: (course: CourseMeta) => void;
  onRetry?: () => void;
};

const statusColors: Record<CourseMeta['status'], { bg: string; text: string }> = {
  draft: { bg: surfaces.warningTint, text: colors.accentWarning },
  published: { bg: surfaces.successTint, text: colors.accentSuccess },
  archived: { bg: surfaces.bgTertiary, text: colors.textTertiary },
};

const statusLabels: Record<CourseMeta['status'], string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};

const levelLabels: Record<CourseMeta['level'], string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

const levelColors: Record<CourseMeta['level'], string> = {
  beginner: colors.accentSuccess,
  intermediate: colors.accentWarning,
  advanced: colors.accentError,
};

export const AdminAcademyCourses = ({
  courses,
  loading = false,
  error,
  onCourseSelect,
  onCourseCreate,
  onCourseEdit,
  onCourseDelete,
  onDripConfig,
  onRetry,
}: CoursesManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseMeta['status'] | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<CourseMeta['level'] | 'all'>('all');

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;

    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleDeleteCourse = (course: CourseMeta) => {
    if (window.confirm(`Tem certeza que deseja excluir o curso "${course.title}"? Esta ação não pode ser desfeita.`)) {
      onCourseDelete?.(course.id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" data-testid="academy-courses-loading">
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
        data-testid="academy-courses-error"
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

  return (
    <div className="space-y-6" data-testid="academy-courses-management">
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl uppercase tracking-[0.18em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Gestão de Cursos
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Crie, edite e gerencie todos os cursos da Academy.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onCourseCreate}
          data-testid="academy-create-course"
        >
          + Novo Curso
        </Button>
      </header>

      {/* Filters */}
      <Card variant="outlined">
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Buscar cursos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Título, descrição ou tags..."
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
                onChange={(e) => setStatusFilter(e.target.value as CourseMeta['status'] | 'all')}
              >
                <option value="all">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                Nível
              </label>
              <select
                className="rounded-lg border border-[var(--select-border)] bg-[var(--select-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--select-focus)]"
                style={{
                  '--select-border': colors.borderPrimary,
                  '--select-bg': colors.bgSecondary,
                  '--select-focus': colors.borderAccent,
                } as CSSProperties}
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as CourseMeta['level'] | 'all')}
              >
                <option value="all">Todos os níveis</option>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.primary, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {courses.length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Total de Cursos
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentSuccess, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {courses.filter(c => c.status === 'published').length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Publicados
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.accentWarning, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {courses.filter(c => c.status === 'draft').length}
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Rascunhos
          </div>
        </div>
        <div className="rounded-lg border border-[var(--stat-border)] bg-[var(--stat-bg)] p-4 text-center">
          <div className="text-2xl font-bold text-[var(--stat-value)]" style={{ '--stat-value': colors.textSecondary, '--stat-border': colors.borderPrimary, '--stat-bg': surfaces.bgSecondary } as CSSProperties}>
            {Math.round(courses.reduce((acc, c) => acc + c.estimatedDurationMinutes, 0) / 60)}h
          </div>
          <div className="text-xs text-[var(--stat-label)]" style={{ '--stat-label': colors.textSecondary } as CSSProperties}>
            Tempo Total
          </div>
        </div>
      </div>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <Card variant="outlined" data-testid="academy-courses-empty">
          <CardContent className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
              {searchTerm || statusFilter !== 'all' || levelFilter !== 'all' ? 'Nenhum curso encontrado' : 'Nenhum curso criado ainda'}
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {searchTerm || statusFilter !== 'all' || levelFilter !== 'all'
                ? 'Tente ajustar os filtros ou termos de busca.'
                : 'Comece criando seu primeiro curso na Academy.'}
            </p>
            {!searchTerm && statusFilter === 'all' && levelFilter === 'all' && onCourseCreate && (
              <Button variant="primary" onClick={onCourseCreate}>
                Criar Primeiro Curso
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              variant={course.status === 'published' ? 'outlined' : 'solid'}
              className="group transition-transform duration-200 hover:-translate-y-0.5"
              data-testid={`academy-course-${course.id}`}
            >
              {/* Course Cover */}
              {course.coverImage && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium line-clamp-2" style={{ color: colors.primary }}>
                    {course.title}
                  </h3>
                  <div
                    className="flex-shrink-0 rounded-full px-2 py-1 text-xs"
                    style={{
                      background: statusColors[course.status].bg,
                      color: statusColors[course.status].text,
                    }}
                  >
                    {statusLabels[course.status]}
                  </div>
                </div>

                <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                  {course.description}
                </p>

                <div className="flex items-center gap-3 text-xs">
                  <span
                    className="rounded px-2 py-1"
                    style={{
                      background: levelColors[course.level] + '20',
                      color: levelColors[course.level],
                    }}
                  >
                    {levelLabels[course.level]}
                  </span>
                  <span style={{ color: colors.textTertiary }}>
                    {course.totalLessons} aulas
                  </span>
                  <span style={{ color: colors.textTertiary }}>
                    {Math.round(course.estimatedDurationMinutes / 60)}h
                  </span>
                </div>

                {course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-[var(--tag-bg)] px-2 py-1 text-xs"
                        style={{ '--tag-bg': surfaces.bgTertiary, color: colors.textTertiary }}
                      >
                        {tag}
                      </span>
                    ))}
                    {course.tags.length > 3 && (
                      <span
                        className="rounded-full bg-[var(--tag-bg)] px-2 py-1 text-xs"
                        style={{ '--tag-bg': surfaces.bgTertiary, color: colors.textTertiary }}
                      >
                        +{course.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCourseSelect?.(course)}
                    className="flex-1"
                  >
                    Ver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCourseEdit?.(course)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDripConfig?.(course)}
                    className="text-[var(--drip-color)] hover:bg-[var(--drip-bg)]"
                    style={{ '--drip-color': colors.accentWarning, '--drip-bg': surfaces.warningTint } as CSSProperties}
                  >
                    Drip
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCourse(course)}
                    className="text-[var(--delete-color)] hover:bg-[var(--delete-bg)]"
                    style={{ '--delete-color': colors.accentError, '--delete-bg': surfaces.errorTint } as CSSProperties}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

AdminAcademyCourses.displayName = 'AdminAcademyCourses';