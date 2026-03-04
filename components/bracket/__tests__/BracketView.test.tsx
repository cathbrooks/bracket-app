import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BracketView } from '../BracketView';
import type { Tournament, Match, Team } from '@/lib/types/tournament.types';

vi.mock('../BracketTreeView', () => ({
  BracketTreeView: () => <div data-testid="tree-view">Tree View</div>,
}));

vi.mock('../MatchListView', () => ({
  MatchListView: () => <div data-testid="list-view">List View</div>,
}));

const tournament: Tournament = {
  id: 't1', name: 'Test', gameType: 'Chess', format: 'single-elimination',
  participantType: 'teams', teamCount: 4, stationCount: 1, timePerMatchMinutes: 10,
  seedingMode: 'manual', estimatedDurationMinutes: 30, rosterSize: null,
  joinCode: 'ABC123', state: 'in-progress', ownerId: 'u1',
  createdAt: '2025-01-01', updatedAt: '2025-01-01',
};

function makeMatch(id: string): Match {
  return {
    id, tournamentId: 't1', round: 1, matchNumber: 1, bracketCategory: 'winners',
    teamAId: 'a', teamBId: 'b', winnerTeamId: null, winnerNextMatchId: null,
    loserNextMatchId: null, isBye: false, state: 'pending', startedAt: null,
    completedAt: null, createdAt: '2025-01-01', updatedAt: '2025-01-01',
  };
}

describe('BracketView', () => {
  it('shows empty state when no matches', () => {
    render(<BracketView tournament={tournament} matches={[]} teams={[]} />);
    expect(screen.getByText('No matches generated yet.')).toBeInTheDocument();
  });

  it('renders a view when matches exist', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    window.dispatchEvent(new Event('resize'));

    render(
      <BracketView tournament={tournament} matches={[makeMatch('m1')]} teams={[]} />
    );
  });
});
