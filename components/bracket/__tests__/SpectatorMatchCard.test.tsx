import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpectatorMatchCard } from '../SpectatorMatchCard';
import type { Match, Team } from '@/lib/types/tournament.types';

vi.mock('@/hooks/useReactions', () => ({
  useReactions: () => ({
    counts: { fire: 0, trophy: 0, shocked: 0, sad: 0, clap: 0 },
    currentReaction: null,
    submitReaction: vi.fn(),
    isLoading: false,
    connectionState: 'connected',
  }),
}));

vi.mock('./AggregatePredictionCounts', () => ({
  AggregatePredictionCounts: () => null,
}));

const match: Match = {
  id: 'm1', tournamentId: 't1', round: 1, matchNumber: 1, bracketCategory: 'winners',
  teamAId: 'a', teamBId: 'b', winnerTeamId: null, winnerNextMatchId: null,
  loserNextMatchId: null, isBye: false, state: 'pending', startedAt: null,
  completedAt: null, createdAt: '2025-01-01', updatedAt: '2025-01-01',
};

const teamA: Team = {
  id: 'a', tournamentId: 't1', name: 'Alpha', seed: 1,
  timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '',
};

const teamB: Team = {
  id: 'b', tournamentId: 't1', name: 'Beta', seed: 2,
  timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '',
};

describe('SpectatorMatchCard', () => {
  it('renders match with teams and reactions', () => {
    render(
      <SpectatorMatchCard
        tournamentId="t1"
        match={match}
        teamA={teamA}
        teamB={teamB}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders bye match', () => {
    render(
      <SpectatorMatchCard
        tournamentId="t1"
        match={{ ...match, isBye: true }}
        teamA={teamA}
      />
    );
    expect(screen.getByText('Bye')).toBeInTheDocument();
  });
});
