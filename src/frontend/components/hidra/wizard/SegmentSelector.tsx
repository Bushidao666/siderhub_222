import type { CSSProperties } from 'react';
import { useState } from 'react';

import { colors, glows, surfaces } from '../../../../shared/design/tokens';
import type { ContactSegment } from '../../../../shared/types';
import { Button, Card, CardContent, CardTitle } from '../../common';
import { CSVImport } from './CSVImport';

type SegmentSelectorProps = {
  segments: ContactSegment[];
  selectedSegmentId?: string | null;
  onSelect: (segment: ContactSegment) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCSVImport?: (data: { name: string; description?: string; contacts: any[] }) => void;
  csvImportLoading?: boolean;
};

const SegmentSkeleton = () => (
  <div
    className="h-full rounded-3xl border border-[var(--skel-border)] bg-[var(--skel-bg)]"
    style={{ '--skel-border': colors.borderPrimary, '--skel-bg': colors.bgSecondary } as CSSProperties}
  />
);

const importSourceLabel: Record<ContactSegment['importSource'], string> = {
  csv_upload: 'CSV Upload',
  manual: 'Manual',
  api: 'API',
};

export const SegmentSelector = ({
  segments,
  selectedSegmentId,
  onSelect,
  loading,
  error,
  onRetry,
  onCSVImport,
  csvImportLoading,
}: SegmentSelectorProps) => {
  const [showCSVImport, setShowCSVImport] = useState(false);

  if (showCSVImport) {
    return (
      <CSVImport
        onImportComplete={(result) => {
          if (onCSVImport) {
            onCSVImport({
              name: '', // Will be set inside CSVImport
              description: '',
              contacts: result.validRows,
            });
          }
          setShowCSVImport(false);
        }}
        onCancel={() => setShowCSVImport(false)}
        loading={csvImportLoading}
      />
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2" data-testid="hidra-segment-loading">
        {[0, 1, 2, 3].map((index) => (
          <SegmentSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col gap-3 rounded-3xl border border-[var(--error-border)] bg-[var(--error-bg)] p-6 text-sm"
        data-testid="hidra-segment-error"
        style={{ '--error-border': colors.accentError, '--error-bg': surfaces.errorTint } as CSSProperties}
      >
        <span style={{ color: colors.accentError }}>{error}</span>
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry} data-testid="hidra-segment-retry">
            Tentar novamente
          </Button>
        ) : null}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="space-y-4">
        <Card variant="outlined" data-testid="hidra-segment-empty">
          <CardContent className="text-center text-sm" style={{ color: colors.textSecondary }}>
            Nenhum segmento disponível ainda. Importe contatos para criar segmentos.
          </CardContent>
        </Card>
        {onCSVImport && (
          <Card variant="outlined">
            <CardContent className="text-center">
              <Button
                variant="primary"
                onClick={() => setShowCSVImport(true)}
                disabled={csvImportLoading}
                data-testid="hidra-csv-import-button"
              >
                Importar Contatos via CSV
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="hidra-segment-list">
      {segments.map((segment) => {
        const isActive = segment.id === selectedSegmentId;
        return (
          <button
            key={segment.id}
            type="button"
            onClick={() => onSelect(segment)}
            className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-offset)]"
            data-testid={`hidra-segment-${segment.id}`}
            aria-pressed={isActive}
            style={{
              '--focus-ring': colors.borderAccent,
              '--focus-offset': colors.bgPrimary,
            } as CSSProperties}
          >
            <Card
              variant={isActive ? 'outlined' : 'solid'}
              glowing={isActive}
              className="h-full transition-transform duration-200 hover:-translate-y-0.5"
              style={
                {
                  '--card-border': isActive ? colors.borderAccent : colors.borderPrimary,
                  '--card-shadow': isActive ? glows.md : glows.sm,
                } as CSSProperties
              }
            >
              <CardTitle className="text-lg" style={{ color: colors.primary }}>
                {segment.name}
              </CardTitle>
              <CardContent>
                <p>{segment.description}</p>
                <div className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.textSecondary }}>
                  {segment.totalContacts} contatos · {importSourceLabel[segment.importSource]}
                </div>
                <span className="text-xs" style={{ color: colors.textTertiary }}>
                  Criado em {new Date(segment.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
};

SegmentSelector.displayName = 'SegmentSelector';
