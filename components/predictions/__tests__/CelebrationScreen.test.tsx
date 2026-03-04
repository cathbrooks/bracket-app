import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CelebrationScreen } from '../CelebrationScreen';

describe('CelebrationScreen', () => {
  it('renders tournament champion', () => {
    render(
      <CelebrationScreen
        tournamentName="Grand Slam"
        winnerTeamName="Team Alpha"
        predictionWinner={null}
      />
    );
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
  });

  it('renders prediction winner when provided', () => {
    render(
      <CelebrationScreen
        tournamentName="Grand Slam"
        winnerTeamName="Team Alpha"
        predictionWinner={{
          displayName: 'Oracle',
          totalPoints: 15,
          correctCount: 5,
        }}
      />
    );
    expect(screen.getByText('Oracle')).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });
});
