import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { colors, surfaces, typography } from '../../../../shared/design/tokens';
import type { Course, CourseMeta, Module } from '../../../../shared/types/academy.types';
import { ApiClient } from '../../../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../../../shared/utils/errorHandler';
import { Button, Card, CardContent, CardTitle } from '../../../components/common';
import { DripContentConfig } from '../../../components/admin/DripContentConfig';
import { queryKeys } from '../../../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../../../store/auth';

const adminApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

type DripContentManagementProps = {
  courseId?: string;
  onBack?: () => void;
};

export const AdminAcademyDripContent = ({ courseId, onBack }: DripContentManagementProps) => {
  const queryClient = useQueryClient();

  const [selectedCourse, setSelectedCourse] = useState<CourseMeta | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Query for course details if courseId is provided
  const courseQuery = useQuery({
    queryKey: ['admin', 'academy', 'courses', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      try {
        const response = await adminApiClient.get<Course>(`/admin/academy/courses/${courseId}`);
        assertSuccess<Course>(response);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch course:', error);
        return null;
      }
    },
    enabled: !!courseId,
  });

  // Query for all courses (for selection if no courseId provided)
  const coursesQuery = useQuery({
    queryKey: ['admin', 'academy', 'courses'],
    queryFn: async () => {
      try {
        const response = await adminApiClient.get<CourseMeta[]>('/admin/academy/courses');
        assertSuccess<CourseMeta[]>(response);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        return [];
      }
    },
    enabled: !courseId,
  });

  // Query for modules of the selected course
  const modulesQuery = useQuery({
    queryKey: ['admin', 'academy', 'courses', selectedCourse?.id || courseId, 'modules'],
    queryFn: async () => {
      const targetCourseId = selectedCourse?.id || courseId;
      if (!targetCourseId) return [];
      try {
        const response = await adminApiClient.get<Module[]>(`/admin/academy/courses/${targetCourseId}/modules`);
        assertSuccess<Module[]>(response);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch modules:', error);
        return [];
      }
    },
    enabled: !!selectedCourse?.id || !!courseId,
  });

  // Mutation to update drip configuration
  const updateDripConfigMutation = useMutation({
    mutationFn: async ({ courseId, moduleId, config }: { courseId: string; moduleId?: string; config: any }) => {
      const endpoint = moduleId
        ? `/admin/academy/courses/${courseId}/modules/${moduleId}/drip-config`
        : `/admin/academy/courses/${courseId}/drip-config`;

      const response = await adminApiClient.put(endpoint, config);
      assertSuccess(response);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'academy'] });
    },
  });

  const handleCourseSelect = useCallback((course: CourseMeta) => {
    setSelectedCourse(course);
  }, []);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (courseId) {
      setSelectedCourse(null);
      setSelectedModule(null);
    } else {
      setSelectedCourse(null);
      setSelectedModule(null);
    }
  }, [onBack, courseId]);

  const handleDripConfigSave = useCallback(async (config: any, scope: 'course' | 'module', moduleId?: string) => {
    const targetCourseId = selectedCourse?.id || courseId;
    if (!targetCourseId) return;

    try {
      await updateDripConfigMutation.mutateAsync({
        courseId: targetCourseId,
        moduleId: scope === 'module' ? moduleId : undefined,
        config,
      });
    } catch (error) {
      console.error('Failed to save drip config:', error);
      throw error;
    }
  }, [selectedCourse, courseId, updateDripConfigMutation]);

  const handleRetry = useCallback(() => {
    void courseQuery.refetch();
    void coursesQuery.refetch();
    void modulesQuery.refetch();
  }, [courseQuery, coursesQuery, modulesQuery]);

  // Set initial course if courseId is provided
  useEffect(() => {
    if (courseId && courseQuery.data) {
      setSelectedCourse({
        id: courseQuery.data.id,
        title: courseQuery.data.title,
        description: courseQuery.data.description,
        level: courseQuery.data.level,
        status: courseQuery.data.status,
        tags: courseQuery.data.tags,
        coverImage: courseQuery.data.coverImage,
        totalLessons: courseQuery.data.totalLessons,
        estimatedDurationMinutes: courseQuery.data.estimatedDurationMinutes,
        createdAt: courseQuery.data.createdAt,
        updatedAt: courseQuery.data.updatedAt,
      });
    }
  }, [courseId, courseQuery.data]);

  // Loading state
  if (courseQuery.isLoading || (coursesQuery.isLoading && !courseId)) {
    return (
      <div className="space-y-4" data-testid="drip-content-loading">
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

  // Error state
  const error = courseQuery.error || coursesQuery.error || modulesQuery.error;
  if (error) {
    return (
      <div
        className="flex flex-col gap-3 rounded-3xl border border-[var(--error-border)] bg-[var(--error-bg)] p-6 text-sm"
        data-testid="drip-content-error"
        style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
      >
        <span style={{ color: colors.accentError }}>
          {mapApiError(error)}
        </span>
        {handleRetry ? (
          <Button variant="ghost" size="sm" onClick={handleRetry}>
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  // Course selection state (when no courseId provided)
  if (!selectedCourse && !courseId) {
    const courses = coursesQuery.data || [];

    return (
      <div className="space-y-6" data-testid="drip-content-course-selection">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Voltar
          </Button>
          <div>
            <h1
              className="text-2xl uppercase tracking-[0.18em]"
              style={{ fontFamily: typography.fontHeading, color: colors.primary }}
            >
              Configurar Drip Content
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Selecione um curso para configurar a liberação gradual de conteúdo.
            </p>
          </div>
        </header>

        {courses.length === 0 ? (
          <Card variant="outlined">
            <CardContent className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
                Nenhum curso encontrado
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Crie um curso primeiro para poder configurar o drip content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                variant="outlined"
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => handleCourseSelect(course)}
                data-testid={`course-card-${course.id}`}
              >
                <CardContent className="space-y-3">
                  {course.coverImage && (
                    <div className="aspect-video w-full overflow-hidden rounded-lg">
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium line-clamp-2" style={{ color: colors.primary }}>
                      {course.title}
                    </h3>
                    <p className="text-sm line-clamp-2" style={{ color: colors.textSecondary }}>
                      {course.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: colors.textTertiary }}>
                      {course.totalLessons} aulas
                    </span>
                    <span
                      className="rounded px-2 py-1"
                      style={{
                        background: surfaces.bgTertiary,
                        color: colors.textTertiary,
                      }}
                    >
                      {course.level}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Drip content configuration state
  const targetCourse = selectedCourse || (courseQuery.data ? {
    id: courseQuery.data.id,
    title: courseQuery.data.title,
    description: courseQuery.data.description,
    level: courseQuery.data.level,
    status: courseQuery.data.status,
    tags: courseQuery.data.tags,
    coverImage: courseQuery.data.coverImage,
    totalLessons: courseQuery.data.totalLessons,
    estimatedDurationMinutes: courseQuery.data.estimatedDurationMinutes,
    createdAt: courseQuery.data.createdAt,
    updatedAt: courseQuery.data.updatedAt,
  } : null);

  if (!targetCourse) {
    return (
      <div
        className="flex flex-col gap-3 rounded-3xl border border-[var(--error-border)] bg-[var(--error-bg)] p-6 text-sm"
        style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
      >
        <span style={{ color: colors.accentError }}>Curso não encontrado</span>
        <Button variant="ghost" size="sm" onClick={handleBack}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="drip-content-configuration">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Voltar
          </Button>
          <div>
            <h1
              className="text-2xl uppercase tracking-[0.18em]"
              style={{ fontFamily: typography.fontHeading, color: colors.primary }}
            >
              Drip Content: {targetCourse.title}
            </h1>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Configure a liberação gradual de conteúdo para este curso.
            </p>
          </div>
        </div>
      </header>

      <DripContentConfig
        course={targetCourse ? {
          id: targetCourse.id,
          title: targetCourse.title,
          description: targetCourse.description,
          level: targetCourse.level,
          status: targetCourse.status,
          tags: targetCourse.tags,
          coverImage: targetCourse.coverImage,
          totalLessons: targetCourse.totalLessons,
          estimatedDurationMinutes: targetCourse.estimatedDurationMinutes,
          createdAt: targetCourse.createdAt,
          updatedAt: targetCourse.updatedAt,
          modules: modulesQuery.data || []
        } : undefined}
        loading={modulesQuery.isLoading}
        error={modulesQuery.error ? mapApiError(modulesQuery.error) : null}
        onConfigUpdate={handleDripConfigSave}
        onRetry={handleRetry}
      />
    </div>
  );
};

AdminAcademyDripContent.displayName = 'AdminAcademyDripContent';