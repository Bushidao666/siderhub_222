import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from 'src/frontend/components/common/Badge';

const Icon = () => <span data-testid="badge-icon">★</span>;

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Disponível</Badge>);

    expect(screen.getByText(/disponível/i)).toBeInTheDocument();
  });

  it('renders icon when provided and marks as decorative', () => {
    render(<Badge icon={<Icon />}>Alerta</Badge>);

    const icon = screen.getByTestId('badge-icon');
    expect(icon).toBeInTheDocument();
    expect(icon.parentElement).toHaveAttribute('aria-hidden');
  });
});
