import type { CSSProperties } from 'react';
import { colors } from '../../../shared/design/tokens';
import type { CampaignTimelinePoint } from '../../../shared/types/hidra.types';

type TimelineChartProps = {
  data: CampaignTimelinePoint[];
  height?: number;
};

export const TimelineChart = ({ data, height = 160 }: TimelineChartProps) => {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-[var(--chart-border)] bg-[var(--chart-bg)] text-sm" style={{ '--chart-border': colors.borderPrimary, '--chart-bg': colors.bgPrimary } as CSSProperties}>
        Sem dados suficientes
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.delivered + d.failed), 1);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-[var(--chart-border)] bg-[var(--chart-bg)]"
      style={{ '--chart-border': colors.borderPrimary, '--chart-bg': colors.bgPrimary, height: `${height}px` } as CSSProperties}
    >
      <div className="absolute inset-0 flex items-end gap-2 p-3">
        {data.map((point) => {
          const total = point.delivered + point.failed;
          const h = Math.round((total / max) * (height - 24));
          const deliveredPortion = total > 0 ? Math.round((point.delivered / total) * h) : 0;
          const failedPortion = h - deliveredPortion;
          return (
            <div key={point.timestamp} className="flex w-3 flex-col justify-end rounded bg-[var(--fail)]" style={{ '--fail': 'rgba(255,51,51,0.6)' } as CSSProperties}>
              <div className="w-full rounded-t" style={{ height: `${deliveredPortion}px`, background: colors.primary }} />
              <div className="w-full rounded-b" style={{ height: `${failedPortion}px`, background: 'rgba(255,51,51,0.6)' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

