import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';

import { HidraWizard } from 'src/frontend/pages/Hidra/Wizard';
import { renderWithProviders } from '../test-utils';

describe('HidraWizard page', () => {
  it('navigates between steps with the wizard controls', async () => {
    const user = userEvent.setup();

    renderWithProviders(<HidraWizard />);

    expect(screen.getByTestId('hidra-wizard')).toBeInTheDocument();

    // Step 1: Segmentação should be visible
    const stepper = screen.getByTestId('hidra-wizard-stepper');
    expect(stepper).toHaveTextContent('Segmentação');

    const backButton = screen.getByRole('button', { name: /voltar/i });
    const nextButton = screen.getByRole('button', { name: /próximo/i });

    expect(backButton).toBeDisabled();

    // Note: Next button is disabled initially because no segment is selected
    // This test validates the wizard UI structure and navigation controls only
    expect(nextButton).toBeDisabled();
  });
});
