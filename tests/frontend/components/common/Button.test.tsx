import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from 'src/frontend/components/common/Button';

describe('Button', () => {
  it('renders label and icons, triggers onClick', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button
        variant="secondary"
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
        onClick={handleClick}
      >
        Acessar
      </Button>,
    );

    const button = screen.getByRole('button', { name: /acessar/i });
    expect(button).toBeEnabled();
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables button', () => {
    render(
      <Button loading data-testid="loading-button">
        Processando
      </Button>,
    );

    const button = screen.getByTestId('loading-button');
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeTruthy();
  });
});
