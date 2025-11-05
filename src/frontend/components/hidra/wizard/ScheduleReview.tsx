import type { CSSProperties } from 'react';

import { colors, surfaces } from '../../../../shared/design/tokens';
import type { ContactSegment, MessageTemplate } from '../../../../shared/types';
import { Button, Card, CardContent, CardTitle, Input } from '../../common';

type ScheduleFormState = {
  name: string;
  description: string;
  scheduledAt: string;
  maxMessagesPerMinute: number;
  externalId: string;
};

type ScheduleReviewProps = {
  form: ScheduleFormState;
  onFormChange: <K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) => void;
  onSubmit: () => void;
  submitting?: boolean;
  canSubmit: boolean;
  segment?: ContactSegment | null;
  template?: MessageTemplate | null;
  previewBody: string;
  submissionError?: string | null;
};

export const ScheduleReview = ({
  form,
  onFormChange,
  onSubmit,
  submitting,
  canSubmit,
  segment,
  template,
  previewBody,
  submissionError,
}: ScheduleReviewProps) => {
  return (
    <div className="grid gap-6" data-testid="hidra-schedule-review">
      <Card variant="outlined">
        <CardTitle className="text-lg" style={{ color: colors.primary }}>
          Dados da campanha
        </CardTitle>
        <CardContent className="gap-4">
          <Input
            label="Nome da campanha"
            placeholder="Sequência WhatsApp Neon"
            value={form.name}
            onChange={(event) => onFormChange('name', event.target.value)}
            required
            data-testid="hidra-schedule-name"
          />
          <label className="flex flex-col gap-2 text-sm" style={{ color: colors.textSecondary }}>
            <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
              Descrição
            </span>
            <textarea
              className="min-h-[140px] rounded-2xl border border-[var(--textarea-border)] bg-[var(--textarea-bg)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--textarea-focus)]"
              style={
                {
                  '--textarea-border': colors.borderPrimary,
                  '--textarea-bg': colors.bgSecondary,
                  '--textarea-focus': colors.borderAccent,
                } as CSSProperties
              }
              value={form.description}
              onChange={(event) => onFormChange('description', event.target.value)}
              placeholder="Resumo para o time acompanhar esta campanha"
              data-testid="hidra-schedule-description"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Mensagens por minuto"
              type="number"
              min={1}
              max={1000}
              value={form.maxMessagesPerMinute}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                onFormChange('maxMessagesPerMinute', Number.isNaN(nextValue) ? 60 : nextValue);
              }}
              required
              data-testid="hidra-schedule-max-rate"
            />
            <Input
              label="Agendar para"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) => onFormChange('scheduledAt', event.target.value)}
              data-testid="hidra-schedule-datetime"
            />
          </div>
          <Input
            label="ID externo (opcional)"
            placeholder="evolution-job-123"
            value={form.externalId}
            onChange={(event) => onFormChange('externalId', event.target.value)}
            data-testid="hidra-schedule-external-id"
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardTitle className="text-lg" style={{ color: colors.primary }}>
          Revisão
        </CardTitle>
        <CardContent className="gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary }}>
              Segmento
            </span>
            <p data-testid="hidra-review-segment" style={{ color: colors.textPrimary }}>
              {segment ? `${segment.name} · ${segment.totalContacts} contatos` : 'Nenhum segmento selecionado'}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary }}>
              Template
            </span>
            <p data-testid="hidra-review-template" style={{ color: colors.textPrimary }}>
              {template ? template.title : 'Nenhum template selecionado'}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary }}>
              Mensagem
            </span>
            <p className="rounded-2xl border border-[var(--preview-border)] bg-[var(--preview-bg)] p-4 text-sm" style={{
              '--preview-border': colors.borderPrimary,
              '--preview-bg': colors.bgSecondary,
              color: colors.textSecondary,
            } as CSSProperties}>
              {previewBody || 'Selecione um template para visualizar a mensagem.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {submissionError ? (
        <div
          className="rounded-3xl border border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-sm"
          data-testid="hidra-schedule-error"
          style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
        >
          {submissionError}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          loading={submitting}
          data-testid="hidra-schedule-submit"
        >
          Criar campanha
        </Button>
      </div>
    </div>
  );
};

ScheduleReview.displayName = 'ScheduleReview';
