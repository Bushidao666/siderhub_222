import type { PrismaClient } from '@prisma/client';
import type { HeroBanner } from '@shared/types/admin.types';
import type { UUID } from '@shared/types';
import type { BannerRepository, CreateBannerInput, UpdateBannerInput } from './BannerRepository';

function mapPrismaBanner(record: {
  id: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  primaryCtaExternal: boolean;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  secondaryCtaExternal: boolean | null;
  imageUrl: string;
  order: number;
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): HeroBanner {
  const hasSecondary = Boolean(record.secondaryCtaLabel && record.secondaryCtaHref);

  return {
    id: record.id as UUID,
    title: record.title,
    description: record.description,
    primaryCta: {
      label: record.primaryCtaLabel,
      href: record.primaryCtaHref,
      external: record.primaryCtaExternal,
    },
    secondaryCta: hasSecondary
      ? {
          label: record.secondaryCtaLabel as string,
          href: record.secondaryCtaHref as string,
          external: record.secondaryCtaExternal ?? false,
        }
      : null,
    imageUrl: record.imageUrl,
    order: record.order,
    status: record.status as HeroBanner['status'],
    startsAt: record.startsAt ? record.startsAt.toISOString() : null,
    endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    createdBy: record.createdById as UUID,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  } satisfies HeroBanner;
}

export class PrismaBannerRepository implements BannerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<HeroBanner[]> {
    const banners = await this.prisma.heroBanner.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return banners.map(mapPrismaBanner);
  }

  async create(input: CreateBannerInput): Promise<HeroBanner> {
    const banner = await this.prisma.heroBanner.create({
      data: {
        title: input.title,
        description: input.description,
        primaryCtaLabel: input.primaryCta.label,
        primaryCtaHref: input.primaryCta.href,
        primaryCtaExternal: input.primaryCta.external,
        secondaryCtaLabel: input.secondaryCta?.label ?? null,
        secondaryCtaHref: input.secondaryCta?.href ?? null,
        secondaryCtaExternal: input.secondaryCta?.external ?? null,
        imageUrl: input.imageUrl,
        order: input.order,
        status: input.status,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        createdById: input.createdBy,
      },
    });
    return mapPrismaBanner(banner);
  }

  async update(id: UUID, input: UpdateBannerInput): Promise<HeroBanner> {
    const banner = await this.prisma.heroBanner.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        primaryCtaLabel: input.primaryCta.label,
        primaryCtaHref: input.primaryCta.href,
        primaryCtaExternal: input.primaryCta.external,
        secondaryCtaLabel: input.secondaryCta?.label ?? null,
        secondaryCtaHref: input.secondaryCta?.href ?? null,
        secondaryCtaExternal: input.secondaryCta?.external ?? null,
        imageUrl: input.imageUrl,
        order: input.order ?? 0,
        status: input.status,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
      },
    });
    return mapPrismaBanner(banner);
  }

  async remove(id: UUID): Promise<void> {
    await this.prisma.heroBanner.delete({ where: { id } });
  }
}
