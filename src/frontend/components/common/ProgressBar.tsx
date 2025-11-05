import type { CSSProperties, HTMLAttributes } from 'react';
import { useId } from 'react';
import { colors, glows, typography } from '../../../shared/design/tokens';
import { cn } from '../../../shared/utils/cn';

type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  tone?: ProgressTone;
} & HTMLAttributes<HTMLDivElement>;

const toneTokens: Record<ProgressTone, { bar: string; glow: string }> = {
  primary: {
    bar: colors.primary,
    glow: glows.md,
  },
  success: {
    bar: colors.accentSuccess,
    glow: glows.md,
  },
  warning: {
    bar: colors.accentWarning,
    glow: glows.sm,
  },
  danger: {
    bar: colors.accentError,
    glow: glows.sm,
  },
};

export const ProgressBar = ({
  value,
  max = 100,
  label,
  showLabel = true,
  tone = 'primary',
  className,
  ...rest
}: ProgressBarProps) => {
  const { 'aria-label': ariaLabelFromProps, 'aria-labelledby': ariaLabelledbyFromProps, ...divProps } = rest;
  const safeMax = max <= 0 ? 100 : max;
  const percentage = Math.min(100, Math.max(0, (value / safeMax) * 100));
  const tokens = toneTokens[tone];
  const generatedId = useId();
  const labelId = label && showLabel ? `${generatedId}-label` : undefined;
  const valueLabel = `${Math.round(percentage)}%`;
  const ariaLabel = ariaLabelFromProps ?? label ?? undefined;
  const ariaLabelledby = ariaLabelledbyFromProps ?? (labelId ? labelId : undefined);

  return (
    <div className={cn('flex w-full flex-col gap-2', className)} {...divProps}>
      {label || showLabel ? (
        <div
          id={labelId}
          className="flex items-center justify-between text-xs uppercase tracking-[0.18em]"
          style={{ color: colors.textSecondary, fontFamily: typography.fontHeading }}
        >
          {label ? <span>{label}</span> : <span aria-hidden />}
          {showLabel ? <span>{`${Math.round(percentage)}%`}</span> : null}
        </div>
      ) : null}
      <div
        className="relative h-3 overflow-hidden rounded-full border border-[var(--progress-border)] bg-[var(--progress-bg)]"
        style={{
          '--progress-border': colors.borderPrimary,
          '--progress-bg': colors.bgTertiary,
        } as CSSProperties}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={label ? `${label}: ${valueLabel}` : valueLabel}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : ariaLabelledby}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            background: tokens.bar,
            boxShadow: tokens.glow,
          }}
        />
      </div>
    </div>
  );
};
