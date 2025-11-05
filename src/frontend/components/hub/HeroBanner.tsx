import type { CSSProperties } from 'react';
import { colors, gradients, typography } from '../../../shared/design/tokens';
import type { HeroBanner as HeroBannerModel } from '../../../shared/types/admin.types';
import { Badge, Button, Card, CardContent, CardSubtitle, CardTitle } from '../common';

type HeroBannerProps = {
  banner: HeroBannerModel;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
};

export const HERO_BANNER_TEST_IDS = {
  root: 'component-hero-banner',
  primaryCta: 'component-hero-banner-primary-cta',
  secondaryCta: 'component-hero-banner-secondary-cta',
} as const;

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const getStatusBadge = (status: HeroBannerModel['status'], startsAt: HeroBannerModel['startsAt']): string => {
  if (status === 'scheduled' && startsAt) {
    return 'Em breve';
  }
  if (status === 'inactive') {
    return 'Pausado';
  }
  return 'Ativo';
};

export const HeroBanner = ({ banner, onPrimaryClick, onSecondaryClick }: HeroBannerProps) => {
  const startsLabel = banner.startsAt ? dateFormatter.format(new Date(banner.startsAt)) : null;
  const endsLabel = banner.endsAt ? dateFormatter.format(new Date(banner.endsAt)) : null;
  const backgroundStyle: CSSProperties = banner.imageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.85) 100%), url(${banner.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: gradients.dark,
      };

  return (
    <Card
      data-testid={HERO_BANNER_TEST_IDS.root}
      className="relative overflow-hidden border-none px-10 py-12"
      variant="solid"
      glowing
      style={{
        ...backgroundStyle,
        color: colors.textPrimary,
      }}
    >
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-4">
          <Badge variant="outline">{getStatusBadge(banner.status, banner.startsAt)}</Badge>
          <CardTitle style={{ color: colors.primary }}>{banner.title}</CardTitle>
          <CardSubtitle style={{ color: colors.textSecondary }}>{banner.description}</CardSubtitle>
          <CardContent className="flex flex-wrap gap-4 text-base" style={{ color: colors.textSecondary }}>
            <p>{`Disponível até ${endsLabel ?? 'tempo indeterminado'}`}</p>
          </CardContent>
          <div className="flex flex-wrap gap-4">
            <Button data-testid={HERO_BANNER_TEST_IDS.primaryCta} onClick={onPrimaryClick}>
              {banner.primaryCta.label}
            </Button>
            {banner.secondaryCta ? (
              <Button data-testid={HERO_BANNER_TEST_IDS.secondaryCta} variant="secondary" onClick={onSecondaryClick}>
                {banner.secondaryCta.label}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right text-sm uppercase tracking-[0.16em]" style={{ fontFamily: typography.fontHeading }}>
          {startsLabel ? <span style={{ color: colors.textSecondary }}>Início: {startsLabel}</span> : null}
          {endsLabel ? <span style={{ color: colors.textSecondary }}>Fim: {endsLabel}</span> : null}
        </div>
      </div>
      <div
        className="absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background: gradients.neon,
        } as CSSProperties}
      />
    </Card>
  );
};
