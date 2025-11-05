import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBanner } from './example-component';

describe('HeroBanner', () => {
  it('renders CTA labels', () => {
    render(
      <HeroBanner
        title="Blacksider Insider"
        description="Cursos, ferramentas e campanhas em um só hub."
        primaryCta={{ label: 'Começar Agora', href: '/app' }}
        secondaryCta={{ label: 'Ver Cursos', href: '/academy' }}
      />,
    );

    expect(screen.getByText('Começar Agora')).toBeInTheDocument();
    expect(screen.getByText('Ver Cursos')).toBeInTheDocument();
  });
});
