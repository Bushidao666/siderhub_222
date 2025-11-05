import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { colors, typography } from '../../../shared/design/tokens';
import { cn } from '../../../shared/utils/cn';

type InputVariant = 'default' | 'filled' | 'ghost';

type InputProps = {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: InputVariant;
  containerClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const variantTokens: Record<InputVariant, { bg: string; border: string; focusBorder: string }> = {
  default: {
    bg: colors.bgPrimary,
    border: colors.borderPrimary,
    focusBorder: colors.borderAccent,
  },
  filled: {
    bg: colors.bgSecondary,
    border: colors.borderSubtle,
    focusBorder: colors.borderAccent,
  },
  ghost: {
    bg: 'transparent',
    border: colors.borderSubtle,
    focusBorder: colors.primary,
  },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      leftIcon,
      rightIcon,
      id,
      className,
      containerClassName,
      variant = 'default',
      style,
      ...rest
    },
    ref,
  ) => {
    const tokens = variantTokens[variant];
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperMessageId = error ? errorId : descriptionId;
    const inputStyle = {
      '--input-bg': tokens.bg,
      '--input-border': tokens.border,
      '--input-focus': tokens.focusBorder,
      '--input-text': colors.textPrimary,
      '--input-placeholder': colors.textTertiary,
      ...style,
    } as CSSProperties;

    return (
      <label
        className={cn('flex w-full flex-col gap-2 text-sm', containerClassName)}
        style={{ fontFamily: typography.fontPrimary }}
        data-variant={variant}
        data-invalid={error ? 'true' : undefined}
      >
        {label ? (
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--label-color)]" style={{ '--label-color': colors.textSecondary } as CSSProperties}>
            {label}
          </span>
        ) : null}
        <div
          className={cn(
            'group relative flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-200',
            'bg-[var(--input-bg)] border-[var(--input-border)] focus-within:border-[var(--input-focus)] focus-within:shadow-[0_0_12px_rgba(0,255,0,0.35)]',
            error ? 'border-[var(--input-error-border)]' : '',
          )}
          style={{
            '--input-error-border': colors.accentError,
          } as CSSProperties}
        >
          {leftIcon ? <span className="text-[var(--input-placeholder)]" aria-hidden>{leftIcon}</span> : null}
          <input
            ref={ref}
            className={cn(
              'w-full bg-transparent text-[var(--input-text)] outline-none placeholder:text-[var(--input-placeholder)]',
              className,
            )}
            style={inputStyle}
            id={inputId}
            aria-describedby={helperMessageId}
            aria-invalid={Boolean(error)}
            aria-errormessage={error ? errorId : undefined}
            {...rest}
          />
          {rightIcon ? <span className="text-[var(--input-placeholder)]" aria-hidden>{rightIcon}</span> : null}
        </div>
        {description && !error ? (
          <span
            id={descriptionId}
            className="text-xs text-[var(--description-color)]"
            style={{ '--description-color': colors.textSecondary } as CSSProperties}
          >
            {description}
          </span>
        ) : null}
        {error ? (
          <span
            id={errorId}
            className="text-xs text-[var(--error-color)]"
            style={{ '--error-color': colors.accentError } as CSSProperties}
            role="alert"
          >
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = 'Input';
