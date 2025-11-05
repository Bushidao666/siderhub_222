import type { CSSProperties } from 'react';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { colors, surfaces, typography } from '../../../shared/design/tokens';
import type {
  CampaignDetail,
  CreateCampaignPayload,
  EvolutionApiConfig,
  HidraDashboardSummary,
} from '../../../shared/types/hidra.types';
import { Button, Card, CardContent, CardTitle, Input } from '../../components/common';
import { EvolutionConfigForm, type EvolutionConfigFormValues } from '../../components/hidra/EvolutionConfigForm';
import { useHidraDashboard } from '../../hooks/useHidraDashboard';
import { queryKeys } from '../../lib/queryClient';
import { hidraService, handleHidraError } from '../../services/hidraService';

const placeholderSegments = [
  { id: 'segment-growth', name: 'Growth Leads' },
  { id: 'segment-warm', name: 'Warm Contacts' },
];

const placeholderTemplates = [
  { id: 'template-launch', name: 'Template Lançamento' },
  { id: 'template-onboarding', name: 'Boas-vindas Mentoria' },
];

const initialFormState: CreateCampaignPayload = {
  name: '',
  description: '',
  segmentId: placeholderSegments[0]?.id ?? '',
  templateId: placeholderTemplates[0]?.id ?? '',
  maxMessagesPerMinute: 60,
  scheduledAt: null,
  externalId: '',
};

export const HidraCampaignCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dashQuery = useHidraDashboard();
  const config: EvolutionApiConfig | null = dashQuery.data?.config ?? null;
  const [form, setForm] = useState<CreateCampaignPayload>(initialFormState);
  const [configMessage, setConfigMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdCampaign, setCreatedCampaign] = useState<CampaignDetail | null>(null);
  const queryError = dashQuery.error ? handleHidraError(dashQuery.error) : null;
  const configLoading = dashQuery.isLoading || dashQuery.isFetching;

  const updateConfigMutation = useMutation({
    mutationFn: async (values: EvolutionConfigFormValues) => {
      setConfigMessage(null);
      const updated = await hidraService.updateEvolutionConfig({ ...values, verifyConnection: true });
      return updated;
    },
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData<HidraDashboardSummary | undefined>(
        queryKeys.hidra.dashboard(),
        (previous) => (previous ? { ...previous, config: updatedConfig } : previous)
      );
      setConfigMessage('Configuração verificada com sucesso.');
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(handleHidraError(error));
    },
    onSettled: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.dashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.campaignStats() }),
      ]);
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (payload: CreateCampaignPayload) => {
      setErrorMessage(null);
      return hidraService.createCampaign(payload);
    },
    onSuccess: (campaign) => {
      setCreatedCampaign(campaign);
      setForm(initialFormState);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.dashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hidra.campaignStats() }),
      ]);
    },
    onError: (error) => {
      setErrorMessage(handleHidraError(error));
    },
  });

  const handleConfigSubmit = async (values: EvolutionConfigFormValues) => {
    try {
      await updateConfigMutation.mutateAsync(values);
    } catch (error) {
      // handled in onError mutation callback
    }
  };

  const handleFormChange = <K extends keyof CreateCampaignPayload>(key: K, value: CreateCampaignPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = useMemo(() => {
    return Boolean(form.name && form.segmentId && form.templateId);
  }, [form.name, form.segmentId, form.templateId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setErrorMessage('Preencha os campos obrigatórios para salvar a campanha.');
      return;
    }

    setCreatedCampaign(null);

    const payload: CreateCampaignPayload = {
      ...form,
      scheduledAt: form.scheduledAt || null,
      externalId: form.externalId || undefined,
    };

    try {
      await createCampaignMutation.mutateAsync(payload);
    } catch (error) {
      // handled above
    }
  };

  return (
    <section className="space-y-8" data-testid="hidra-create-campaign">
      <header className="space-y-1">
        <h1
          className="text-3xl uppercase tracking-[0.18em]"
          style={{ fontFamily: typography.fontHeading, color: colors.primary }}
        >
          Criar campanha
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Defina segmentação, template e limite de disparos. Integração real com Evolution API já alinhada.
        </p>
      </header>

      {((errorMessage && !updateConfigMutation.isError) || queryError) ? (
        <div
          className="rounded-3xl border border-[var(--err-border)] bg-[var(--err-bg)] p-4 text-sm"
          style={{ '--err-border': colors.accentError, '--err-bg': surfaces.errorTint }}
        >
          {queryError ?? errorMessage}
        </div>
      ) : null}
      {createdCampaign ? (
        <div
          className="rounded-3xl border border-[var(--ok-border)] bg-[var(--ok-bg)] p-4 text-sm"
          style={{ '--ok-border': colors.borderAccent, '--ok-bg': surfaces.successTint }}
        >
          Campanha <strong>{createdCampaign.name}</strong> criada com sucesso. {createdCampaign.status.toUpperCase()} ·{' '}
          <button className="underline" onClick={() => navigate('/hidra/campaigns')}>
            Ver campanhas
          </button>
        </div>
      ) : null}

      <Card variant="outlined">
        <CardTitle style={{ color: colors.primary }}>Configuração Evolution</CardTitle>
        <CardContent className="space-y-4">
          <EvolutionConfigForm
            initialConfig={config}
            onSubmit={handleConfigSubmit}
            submitting={updateConfigMutation.isPending || configLoading}
            successMessage={configMessage}
            error={updateConfigMutation.isError ? errorMessage : null}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardTitle style={{ color: colors.primary }}>Detalhes da campanha</CardTitle>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Nome da campanha"
                placeholder="Sequência WhatsApp Neon"
                value={form.name}
                onChange={(event) => handleFormChange('name', event.target.value)}
                required
              />
              <Input
                label="ID externo (opcional)"
                placeholder="evolution-job-123"
                value={form.externalId ?? ''}
                onChange={(event) => handleFormChange('externalId', event.target.value)}
              />
            </div>
            <div>
              <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
                <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                  Descrição
                </span>
                <textarea
                  className="min-h-[140px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-3 text-sm"
                  style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
                  value={form.description ?? ''}
                  onChange={(event) => handleFormChange('description', event.target.value)}
                  placeholder="Resumo do objetivo da campanha"
                />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
                <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                  Segmento
                </span>
                <select
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-3"
                  style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
                  value={form.segmentId}
                  onChange={(event) => handleFormChange('segmentId', event.target.value)}
                  required
                >
                  {placeholderSegments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
                <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                  Template
                </span>
                <select
                  className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-3"
                  style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
                  value={form.templateId}
                  onChange={(event) => handleFormChange('templateId', event.target.value)}
                  required
                >
                  {placeholderTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Mensagens por minuto"
                type="number"
                min={1}
                max={1000}
                value={form.maxMessagesPerMinute ?? 60}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  handleFormChange('maxMessagesPerMinute', Number.isNaN(parsed) ? 60 : parsed);
                }}
                required
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Agendar para"
                type="datetime-local"
                value={form.scheduledAt ?? ''}
                onChange={(event) => handleFormChange('scheduledAt', event.target.value)}
              />
              <div className="space-y-2 text-xs" style={{ color: colors.textSecondary }}>
                <p>Deixe vazio para disparo imediato.</p>
                <p>O wizard avançado permitirá escolha de múltiplos horários.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                data-testid="hidra-save-campaign"
                loading={createCampaignMutation.isPending}
                disabled={!canSubmit || createCampaignMutation.isPending}
              >
                Salvar campanha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default HidraCampaignCreate;
