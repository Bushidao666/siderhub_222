import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { colors, surfaces, typography } from '../../../shared/design/tokens';
import type { EvolutionApiConfig, HidraDashboardSummary } from '../../../shared/types/hidra.types';
import { EvolutionConfigForm, type EvolutionConfigFormValues } from '../../components/hidra/EvolutionConfigForm';
import { useHidraDashboard } from '../../hooks/useHidraDashboard';
import { queryKeys } from '../../lib/queryClient';
import { hidraService, handleHidraError } from '../../services/hidraService';

export const HidraConfig = () => {
  const queryClient = useQueryClient();
  const dashboardQuery = useHidraDashboard();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const config: EvolutionApiConfig | null = dashboardQuery.data?.config ?? null;
  const queryError = dashboardQuery.error ? handleHidraError(dashboardQuery.error) : null;

  const updateConfigMutation = useMutation({
    mutationFn: async (values: EvolutionConfigFormValues) => {
      setFormError(null);
      setSuccess(null);
      const updated = await hidraService.updateEvolutionConfig({ ...values, verifyConnection: true });
      return updated;
    },
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData<HidraDashboardSummary | undefined>(
        queryKeys.hidra.dashboard(),
        (previous) => (previous ? { ...previous, config: updatedConfig } : previous)
      );
      setSuccess('Configuração atualizada com sucesso.');
    },
    onError: (error) => {
      setFormError(handleHidraError(error));
    },
    onSettled: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.dashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.campaignStats() }),
      ]);
    },
  });

  const handleSubmit = async (values: EvolutionConfigFormValues) => {
    await updateConfigMutation.mutateAsync(values);
  };

  const loading = dashboardQuery.isLoading || dashboardQuery.isFetching;
  const showQueryError = Boolean(queryError && !formError);

  return (
    <section className="space-y-6" data-testid="hidra-config">
      <header className="space-y-1">
        <h1
          className="text-2xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Configuração Evolution API
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Cadastre sua instância Evolution para liberar campanhas automatizadas.
        </p>
      </header>

      {showQueryError ? (
        <div
          className="rounded-3xl border border-[var(--err-border)] bg-[var(--err-bg)] p-4 text-sm"
          style={{ '--err-border': colors.accentError, '--err-bg': surfaces.errorTint }}
        >
          {queryError}
        </div>
      ) : null}

      <EvolutionConfigForm
        initialConfig={config}
        onSubmit={handleSubmit}
        submitting={loading || updateConfigMutation.isPending}
        successMessage={success}
        error={formError}
      />
    </section>
  );
};

export default HidraConfig;
