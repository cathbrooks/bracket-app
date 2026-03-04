import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentSetupWizard } from '../TournamentSetupWizard';

vi.mock('../steps/BasicInfoStep', () => ({
  BasicInfoStep: ({ onValidChange }: { onValidChange: (v: boolean) => void }) => {
    onValidChange(true);
    return <div data-testid="basic-info">Basic Info Step</div>;
  },
}));

vi.mock('../steps/FormatSelectionStep', () => ({
  FormatSelectionStep: ({ onValidChange }: { onValidChange: (v: boolean) => void }) => {
    onValidChange(true);
    return <div data-testid="format-step">Format Step</div>;
  },
}));

vi.mock('../steps/TeamConfigurationStep', () => ({
  TeamConfigurationStep: ({ onValidChange }: { onValidChange: (v: boolean) => void }) => {
    onValidChange(true);
    return <div data-testid="team-step">Team Config Step</div>;
  },
}));

vi.mock('../steps/TimingConfigurationStep', () => ({
  TimingConfigurationStep: ({ onValidChange }: { onValidChange: (v: boolean) => void }) => {
    onValidChange(true);
    return <div data-testid="timing-step">Timing Step</div>;
  },
}));

vi.mock('../steps/ReviewStep', () => ({
  ReviewStep: () => <div data-testid="review-step">Review Step</div>,
}));

describe('TournamentSetupWizard', () => {
  it('renders the first step by default', () => {
    render(<TournamentSetupWizard />);
    expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  it('navigates to next step', () => {
    render(<TournamentSetupWizard />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('format-step')).toBeInTheDocument();
  });

  it('navigates back', () => {
    render(<TournamentSetupWizard />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('basic-info')).toBeInTheDocument();
  });

  it('shows Create Tournament on last step', () => {
    render(<TournamentSetupWizard />);
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Next'));
    }
    expect(screen.getByTestId('review-step')).toBeInTheDocument();
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
  });
});
