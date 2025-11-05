import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from 'src/frontend/components/common/Tabs';

const tabs = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Configurações', disabled: true },
];

describe('Tabs', () => {
  it('switches active tab when clicked and triggers onChange', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Tabs tabs={tabs} defaultValue="overview" onChange={handleChange} />);

    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    expect(analyticsTab).toHaveAttribute('aria-selected', 'false');

    await user.click(analyticsTab);

    expect(handleChange).toHaveBeenCalledWith('analytics');
    expect(analyticsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('does not allow selecting disabled tabs', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Tabs tabs={tabs} defaultValue="overview" onChange={handleChange} />);

    const disabledTab = screen.getByRole('tab', { name: /configurações/i });
    expect(disabledTab).toHaveAttribute('aria-disabled', 'true');

    await user.click(disabledTab);
    expect(handleChange).not.toHaveBeenCalled();
    expect(disabledTab).toHaveAttribute('aria-selected', 'false');
  });
});
