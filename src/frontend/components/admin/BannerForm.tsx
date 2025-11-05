import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { colors } from '../../../shared/design/tokens';
import type { BannerCta, HeroBanner } from '../../../shared/types/admin.types';
import { Badge, Button, Card, CardSubtitle, CardTitle, Input } from '../common';

const ctaSchema = z.object({
  label: z.string().min(1, 'Informe o rótulo'),
  href: z.string().url('URL inválida'),
  external: z.boolean().default(false),
});

const formSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  description: z.string().min(10, 'Descrição muito curta'),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
  status: z.enum(['active', 'inactive', 'scheduled']),
  startsAt: z.string().optional().or(z.literal('')),
  endsAt: z.string().optional().or(z.literal('')),
});

export type BannerFormValues = z.infer<typeof formSchema>;

type BannerFormProps = {
  initial?: Partial<HeroBanner> | null;
  onSubmit?: (values: BannerFormValues) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
  successMessage?: string | null;
};

export const BannerForm = ({ initial, onSubmit, submitting, error, successMessage }: BannerFormProps) => {
  const [values, setValues] = useState<BannerFormValues>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    imageUrl: initial?.imageUrl ?? '',
    primaryCta: initial?.primaryCta ?? { label: '', href: '', external: false },
    secondaryCta: initial?.secondaryCta ?? undefined,
    status: initial?.status ?? 'inactive',
    startsAt: initial?.startsAt ?? '',
    endsAt: initial?.endsAt ?? '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCtaChange = (key: 'primaryCta' | 'secondaryCta', field: keyof BannerCta) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { label: '', href: '', external: false }),
        [field]: field === 'external' ? e.target.checked : e.target.value,
      },
    }));
  };

  useEffect(() => {
    setValues({
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      imageUrl: initial?.imageUrl ?? '',
      primaryCta: initial?.primaryCta ?? { label: '', href: '', external: false },
      secondaryCta: initial?.secondaryCta ?? undefined,
      status: initial?.status ?? 'inactive',
      startsAt: initial?.startsAt ?? '',
      endsAt: initial?.endsAt ?? '',
    });
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }
    await onSubmit?.(parsed.data);
  };

  return (
    <Card variant="outlined" className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-xl" style={{ color: colors.primary }}>
            Banner (Hero)
          </CardTitle>
          <CardSubtitle style={{ color: colors.textSecondary }}>
            Configure o banner principal exibido no Hub.
          </CardSubtitle>
        </div>
        <Badge variant={values.status === 'active' ? 'success' : values.status === 'scheduled' ? 'warning' : 'default'}>
          {values.status}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Título" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
          <Input label="Imagem (URL)" value={values.imageUrl} onChange={(e) => setValues({ ...values, imageUrl: e.target.value })} />
        </div>
        <Input
          label="Descrição"
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          required
        />
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-[0.16em]" style={{ color: colors.textSecondary }}>CTA Principal</legend>
            <div className="space-y-3">
              <Input label="Rótulo" value={values.primaryCta.label} onChange={handleCtaChange('primaryCta', 'label')} required />
              <Input label="URL" value={values.primaryCta.href} onChange={handleCtaChange('primaryCta', 'href')} required />
              <label className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <input type="checkbox" checked={values.primaryCta.external} onChange={handleCtaChange('primaryCta', 'external')} />
                Abrir em nova aba
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-[0.16em]" style={{ color: colors.textSecondary }}>CTA Secundário (opcional)</legend>
            <div className="space-y-3">
              <Input label="Rótulo" value={values.secondaryCta?.label ?? ''} onChange={handleCtaChange('secondaryCta', 'label')} />
              <Input label="URL" value={values.secondaryCta?.href ?? ''} onChange={handleCtaChange('secondaryCta', 'href')} />
              <label className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                <input type="checkbox" checked={values.secondaryCta?.external ?? false} onChange={handleCtaChange('secondaryCta', 'external')} />
                Abrir em nova aba
              </label>
            </div>
          </fieldset>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
              Status
            </span>
            <select
              className="rounded-lg border px-4 py-3"
              style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
              value={values.status}
              onChange={(e) => setValues({ ...values, status: e.target.value as BannerFormValues['status'] })}
            >
              <option value="inactive">inactive</option>
              <option value="active">active</option>
              <option value="scheduled">scheduled</option>
            </select>
          </label>
          <Input label="Início (ISO)" placeholder="2025-01-01T00:00:00Z" value={values.startsAt ?? ''} onChange={(e) => setValues({ ...values, startsAt: e.target.value })} />
          <Input label="Fim (ISO)" placeholder="2025-01-31T23:59:59Z" value={values.endsAt ?? ''} onChange={(e) => setValues({ ...values, endsAt: e.target.value })} />
        </div>

        {validationError ? (
          <div className="rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] p-3 text-sm" style={{ '--err-border': colors.accentError, '--err-bg': 'rgba(255,51,51,0.08)' } as CSSProperties}>
            {validationError}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] p-3 text-sm" style={{ '--err-border': colors.accentError, '--err-bg': 'rgba(255,51,51,0.08)' } as CSSProperties}>
            {error}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-lg border border-[var(--ok-border)] bg-[var(--ok-bg)] p-3 text-sm" style={{ '--ok-border': colors.borderAccent, '--ok-bg': 'rgba(0,255,0,0.08)' } as CSSProperties}>
            {successMessage}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} loading={submitting}>
            {initial ? 'Salvar alterações' : 'Criar banner'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
