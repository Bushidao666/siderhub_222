import type { ReactNode } from 'react';
import { FeatureAccessKey } from '../../../shared/types/common.types';
import type { MemberAccessMap } from '../../../shared/types/auth.types';
import { colors, glows, typography } from '../../../shared/design/tokens';
import { Badge, Button, Card, CardContent, CardSubtitle, CardTitle } from '../common';

export type SaaSCarouselStatus = 'active' | 'locked' | 'new' | 'maintenance';

export interface SaaSCarouselItem extends MemberAccessMap {
  feature: FeatureAccessKey;
  title: string;
  description: string;
  icon: ReactNode;
  status: SaaSCarouselStatus;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

type SaaSCarouselProps = {
  items: SaaSCarouselItem[];
};

const statusBadge: Record<SaaSCarouselStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'outline' | 'default' }> = {
  active: { label: 'Ativo', variant: 'success' },
  locked: { label: 'Bloqueado', variant: 'error' },
  new: { label: 'Novo', variant: 'outline' },
  maintenance: { label: 'Manutenção', variant: 'warning' },
};

export const SaaSCarousel = ({ items }: SaaSCarouselProps) => {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-4" aria-label="Aplicativos disponíveis" data-testid="hub-saas-carousel">
      <header className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl uppercase tracking-[0.16em]"
            style={{
              fontFamily: typography.fontHeading,
              color: colors.primary,
              textShadow: glows.text,
            }}
          >
            SaaS Blacksider
          </h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Aplicativos conectados à sua membresia.
          </p>
        </div>
      </header>
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4" role="list">
          {items.map((item) => {
            const badge = statusBadge[item.status];
            return (
              <Card key={item.feature} className="min-w-[18rem] flex-1" role="listitem" data-status={item.status}>
                <CardHeaderContent item={item} badgeLabel={badge.label} badgeVariant={badge.variant} />
              </Card>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[rgba(10,10,10,1)] to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[rgba(10,10,10,1)] to-transparent" aria-hidden />
      </div>
    </section>
  );
};

type CardHeaderContentProps = {
  item: SaaSCarouselItem;
  badgeLabel: string;
  badgeVariant: Parameters<typeof Badge>[0]['variant'];
};

const CardHeaderContent = ({ item, badgeLabel, badgeVariant }: CardHeaderContentProps) => {
  const isLocked = !item.enabled || item.status === 'locked';
  const isActive = item.enabled && item.status === 'active';
  const isNew = item.status === 'new';

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-2xl" style={{ color: colors.primary }}>
          <span aria-hidden>{item.icon}</span>
          <CardTitle className="text-xl" style={{ color: colors.primary }}>
            {item.title}
          </CardTitle>
        </div>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </div>
      <CardContent style={{ color: colors.textSecondary }}>{item.description}</CardContent>
        <CardSubtitle style={{ color: colors.textSecondary }}>
          {isActive ? 'Permissões ativas' : isNew ? 'Convide a equipe para testar este SaaS recém-chegado' : 'Ajuste as permissões para liberar este SaaS'}
        </CardSubtitle>
      <div className="mt-auto flex flex-wrap gap-3">
        <Button
          variant={isActive ? 'secondary' : 'primary'}
          onClick={item.onCtaClick}
          disabled={isLocked && !item.onCtaClick}
          aria-disabled={isLocked && !item.onCtaClick ? true : undefined}
          aria-label={
            item.ctaLabel
              ? `${item.title} · ${item.ctaLabel}`
              : isActive
                ? `Abrir ${item.title}`
                : `Ativar acesso ao ${item.title}`
          }
          data-testid={
            item.feature === FeatureAccessKey.Cybervault
              ? 'nav-cybervault'
              : item.feature === FeatureAccessKey.Hidra
                ? 'nav-hidra'
                : undefined
          }
        >
          {item.ctaLabel ?? (isActive ? 'Abrir' : 'Ativar acesso')}
        </Button>
        {item.ctaHref ? (
          <a
            href={item.ctaHref}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em]"
            style={{
              color: colors.primary,
              fontFamily: typography.fontHeading,
            }}
          >
            Saiba mais →
          </a>
        ) : null}
      </div>
    </div>
  );
};
