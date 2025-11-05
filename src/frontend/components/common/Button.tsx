import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { forwardRef } from 'react';
import { colors, glows, typography } from '../../../shared/design/tokens';
import { cn } from '../../../shared/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantTokens: Record<ButtonVariant, { bg: string; color: string; border: string; hoverBg: string; shadow: string }> = {
  primary: {
    bg: colors.primary,
    color: colors.bgPrimary,
    border: colors.primary,
    hoverBg: colors.primaryDark,
    shadow: glows.md,
  },
  secondary: {
    bg: colors.bgSecondary,
    color: colors.primary,
    border: colors.borderAccent,
    hoverBg: colors.bgTertiary,
    shadow: glows.sm,
  },
  ghost: {
    bg: 'transparent',
    color: colors.textSecondary,
    border: colors.borderPrimary,
    hoverBg: colors.bgTertiary,
    shadow: glows.sm,
  },
  danger: {
    bg: colors.accentError,
    color: colors.bgPrimary,
    border: colors.accentError,
    hoverBg: colors.accentError,
    shadow: glows.sm,
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
  lg: 'h-12 px-8 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      type = 'button',
      className,
      children,
      leftIcon,
      rightIcon,
      disabled,
      loading,
      ...rest
    },
    ref,
  ) => {
    const tokens = variantTokens[variant];
    const isDisabled = disabled || loading;
    const style: CSSProperties = {
      '--btn-bg': tokens.bg,
      '--btn-border': tokens.border,
      '--btn-color': tokens.color,
      '--btn-hover-bg': tokens.hoverBg,
      '--btn-shadow': tokens.shadow,
      fontFamily: typography.fontHeading,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    } as CSSProperties;

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-md border transition-all duration-200',
          'shadow-[var(--btn-shadow)] bg-[var(--btn-bg)] border-[var(--btn-border)] text-[var(--btn-color)]',
          'hover:-translate-y-0.5 hover:bg-[var(--btn-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--btn-border)]',
          'disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none',
          sizeClasses[size],
          className,
        )}
        style={style}
        disabled={isDisabled}
        data-variant={variant}
        data-loading={loading ? 'true' : undefined}
        data-size={size}
        type={type}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? (
          <span
            className="flex h-5 w-5 animate-spin items-center justify-center rounded-full border-2 border-transparent border-t-[var(--btn-color)]"
            aria-hidden
          />
        ) : null}
        {!loading && leftIcon ? <span aria-hidden>{leftIcon}</span> : null}
        <span className="flex-1 text-center font-semibold">{children}</span>
        {!loading && rightIcon ? <span aria-hidden>{rightIcon}</span> : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
