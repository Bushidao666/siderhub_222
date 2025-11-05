import type { CSSProperties } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import type { Campaign, CampaignDetail } from '../../../shared/types/hidra.types';
import { CampaignStatus } from '../../../shared/types/common.types';
import { Badge, Button, Card, CardContent, CardTitle } from '../common';

type CampaignTableProps = {
  items: CampaignDetail[] | Campaign[];
  loading?: boolean;
  onView?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export const CAMPAIGN_TABLE_TEST_IDS = {
  root: 'component-campaign-table',
  row: 'component-campaign-row',
} as const;

const statusMap: Record<CampaignStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'outline' | 'default' }> = {
  draft: { label: 'Rascunho', variant: 'default' },
  scheduled: { label: 'Agendada', variant: 'warning' },
  running: { label: 'Rodando', variant: 'success' },
  paused: { label: 'Pausada', variant: 'warning' },
  completed: { label: 'Concluída', variant: 'outline' },
  failed: { label: 'Falhou', variant: 'error' },
};

export const CampaignTable = ({ items, loading, onView, onPause, onResume, onDelete }: CampaignTableProps) => {
  if (loading) {
    return (
      <Card variant="outlined" className="animate-pulse">
        <div className="h-10 rounded bg-[var(--skel)]" style={{ '--skel': colors.bgPrimary } as CSSProperties} />
        <div className="mt-3 h-10 rounded bg-[var(--skel)]" style={{ '--skel': colors.bgPrimary } as CSSProperties} />
        <div className="mt-3 h-10 rounded bg-[var(--skel)]" style={{ '--skel': colors.bgPrimary } as CSSProperties} />
      </Card>
    );
  }

  return (
    <Card variant="outlined" data-testid={CAMPAIGN_TABLE_TEST_IDS.root}>
      <CardTitle className="text-xl" style={{ color: colors.primary }}>
        Campanhas
      </CardTitle>
      <CardContent className="mt-4 overflow-x-auto p-0">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="text-left uppercase tracking-[0.16em]" style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Agendada</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const status = statusMap[item.status];
              const scheduled = 'scheduledAt' in item && item.scheduledAt ? new Date(item.scheduledAt).toLocaleString('pt-BR') : '-';
              const id = item.id;
              const canPause = item.status === 'running';
              const canResume = item.status === 'paused' || item.status === 'scheduled';
              const canDelete = item.status === 'draft' || item.status === 'failed' || item.status === 'completed';

              return (
                <tr
                  key={id}
                  data-testid={(function () {
                    const name = 'name' in item ? String(item.name) : String(id);
                    const slug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    return `hidra-campaign-row-${slug}`;
                  })()}
                  className="border-t border-[var(--row-border)]"
                  style={{ '--row-border': colors.borderPrimary } as CSSProperties}
                >
                  <td className="px-4 py-3" style={{ color: colors.textPrimary }}>{'name' in item ? item.name : id}</td>
                  <td className="px-4 py-3" style={{ color: colors.textSecondary }}>{item.channel.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3" style={{ color: colors.textSecondary }}>{scheduled}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => onView?.(id)}>Ver</Button>
                      {canPause ? (
                        <Button variant="ghost" onClick={() => onPause?.(id)}>Pausar</Button>
                      ) : null}
                      {canResume ? (
                        <Button variant="primary" onClick={() => onResume?.(id)}>Retomar</Button>
                      ) : null}
                      {canDelete ? (
                        <Button variant="ghost" onClick={() => onDelete?.(id)}>Excluir</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
