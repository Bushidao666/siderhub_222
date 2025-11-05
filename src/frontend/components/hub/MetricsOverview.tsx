import type { CSSProperties } from 'react';
import { colors, glows, typography } from '../../../shared/design/tokens';
import type { CampaignOverview } from '../../hooks/useCampaignStats';
import { Card, CardContent, CardTitle } from '../common';

type HubMetricsOverviewProps = {
  metrics: CampaignOverview | null | undefined;
  loading?: boolean;
};

type MetricConfig = {
  key: 'totalMessages' | 'delivered' | 'pending' | 'failed';
  label: string;
  accent?: 'primary' | 'danger';
};

const METRICS: MetricConfig[] = [
  { key: 'totalMessages', label: 'Mensagens totais', accent: 'primary' },
  { key: 'delivered', label: 'Entregues', accent: 'primary' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'failed', label: 'Falhas', accent: 'danger' },
];

export const HubMetricsOverview = ({ metrics, loading }: HubMetricsOverviewProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 animate-pulse rounded-2xl border border-[var(--skel-border)] bg-[var(--skel-bg)]"
            style={{ '--skel-border': colors.borderPrimary, '--skel-bg': colors.bgPrimary } as CSSProperties}
          />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card variant="outlined" data-testid="hub-metrics-empty">
        <CardTitle className="text-lg" style={{ color: colors.primary }}>
          Métricas indisponíveis
        </CardTitle>
        <CardContent className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
          As métricas do Hidra ainda não foram sincronizadas. Assim que as campanhas enviarem dados, elas
          aparecerão aqui.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="hub-metrics-overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map(({ key, label, accent }) => (
          <MetricCard key={key} label={label} value={metrics[key]} accent={accent} />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors.textSecondary }}>
        Atualizado em
        {' '}
        {metrics.lastUpdatedAt ? new Date(metrics.lastUpdatedAt).toLocaleString('pt-BR') : 'sem registro'}.
        {' '}
        Média de entrega: {metrics.averageDeliveryMs}ms.
      </p>
    </div>
  );
};

type MetricCardProps = {
  label: string;
  value: number;
  accent?: 'primary' | 'danger';
};

const MetricCard = ({ label, value, accent }: MetricCardProps) => (
  <div
    className="rounded-2xl border px-5 py-4"
    style={{
      borderColor: colors.borderPrimary,
      background: colors.bgSecondary,
      boxShadow: accent === 'primary' ? glows.sm : undefined,
    }}
  >
    <div
      className="text-xs uppercase tracking-[0.16em]"
      style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
    >
      {label}
    </div>
    <div
      className="mt-1 text-2xl"
      style={{ color: accent === 'danger' ? colors.accentError : colors.primary }}
      data-testid={`hub-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {value.toLocaleString('pt-BR')}
    </div>
  </div>
);

export default HubMetricsOverview;
