import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Input } from 'src/frontend/components/common/Input';

describe('Input', () => {
  it('renders label, description and handles typing', async () => {
    const user = userEvent.setup();

    render(
      <Input
        label="Email"
        description="Use seu email corporativo"
        placeholder="email@example.com"
        leftIcon={<span data-testid="left-icon">@</span>}
      />,
    );

    const input = screen.getByLabelText(/email/i);
    expect(screen.getByText(/Use seu email corporativo/i)).toBeInTheDocument();
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();

    await user.type(input, 'member@example.com');
    expect(input).toHaveValue('member@example.com');
  });

  it('shows error message when provided', () => {
    render(<Input label="Senha" error="Senha inválida" />);

    expect(screen.getByText(/senha inválida/i)).toBeInTheDocument();
  });
});
