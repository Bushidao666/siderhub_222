import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Card, CardContent, CardHeader, CardTitle } from 'src/frontend/components/common/Card';

describe('Card', () => {
  it('applies variant styles and renders sections', () => {
    render(
      <Card variant="glass" glowing data-testid="card">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Detalhes da campanha</p>
        </CardContent>
      </Card>,
    );

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card.style.background).toBeTruthy();
    expect(screen.getByRole('heading', { name: /resumo/i })).toBeInTheDocument();
    expect(screen.getByText(/detalhes da campanha/i)).toBeInTheDocument();
  });
});

