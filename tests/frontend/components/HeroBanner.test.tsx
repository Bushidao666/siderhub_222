import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HeroBanner as HeroBannerModel } from '@shared/types';
import { BannerStatus } from '@shared/types';
import { HeroBanner } from 'src/frontend/components/hub/HeroBanner';

const createBanner = (overrides: Partial<HeroBannerModel> = {}): HeroBannerModel => ({
  id: overrides.id ?? 'banner-1',
  title: overrides.title ?? 'Novo curso disponível',
  description: overrides.description ?? 'Explore a aula inaugural com ferramentas práticas.',
  primaryCta: overrides.primaryCta ?? { label: 'Quero ver', href: '/academy', external: false },
  secondaryCta: overrides.secondaryCta ?? { label: 'Ver detalhes', href: '/admin/banners', external: false },
  imageUrl: overrides.imageUrl ?? '',
  order: overrides.order ?? 1,
  status: overrides.status ?? BannerStatus.Scheduled,
  startsAt: overrides.startsAt ?? new Date('2025-12-01T10:00:00Z').toISOString(),
  endsAt: overrides.endsAt ?? new Date('2025-12-31T23:59:00Z').toISOString(),
  createdBy: overrides.createdBy ?? 'admin-1',
  createdAt: overrides.createdAt ?? new Date('2025-11-01T10:00:00Z').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2025-11-01T10:00:00Z').toISOString(),
});

describe('HeroBanner', () => {
  it('renders title, description and CTA buttons', async () => {
    const user = userEvent.setup();
    const onPrimaryClick = vi.fn();
    const onSecondaryClick = vi.fn();

    render(
      <HeroBanner banner={createBanner()} onPrimaryClick={onPrimaryClick} onSecondaryClick={onSecondaryClick} />
    );

    expect(screen.getByRole('heading', { name: /novo curso disponível/i })).toBeInTheDocument();
    expect(
      screen.getByText(/explore a aula inaugural com ferramentas práticas\./i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /quero ver/i }));
    await user.click(screen.getByRole('button', { name: /ver detalhes/i }));

    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
    expect(onSecondaryClick).toHaveBeenCalledTimes(1);
  });

  it('shows scheduled badge when banner is scheduled', () => {
    render(<HeroBanner banner={createBanner({ status: BannerStatus.Scheduled })} />);

    expect(screen.getByText(/em breve/i)).toBeInTheDocument();
  });
});
