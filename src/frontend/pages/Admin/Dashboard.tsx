import type { CSSProperties } from 'react';

import { colors, glows, typography } from '../../../shared/design/tokens';
import { Card, CardContent, CardTitle } from '../../components/common';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { mapApiError } from '../../../shared/utils/errorHandler';

export const AdminDashboard = () => {
  const { data, isLoading, isFetching, error } = useAdminDashboard();
  const loading = isLoading || isFetching;
  const errorMessage = error ? mapApiError(error) : null;
  const metrics = data?.metrics ?? [];
  const upcomingTasks = data?.upcomingTasks ?? [];
  const recentActivities = data?.recentActivities ?? [];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <header className="space-y-2">
        <p
          className="text-xs uppercase tracking-[0.22em]"
          style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
        >
          Painel de controle
        </p>
        <h1
          className="text-3xl uppercase"
          style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.text }}
        >
          Overview administrativo
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Acompanhe rapidamente banners, membros e métricas gerais enquanto finalizamos os widgets dinâmicos.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} variant="outlined" className="animate-pulse">
                <div className="h-20 rounded-xl bg-[var(--skel)]" style={{ '--skel': colors.bgPrimary } as CSSProperties} />
              </Card>
            ))
          : metrics.map((metric) => (
              <Card key={metric.id} glowing>
                <CardTitle style={{ color: colors.primary }}>{metric.label}</CardTitle>
                <CardContent>
                  <p className="text-4xl font-semibold" style={{ fontFamily: typography.fontHeading }}>
                    {metric.value.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card variant="outlined">
          <CardTitle style={{ color: colors.primary }}>Próximos ajustes</CardTitle>
          <CardContent className="space-y-3 text-sm" style={{ color: colors.textSecondary }}>
            {upcomingTasks.length
              ? upcomingTasks.map((task, index) => <p key={index}>• {task}</p>)
              : 'Nenhuma tarefa cadastrada.'}
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardTitle style={{ color: colors.primary }}>Atividades recentes</CardTitle>
          <CardContent className="space-y-3 text-sm" style={{ color: colors.textSecondary }}>
            {recentActivities.length
              ? recentActivities.map((activity, index) => <p key={index}>• {activity}</p>)
              : 'Sem atividades registradas.'}
          </CardContent>
        </Card>
      </section>

      {errorMessage ? (
        <p className="text-sm" style={{ color: colors.accentError }}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
