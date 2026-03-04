import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchCard } from '../MatchCard';
import type { Match, Team } from '@/lib/types/tournament.types';

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

const teamA: Team = {
  id: 'a', tournamentId: 't1', name: 'Team Alpha', seed: 1,
  timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '',
};
const teamB: Team = {
  id: 'b', tournamentId: 't1', name: 'Team Beta', seed: 2,
  timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '',
};

describe('MatchCard', () => {
  it('renders match number and team names', () => {
    render(<MatchCard match={makeMatch()} teamA={teamA} teamB={teamB} />);
    expect(screen.getByText('M1')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
  });

  it('shows TBD when no team data', () => {
    render(<MatchCard match={makeMatch({ teamAId: null, teamBId: null })} />);
    const tbds = screen.getAllByText('TBD');
    expect(tbds.length).toBeGreaterThanOrEqual(2);
  });

  it('marks winner with W indicator', () => {
    render(
      <MatchCard
        match={makeMatch({ state: 'completed', winnerTeamId: 'a' })}
        teamA={teamA}
        teamB={teamB}
      />
    );
    expect(screen.getByLabelText('Winner')).toBeInTheDocument();
  });

  it('shows Bye badge for bye matches', () => {
    render(<MatchCard match={makeMatch({ isBye: true })} />);
    expect(screen.getByText('Bye')).toBeInTheDocument();
  });

  it('handles onClick', () => {
    const onClick = vi.fn();
    render(<MatchCard match={makeMatch()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows Live badge for in-progress', () => {
    render(<MatchCard match={makeMatch({ state: 'in-progress' })} />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('renders seed numbers', () => {
    render(<MatchCard match={makeMatch()} teamA={teamA} teamB={teamB} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
