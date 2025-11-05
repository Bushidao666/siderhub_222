import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from 'src/frontend/components/common/ProgressBar';

describe('ProgressBar', () => {
  it('renders label and clamps percentage', () => {
    render(<ProgressBar value={150} max={120} label="Progresso" />);

    expect(screen.getByText(/progresso/i)).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<ProgressBar value={60} max={100} label="Progresso" showLabel={false} />);

    expect(screen.getByText(/progresso/i)).toBeInTheDocument();
    expect(screen.queryByText(/60%/)).not.toBeInTheDocument();
  });
});
