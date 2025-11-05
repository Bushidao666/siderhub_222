import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import { cn } from '../../../shared/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

type BadgeProps = {
  variant?: BadgeVariant;
  icon?: ReactNode;
  srLabel?: string;
} & HTMLAttributes<HTMLSpanElement>;

const variantTokens: Record<BadgeVariant, { bg: string; border: string; color: string }> = {
  default: {
    bg: colors.bgTertiary,
    border: colors.borderSubtle,
    color: colors.textSecondary,
  },
  success: {
    bg: 'rgba(0, 255, 0, 0.15)',
    border: colors.borderAccent,
    color: colors.primary,
  },
  warning: {
    bg: 'rgba(255, 215, 0, 0.15)',
    border: colors.accentWarning,
    color: colors.accentWarning,
  },
  error: {
    bg: 'rgba(255, 51, 51, 0.15)',
    border: colors.accentError,
    color: colors.accentError,
  },
  info: {
    bg: 'rgba(0, 191, 255, 0.15)',
    border: colors.accentInfo,
    color: colors.accentInfo,
  },
  outline: {
    bg: 'transparent',
    border: colors.borderAccent,
    color: colors.primary,
  },
};

export const Badge = ({ variant = 'default', icon, srLabel, className, children, ...rest }: BadgeProps) => {
  const tokens = variantTokens[variant];
  const style = {
    '--badge-bg': tokens.bg,
    '--badge-border': tokens.border,
    '--badge-color': tokens.color,
    fontFamily: typography.fontPrimary,
    letterSpacing: '0.08em',
  } as CSSProperties;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em]',
        'bg-[var(--badge-bg)] border-[var(--badge-border)] text-[var(--badge-color)]',
        className,
      )}
      style={style}
      data-variant={variant}
      {...rest}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      <span>{children}</span>
    </span>
  );
};
