import type { CSSProperties, FC } from 'react';
import { colors, glows, typography } from '../src/shared/design/tokens';

type HeroBannerProps = {
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  backgroundImage?: string;
};

export const HeroBanner: FC<HeroBannerProps> = ({
  title,
  description,
  primaryCta,
  secondaryCta,
  backgroundImage,
}: HeroBannerProps) => {
  return (
    <section
      className="relative flex flex-col gap-6 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-10 shadow-[var(--shadow-lg)]"
      style={{
        '--color-border-primary': colors.borderPrimary,
        '--color-bg-secondary': colors.bgSecondary,
        '--shadow-lg': glows.lg,
      } as CSSProperties}
    >
      {backgroundImage ? (
        <div className="absolute inset-0 opacity-20">
          <img src={backgroundImage} alt="banner" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="relative z-10 max-w-2xl">
        <h1
          className="text-4xl uppercase"
          style={{
            fontFamily: typography.fontHeading,
            color: colors.primary,
            textShadow: glows.text,
          }}
        >
          {title}
        </h1>
        <p
          className="text-lg text-[var(--color-text-secondary)]"
          style={{ '--color-text-secondary': colors.textSecondary } as CSSProperties}
        >
          {description}
        </p>
      </div>
      <div className="relative z-10 flex flex-wrap gap-4">
        <a
          href={primaryCta.href}
          className="btn-primary"
          style={{
            borderColor: colors.primary,
            color: colors.primary,
            boxShadow: glows.sm,
          }}
        >
          {primaryCta.label}
        </a>
        {secondaryCta ? (
          <a
            href={secondaryCta.href}
            className="btn-secondary"
            style={{
              color: colors.textPrimary,
              background: colors.bgPrimary,
            }}
          >
            {secondaryCta.label}
          </a>
        ) : null}
      </div>
    </section>
  );
};

export default HeroBanner;
