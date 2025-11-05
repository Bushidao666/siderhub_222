import type { CSSProperties } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import type { ResourceCategory, ResourceTag } from '../../../shared/types/cybervault.types';
import { ResourceType, Visibility } from '../../../shared/types/common.types';
import { Input, Button, Card } from '../common';

type FilterBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  categories: ResourceCategory[];
  tags: ResourceTag[];
  selectedCategoryId?: string | null;
  selectedType?: ResourceType | 'all';
  selectedVisibility?: Visibility | 'all';
  onChangeCategory?: (id: string | null) => void;
  onChangeType?: (type: ResourceType | 'all') => void;
  onChangeVisibility?: (v: Visibility | 'all') => void;
  onClear?: () => void;
};

export const FilterBar = ({
  query,
  onQueryChange,
  categories,
  tags,
  selectedCategoryId,
  selectedType = 'all',
  selectedVisibility = 'all',
  onChangeCategory,
  onChangeType,
  onChangeVisibility,
  onClear,
}: FilterBarProps) => {
  const normalizeKebab = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return (
    <Card variant="outlined" className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Buscar recursos"
          placeholder="Digite palavras-chave"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          data-testid="cybervault-search"
        />
        <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
            Categoria
          </span>
          <select
            className="rounded-lg border px-4 py-3"
            style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
            value={selectedCategoryId ?? ''}
            onChange={(e) => onChangeCategory?.(e.target.value || null)}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
            <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
              Tipo
            </span>
            <select
              className="rounded-lg border px-4 py-3"
              style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
              value={selectedType}
              onChange={(e) => onChangeType?.((e.target.value as ResourceType | 'all') ?? 'all')}
            >
              <option value="all">Todos</option>
              {Object.values(ResourceType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ fontFamily: typography.fontPrimary }}>
            <span className="text-xs uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
              Visibilidade
            </span>
            <select
              className="rounded-lg border px-4 py-3"
              style={{ background: colors.bgPrimary, color: colors.textPrimary, borderColor: colors.borderPrimary }}
              value={selectedVisibility}
              onChange={(e) => onChangeVisibility?.((e.target.value as Visibility | 'all') ?? 'all')}
            >
              <option value="all">Todas</option>
              {Object.values(Visibility).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {tags.length ? (
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em]" style={{ fontFamily: typography.fontHeading }}>
          {tags.slice(0, 10).map((t) => (
            <span
              key={t.id}
              className="cursor-pointer rounded-full border border-[var(--tag-border)] px-3 py-1 hover:shadow-[0_0_8px_rgba(0,255,0,0.4)]"
              style={{ '--tag-border': colors.borderSubtle, color: colors.textSecondary } as CSSProperties}
              data-testid={`cybervault-filter-tag-${normalizeKebab(t.name)}`}
            >
              #{t.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClear}>Limpar filtros</Button>
      </div>
    </Card>
  );
};
