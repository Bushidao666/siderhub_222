import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { colors, surfaces, typography } from '../../../../shared/design/tokens';
import type { CourseMeta } from '../../../../shared/types/academy.types';
import { ApiClient } from '../../../../shared/utils/apiClient';
import { assertSuccess, mapApiError } from '../../../../shared/utils/errorHandler';
import { Button, Card, CardContent, CardTitle } from '../../../components/common';
import { AdminAcademyCourseForm } from './CourseForm';
import { AdminAcademyCourses } from './Courses';
import { AdminAcademyDripContent } from './DripContent';
import { queryKeys } from '../../../lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from '../../../store/auth';

const adminApiClient = new ApiClient({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthenticated: () => {
    void useAuthStore.getState().logout();
  },
});

type ViewType = 'courses' | 'create-course' | 'edit-course' | 'drip-content';

export const AdminAcademy = () => {
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<ViewType>('courses');
  const [selectedCourse, setSelectedCourse] = useState<CourseMeta | null>(null);

  // Query for courses
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
  });

  // Mutations for course operations
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: Partial<CourseMeta>) => {
      const response = await adminApiClient.post<CourseMeta, Partial<CourseMeta>>('/admin/academy/courses', courseData);
      assertSuccess<CourseMeta>(response);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'academy', 'courses'] });
      setCurrentView('courses');
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...courseData }: { id: string } & Partial<CourseMeta>) => {
      const response = await adminApiClient.put<CourseMeta, Partial<CourseMeta>>(`/admin/academy/courses/${id}`, courseData);
      assertSuccess<CourseMeta>(response);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'academy', 'courses'] });
      setCurrentView('courses');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await adminApiClient.delete(`/admin/academy/courses/${courseId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'academy', 'courses'] });
    },
  });

  const handleCourseCreate = useCallback(() => {
    setCurrentView('create-course');
    setSelectedCourse(null);
  }, []);

  const handleCourseEdit = useCallback((course: CourseMeta) => {
    setSelectedCourse(course);
    setCurrentView('edit-course');
  }, []);

  const handleCourseSave = useCallback(async (courseData: Partial<CourseMeta>) => {
    try {
      if (selectedCourse?.id) {
        await updateCourseMutation.mutateAsync({
          id: selectedCourse.id,
          ...courseData,
        });
      } else {
        await createCourseMutation.mutateAsync(courseData);
      }
    } catch (error) {
      console.error('Failed to save course:', error);
      throw error;
    }
  }, [selectedCourse, createCourseMutation, updateCourseMutation]);

  const handleCourseDelete = useCallback(async (courseId: string) => {
    try {
      await deleteCourseMutation.mutateAsync(courseId);
    } catch (error) {
      console.error('Failed to delete course:', error);
      throw error;
    }
  }, [deleteCourseMutation]);

  const handleDripConfig = useCallback((course: CourseMeta) => {
    setSelectedCourse(course);
    setCurrentView('drip-content');
  }, []);

  const handleBackToCourses = useCallback(() => {
    setCurrentView('courses');
    setSelectedCourse(null);
  }, []);

  const handleRetry = useCallback(() => {
    void coursesQuery.refetch();
  }, [coursesQuery]);

  const renderNavigation = () => (
    <nav className="flex items-center gap-4 border-b border-[var(--nav-border)] pb-4 mb-6" style={{ '--nav-border': colors.borderPrimary } as CSSProperties}>
      <Button
        variant={currentView === 'courses' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setCurrentView('courses')}
      >
        Cursos
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCourseCreate}
      >
        + Novo Curso
      </Button>
    </nav>
  );

  const renderCurrentView = () => {
    const loading = coursesQuery.isLoading;
    const error = coursesQuery.error ? mapApiError(coursesQuery.error) : null;
    const courses = coursesQuery.data || [];

    switch (currentView) {
      case 'courses':
        return (
          <AdminAcademyCourses
            courses={courses}
            loading={loading}
            error={error}
            onCourseCreate={handleCourseCreate}
            onCourseEdit={handleCourseEdit}
            onCourseDelete={handleCourseDelete}
            onDripConfig={handleDripConfig}
            onRetry={handleRetry}
          />
        );

      case 'create-course':
      case 'edit-course':
        return (
          <AdminAcademyCourseForm
            course={selectedCourse}
            onSave={handleCourseSave}
            onCancel={handleBackToCourses}
            loading={createCourseMutation.isPending || updateCourseMutation.isPending}
          />
        );

      case 'drip-content':
        return (
          <AdminAcademyDripContent
            courseId={selectedCourse?.id}
            onBack={handleBackToCourses}
          />
        );

      default:
        return (
          <Card variant="outlined">
            <CardContent className="text-center">
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.textPrimary }}>
                View não encontrada
              </h3>
              <Button variant="primary" onClick={handleBackToCourses}>
                Voltar para Cursos
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-academy">
      <header className="space-y-4">
        <div>
          <h1
            className="text-2xl uppercase tracking-[0.18em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Academy Admin
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Gerencie cursos, módulos e configurações de liberação gradual de conteúdo.
          </p>
        </div>
      </header>

      {currentView === 'courses' && renderNavigation()}
      {renderCurrentView()}
    </div>
  );
};

AdminAcademy.displayName = 'AdminAcademy';