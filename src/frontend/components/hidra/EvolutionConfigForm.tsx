import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { colors, surfaces, typography } from '../../../shared/design/tokens';
import type { EvolutionApiConfig } from '../../../shared/types/hidra.types';
import { Input, Button, Card, CardTitle, CardSubtitle } from '../common';
import { selectUser, useAuthStore } from '../../store/auth';

const schema = z.object({
  baseUrl: z
    .string()
    .min(1, 'Informe a URL base')
    .url('URL inválida')
    .refine((v) => v.startsWith('https://'), 'A URL deve iniciar com https://'),
  apiKey: z.string().min(8, 'Chave API muito curta'),
});

export type EvolutionConfigFormValues = z.infer<typeof schema>;

type EvolutionConfigFormProps = {
  initialConfig?: Partial<EvolutionApiConfig> | null;
  onSubmit?: (values: EvolutionConfigFormValues) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
  successMessage?: string | null;
};

export const EvolutionConfigForm = ({
  initialConfig,
  onSubmit,
  submitting = false,
  error,
  successMessage,
}: EvolutionConfigFormProps) => {
  const user = useAuthStore(selectUser);
  const [values, setValues] = useState<EvolutionConfigFormValues>({
    baseUrl: initialConfig?.baseUrl ?? '',
    apiKey: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    switch (initialConfig?.status) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Erro';
      case 'disconnected':
      default:
        return 'Desconectado';
    }
  }, [initialConfig?.status]);

  const handleChange = (key: keyof EvolutionConfigFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  useEffect(() => {
    if (!initialConfig?.baseUrl) {
      return;
    }

    setValues((prev) => {
      if (prev.baseUrl === initialConfig.baseUrl) {
        return prev;
      }
      return { ...prev, baseUrl: initialConfig.baseUrl };
    });
  }, [initialConfig?.baseUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setValidationError(first?.message ?? 'Dados inválidos');
      return;
    }
    await onSubmit?.(parsed.data);
  };

  return (
    <Card className="max-w-2xl" variant="outlined" data-testid="hidra-configure-evolution">
      <div className="space-y-2">
        <CardTitle className="text-xl" style={{ color: colors.primary }}>
          Evolution API
        </CardTitle>
        <CardSubtitle style={{ color: colors.textSecondary }}>
          Configure a conexão com sua instância da Evolution API.
        </CardSubtitle>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Base URL"
            placeholder="https://minha-evolution.exemplo.com"
            value={values.baseUrl}
            onChange={handleChange('baseUrl')}
            name="evolutionUrl"
            required
          />
          <Input
            label="API Key"
            placeholder="chave-secreta"
            value={values.apiKey}
            onChange={handleChange('apiKey')}
            name="apiKey"
            required
          />
        </div>

        {initialConfig ? (
          <div className="rounded-xl border border-[var(--cfg-border)] bg-[var(--cfg-bg)] p-4 text-sm" style={{ '--cfg-border': colors.borderPrimary, '--cfg-bg': colors.bgPrimary } as CSSProperties}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span style={{ color: colors.textSecondary }}>Status atual: {statusLabel}</span>
              {initialConfig.lastHealthCheckAt ? (
                <span style={{ color: colors.textSecondary }}>
                  Último check: {new Date(initialConfig.lastHealthCheckAt).toLocaleString('pt-BR')}
                </span>
              ) : null}
            </div>
            {initialConfig.errorMessage ? (
              <p className="mt-2 text-sm" style={{ color: colors.accentError }}>
                {initialConfig.errorMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {validationError ? (
          <div className="rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] p-3 text-sm" style={{ '--err-border': colors.accentError, '--err-bg': surfaces.errorTint } as CSSProperties}>
            {validationError}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] p-3 text-sm" style={{ '--err-border': colors.accentError, '--err-bg': surfaces.errorTint } as CSSProperties}>
            {error}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-lg border border-[var(--ok-border)] bg-[var(--ok-bg)] p-3 text-sm" style={{ '--ok-border': colors.borderAccent, '--ok-bg': surfaces.successTint } as CSSProperties}>
            {successMessage}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.16em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
            Usuário: {user?.profile.displayName ?? user?.email ?? 'desconhecido'}
          </div>
          <Button type="submit" disabled={submitting} loading={submitting} data-testid="hidra-config-submit">
            {initialConfig ? 'Atualizar' : 'Conectar'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
