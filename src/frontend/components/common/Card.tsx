import type { CSSProperties, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { colors, glows, shadows, typography } from '../../../shared/design/tokens';
import { cn } from '../../../shared/utils/cn';

type CardVariant = 'solid' | 'outlined' | 'glass';

type CardProps = {
  variant?: CardVariant;
  glowing?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const variantTokens: Record<CardVariant, { bg: string; border: string; shadow: string }> = {
  solid: {
    bg: colors.bgSecondary,
    border: colors.borderPrimary,
    shadow: shadows.lg,
  },
  outlined: {
    bg: colors.bgPrimary,
    border: colors.borderAccent,
    shadow: glows.sm,
  },
  glass: {
    bg: 'rgba(26, 26, 26, 0.7)',
    border: 'rgba(0, 255, 0, 0.2)',
    shadow: glows.md,
  },
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'solid', glowing = false, style, ...rest }, ref) => {
    const tokens = variantTokens[variant];
    const mergedStyle = {
      '--card-bg': tokens.bg,
      '--card-border': tokens.border,
      '--card-shadow': glowing ? glows.md : tokens.shadow,
      '--card-text': colors.textPrimary,
      '--card-subtle': colors.textSecondary,
      '--card-title': colors.primary,
      background: 'var(--card-bg)',
      borderColor: 'var(--card-border)',
      boxShadow: 'var(--card-shadow)',
      color: 'var(--card-text)',
      fontFamily: typography.fontPrimary,
      ...style,
    } as CSSProperties;

    return (
      <div
        ref={ref}
        className={cn('relative rounded-3xl border px-6 py-6', className)}
        style={mergedStyle}
        data-variant={variant}
        data-glow={glowing ? 'true' : undefined}
        {...rest}
      />
    );
  },
);

Card.displayName = 'Card';

type SectionProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = ({ className, ...rest }: SectionProps) => (
  <div className={cn('mb-4 flex items-center justify-between gap-4', className)} {...rest} />
);

export const CardTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('text-2xl uppercase tracking-[0.12em]', className)}
    style={{
      fontFamily: typography.fontHeading,
      color: colors.primary,
      textShadow: glows.text,
    }}
    {...rest}
  />
);

export const CardSubtitle = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('text-sm', className)}
    style={{ color: colors.textSecondary }}
    {...rest}
  />
);

export const CardContent = ({ className, ...rest }: SectionProps) => (
  <div
    className={cn('flex flex-col gap-4 text-sm', className)}
    style={{ color: colors.textSecondary }}
    {...rest}
  />
);

export const CardFooter = ({ className, ...rest }: SectionProps) => (
  <div className={cn('mt-6 flex items-center justify-end gap-3', className)} {...rest} />
);
