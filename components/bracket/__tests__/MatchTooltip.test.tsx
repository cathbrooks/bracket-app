import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchTooltip } from '../MatchTooltip';
import type { Match } from '@/lib/types/tournament.types';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    tournamentId: 't1',
    round: 1,
    matchNumber: 1,
    bracketCategory: 'winners',
    teamAId: 'a',
    teamBId: 'b',
    winnerTeamId: null,
    winnerNextMatchId: null,
    loserNextMatchId: null,
    isBye: false,
    state: 'pending',
    startedAt: null,
    completedAt: null,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    ...overrides,
  };
}

describe('MatchTooltip', () => {
  it('renders children', () => {
    render(
      <MatchTooltip match={makeMatch()}>
        <span>Child content</span>
      </MatchTooltip>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    render(
      <MatchTooltip match={makeMatch()}>
        <span>Hover me</span>
      </MatchTooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(
      <MatchTooltip match={makeMatch()}>
        <span>Hover me</span>
      </MatchTooltip>
    );
    const wrapper = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
