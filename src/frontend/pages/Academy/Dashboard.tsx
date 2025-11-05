import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import type { CourseMeta, CourseProgress, CourseRecommendation } from '../../../shared/types/academy.types';
import { CourseStatus } from '../../../shared/types/common.types';
import { AcademyHighlights } from '../../components/hub/AcademyHighlights';
import { useCoursesProgressMap } from '../../hooks/useCourseProgress';
import { useHubData } from '../../hooks/useHubData';
import { selectIsAuthenticated, useAuthStore } from '../../store/auth';
import Login from '../Auth/Login';

type AcademyDashboardProps = {
  courses?: CourseMeta[];
  progressMap?: Partial<Record<string, CourseProgress>>;
  recommendations?: CourseRecommendation[];
};

export const AcademyDashboard = ({ courses, progressMap: externalProgressMap, recommendations }: AcademyDashboardProps) => {
  const hub = useHubData();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const hubAcademy = hub.data?.academy;
  const list: CourseMeta[] = courses ?? hubAcademy?.featured ?? [];
  const recs: CourseRecommendation[] =
    recommendations ?? hubAcademy?.recommendations.map((item) => item.recommendation) ?? [];
  const courseIds = useMemo(() => list.map((course) => course.id), [list]);
  const { progressMap: hydratedProgressMap, isLoading: progressLoading } = useCoursesProgressMap(isAuthenticated ? courseIds : []);
  const mergedProgressMap = externalProgressMap ?? hydratedProgressMap;

  const items = useMemo(
    () =>
      list.map((course) => ({
        course,
        progress: mergedProgressMap?.[course.id],
        recommendation: recs.find((r) => r.courseId === course.id),
        locked: course.status !== CourseStatus.Published,
      })),
    [list, mergedProgressMap, recs],
  );

  if (!isAuthenticated) {
    return (
      <main
        data-testid="academy-dashboard"
        className="container mx-auto flex max-w-[var(--container-2xl)] flex-col gap-8 px-6 py-8"
        style={{ '--container-2xl': '1440px' } as CSSProperties}
      >
        <header className="space-y-1">
          <h1 className="text-3xl uppercase tracking-[0.14em]" style={{ fontFamily: typography.fontHeading, color: colors.primary }}>
            Academia Blacksider
          </h1>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Cursos e trilhas para acelerar seu progresso.
          </p>
        </header>

        <section
          className="rounded-3xl border border-[var(--lock-border)] bg-[var(--lock-bg)] p-10 text-center"
          style={{
            '--lock-border': colors.borderPrimary,
            '--lock-bg': colors.bgSecondary,
            color: colors.textSecondary,
          } as CSSProperties}
        >
          <p className="text-lg uppercase tracking-[0.12em]" style={{ fontFamily: typography.fontHeading }}>
            Autentique-se para acompanhar seus cursos.
          </p>
        </section>
        <div className="mt-2">
          <Login />
        </div>
      </main>
    );
  }

  return (
    <main
      data-testid="academy-dashboard"
      className="container mx-auto flex max-w-[var(--container-2xl)] flex-col gap-8 px-6 py-8"
      style={{ '--container-2xl': '1440px' } as CSSProperties}
    >
      <header className="space-y-1">
        <h1 className="text-3xl uppercase tracking-[0.14em]" style={{ fontFamily: typography.fontHeading, color: colors.primary }}>
          Academia Blacksider
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Cursos e trilhas para acelerar seu progresso.
        </p>
      </header>

      <AcademyHighlights items={items} loading={hub.isLoading || progressLoading} />
    </main>
  );
};

export default AcademyDashboard;
