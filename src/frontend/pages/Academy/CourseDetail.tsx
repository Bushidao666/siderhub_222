import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { colors, glows, typography } from '../../../shared/design/tokens';
import type { CourseMeta, CourseRecommendation } from '../../../shared/types/academy.types';
import type { HubAcademyRecommendation } from '../../../shared/types/hub.types';
import { CourseCard } from '../../components/academy/CourseCard';
import { useCoursesProgressMap } from '../../hooks/useCourseProgress';
import { useHubData } from '../../hooks/useHubData';
import { selectIsAuthenticated, useAuthStore } from '../../store/auth';

export const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId = '' } = useParams<{ courseId: string }>();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const hubQuery = useHubData();
  const hubAcademy = hubQuery.data?.academy;
  const featuredCourses = hubAcademy?.featured ?? [];
  const academyRecommendations: HubAcademyRecommendation[] = hubAcademy?.recommendations ?? [];
  const courses = featuredCourses;

  const currentCourse: CourseMeta | null = useMemo(() => {
    if (!courseId) return null;
    const fromFeatured = courses.find((course) => course.id === courseId);
    if (fromFeatured) {
      return fromFeatured;
    }
    return academyRecommendations.find((item) => item.course.id === courseId)?.course ?? null;
  }, [courses, academyRecommendations, courseId]);

  const courseProgressIds = useMemo(() => (currentCourse ? [currentCourse.id] : []), [currentCourse]);
  const { progressMap } = useCoursesProgressMap(isAuthenticated ? courseProgressIds : []);

  const relatedCourses: Array<{ course: CourseMeta; recommendation?: CourseRecommendation }> = useMemo(() => {
    return academyRecommendations
      .filter((item) => item.course.id !== currentCourse?.id)
      .slice(0, 3)
      .map((item) => ({ course: item.course, recommendation: item.recommendation }));
  }, [academyRecommendations, currentCourse?.id]);

  if (!currentCourse) {
    return (
      <section className="space-y-4" data-testid="academy-course-missing">
        <header className="space-y-2">
          <p
            className="text-xs uppercase tracking-[0.18em]"
            style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
          >
            Curso não encontrado
          </p>
          <h1 className="text-3xl uppercase" style={{ fontFamily: typography.fontHeading, color: colors.primary }}>
            Conteúdo ainda em preparação
          </h1>
        </header>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Não encontramos detalhes para este curso. Verifique se o link está correto ou volte para a vitrine da Academia.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-10" data-testid="academy-course-detail">
      <header className="space-y-2">
        <p
          className="text-xs uppercase tracking-[0.22em]"
          style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
        >
          Curso Blacksider
        </p>
        <h1
          className="text-4xl uppercase"
          style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.text }}
        >
          {currentCourse.title}
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          {currentCourse.subtitle}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <CourseCard
          course={currentCourse}
          progress={progressMap?.[currentCourse.id]}
          locked={false}
          className="h-fit"
        />

        <aside
          className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6"
          style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
        >
          <h2
            className="text-sm uppercase tracking-[0.2em]"
            style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
          >
            Próximos passos
          </h2>
          <ul className="mt-4 space-y-3 text-sm" style={{ color: colors.textSecondary }}>
            <li>Revise os materiais de apoio e marque aulas como concluídas.</li>
            <li>Participe da comunidade para dúvidas estratégicas.</li>
            <li>Compartilhe feedback sobre o conteúdo diretamente no player.</li>
          </ul>
        </aside>
      </div>

      {relatedCourses.length ? (
        <section className="space-y-4" data-testid="academy-related-courses">
          <h2
            className="text-2xl uppercase tracking-[0.16em]"
            style={{ fontFamily: typography.fontHeading, color: colors.primary }}
          >
            Recomendados para você
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedCourses.map(({ course }) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={(id) => navigate(`/academy/courses/${id}`)}
                locked={false}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
};

export default CourseDetail;
