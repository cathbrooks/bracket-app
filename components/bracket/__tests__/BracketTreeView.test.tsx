import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BracketTreeView } from '../BracketTreeView';
import type { Tournament, Match, Team } from '@/lib/types/tournament.types';

vi.mock('../SpectatorMatchCard', () => ({
  SpectatorMatchCard: ({ match }: { match: Match }) => (
    <div data-testid={`match-${match.id}`}>Match {match.matchNumber}</div>
  ),
}));

vi.mock('../BracketConnectors', () => ({
  BracketConnectors: () => null,
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

describe('BracketTreeView', () => {
  it('renders single-elimination bracket', () => {
    const matches = [
      makeMatch('m1', 1, 1),
      makeMatch('m2', 1, 2),
      makeMatch('m3', 2, 3),
    ];
    render(
      <BracketTreeView tournament={tournament} matches={matches} teams={[]} />
    );
    expect(screen.getByTestId('match-m1')).toBeInTheDocument();
  });

  it('renders double-elimination with category labels', () => {
    const deTourn = { ...tournament, format: 'double-elimination' as const };
    const matches = [
      makeMatch('m1', 1, 1),
      { ...makeMatch('m2', 3, 2), bracketCategory: 'losers' as const },
      { ...makeMatch('m3', 5, 3), bracketCategory: 'grand-finals' as const },
    ];
    render(
      <BracketTreeView tournament={deTourn} matches={matches} teams={[]} />
    );
    expect(screen.getByText('Winners Bracket')).toBeInTheDocument();
    expect(screen.getByText('Losers Bracket')).toBeInTheDocument();
    expect(screen.getByText('Grand Finals')).toBeInTheDocument();
  });
});
