import type { CSSProperties } from 'react';
import { colors, glows, typography } from '../../../shared/design/tokens';
import type { CampaignMetrics, CampaignTimelinePoint } from '../../../shared/types/hidra.types';
import { Card, CardContent, CardTitle } from '../common';
import { TimelineChart } from './TimelineChart';

type MetricsCardsProps = {
  overview: Omit<CampaignMetrics, 'campaignId'> | null;
  timeline: CampaignTimelinePoint[];
  loading?: boolean;
};

export const MetricsCards = ({ overview, timeline, loading }: MetricsCardsProps) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 animate-pulse rounded-2xl border border-[var(--skel-border)] bg-[var(--skel-bg)]" style={{ '--skel-border': colors.borderPrimary, '--skel-bg': colors.bgPrimary } as CSSProperties} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={overview?.totalMessages ?? 0} />
        <MetricCard label="Entregues" value={overview?.delivered ?? 0} accent="primary" />
        <MetricCard label="Pendentes" value={overview?.pending ?? 0} />
        <MetricCard label="Falhas" value={overview?.failed ?? 0} accent="danger" />
      </div>
      <Card variant="outlined">
        <CardTitle className="text-lg" style={{ color: colors.primary }}>
          Timeline de Entregas
        </CardTitle>
        <CardContent className="mt-4">
          <TimelineChart data={timeline} />
          {overview ? (
            <p className="mt-3 text-xs" style={{ color: colors.textSecondary }}>
              Média de entrega: {overview.averageDeliveryMs}ms · Atualizado em {new Date(overview.lastUpdatedAt).toLocaleString('pt-BR')}
            </p>
          ) : null}
        </CardContent>
      </Card>
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
      boxShadow: accent ? glows.sm : undefined,
    }}
  >
    <div className="text-xs uppercase tracking-[0.16em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
      {label}
    </div>
    <div className="mt-1 text-2xl" style={{ color: accent === 'danger' ? colors.accentError : colors.primary }}>
      {value.toLocaleString('pt-BR')}
    </div>
  </div>
);

