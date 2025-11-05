import type { CSSProperties } from 'react';

import { colors, surfaces, typography } from '../../../shared/design/tokens';
import { CampaignTable } from '../../components/hidra/CampaignTable';
import { MetricsCards } from '../../components/hidra/MetricsCards';
import { useCampaignStats } from '../../hooks/useCampaignStats';
import { handleHidraError } from '../../services/hidraService';

export const HidraDashboard = () => {
  const { campaigns, overview, timeline, isLoading, isFetching, error } = useCampaignStats();
  const errorMessage = error ? handleHidraError(error) : null;

  return (
    <section className="space-y-6" data-testid="hidra-dashboard">
      <header className="space-y-1">
        <h1
          className="text-3xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Hidra automations
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Visualize métricas de campanhas e configure o Evolution enquanto as integrações finais chegam.
        </p>
      </header>

      <MetricsCards overview={overview} timeline={timeline} loading={isLoading || isFetching} />

      <CampaignTable items={campaigns} loading={isLoading} />

      {errorMessage ? (
        <div
          className="rounded-3xl border border-[var(--err-border)] bg-[var(--err-bg)] p-4 text-sm"
          style={{ '--err-border': colors.accentError, '--err-bg': surfaces.errorTint } as CSSProperties}
        >
          {errorMessage}
        </div>
      ) : null}

      {!campaigns.length && !isLoading ? (
        <div
          className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 text-sm"
          style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
        >
          Nenhuma campanha registrada ainda. Use o botão "Criar campanha" para iniciar um disparo pela Evolution API.
        </div>
      ) : null}
    </section>
  );
};

export default HidraDashboard;
