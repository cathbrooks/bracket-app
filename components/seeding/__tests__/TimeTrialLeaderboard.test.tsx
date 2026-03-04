import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeTrialLeaderboard } from '../TimeTrialLeaderboard';

describe('TimeTrialLeaderboard', () => {
  it('renders leaderboard entries', () => {
    const entries = [
      { teamId: 'a', name: 'Alpha', seed: 1, timeCentiseconds: 5000, isTied: false },
      { teamId: 'b', name: 'Beta', seed: 2, timeCentiseconds: 6000, isTied: false },
    ];
    render(
      <TimeTrialLeaderboard
        entries={entries}
        onEditTimes={vi.fn()}
        onConfirmSeeds={vi.fn()}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <TimeTrialLeaderboard
        entries={[]}
        onEditTimes={vi.fn()}
        onConfirmSeeds={vi.fn()}
      />
    );
    expect(screen.getByText('Edit Times')).toBeInTheDocument();
    expect(screen.getByText('Confirm Seeds')).toBeInTheDocument();
  });
});
