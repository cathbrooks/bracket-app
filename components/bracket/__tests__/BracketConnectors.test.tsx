import { describe, it, expect } from 'vitest';
import { render, container } from '@testing-library/react';
import { BracketConnectors } from '../BracketConnectors';
import type { Match } from '@/lib/types/tournament.types';
import type { MatchPosition } from '@/lib/utils/bracket-layout';

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

describe('BracketConnectors', () => {
  it('returns null when no connections', () => {
    const { container } = render(
      <BracketConnectors matches={[makeMatch()]} positions={new Map()} />
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders SVG paths for connected matches', () => {
    const matches = [
      makeMatch({ id: 'm1', winnerNextMatchId: 'm2' }),
      makeMatch({ id: 'm2' }),
    ];
    const positions = new Map<string, MatchPosition>([
      ['m1', { x: 0, y: 0, width: 220, height: 72 }],
      ['m2', { x: 280, y: 0, width: 220, height: 72 }],
    ]);

    const { container } = render(
      <BracketConnectors matches={matches} positions={positions} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });
});
