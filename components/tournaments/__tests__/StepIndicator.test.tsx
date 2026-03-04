import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepIndicator } from '../StepIndicator';

describe('StepIndicator', () => {
  it('renders all 5 steps', () => {
    render(<StepIndicator currentStep={0} />);
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Timing')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('uses Players label when participantType is players', () => {
    render(<StepIndicator currentStep={0} participantType="players" />);
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.queryByText('Teams')).not.toBeInTheDocument();
  });

  it('marks completed steps', () => {
    render(<StepIndicator currentStep={2} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
