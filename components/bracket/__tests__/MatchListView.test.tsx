import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchListView } from '../MatchListView';
import type { Tournament, Match, Team } from '@/lib/types/tournament.types';

vi.mock('../SpectatorMatchCard', () => ({
  SpectatorMatchCard: ({ match }: { match: Match }) => (
    <div data-testid={`match-${match.id}`}>Match {match.matchNumber}</div>
  ),
}));

const tournament: Tournament = {
  id: 't1', name: 'Test', gameType: 'Chess', format: 'single-elimination',
  participantType: 'teams', teamCount: 4, stationCount: 1, timePerMatchMinutes: 10,
  seedingMode: 'manual', estimatedDurationMinutes: 30, rosterSize: null,
  joinCode: 'ABC123', state: 'in-progress', ownerId: 'u1',
  createdAt: '2025-01-01', updatedAt: '2025-01-01',
};

function makeMatch(id: string, round: number, matchNumber: number): Match {
  return {
    id, tournamentId: 't1', round, matchNumber, bracketCategory: 'winners',
    teamAId: 'a', teamBId: 'b', winnerTeamId: null, winnerNextMatchId: null,
    loserNextMatchId: null, isBye: false, state: 'pending', startedAt: null,
    completedAt: null, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  };
}

describe('MatchListView', () => {
  it('renders rounds and matches', () => {
    const matches = [
      makeMatch('m1', 1, 1),
      makeMatch('m2', 1, 2),
      makeMatch('m3', 2, 3),
    ];
    render(
      <MatchListView tournament={tournament} matches={matches} teams={[]} />
    );
    expect(screen.getByTestId('match-m1')).toBeInTheDocument();
    expect(screen.getByTestId('match-m2')).toBeInTheDocument();
    expect(screen.getByTestId('match-m3')).toBeInTheDocument();
  });
});
