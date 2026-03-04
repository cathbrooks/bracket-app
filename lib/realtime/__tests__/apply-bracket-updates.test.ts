import { describe, it, expect } from 'vitest';
import { applyBracketMatchUpdate, findDownstreamMatchIds } from '../apply-bracket-updates';
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

describe('applyBracketMatchUpdate', () => {
  it('updates an existing match in place', () => {
    const current = [makeMatch({ id: 'm1', state: 'pending' })];
    const updated = makeMatch({ id: 'm1', state: 'completed' });
    const result = applyBracketMatchUpdate(current, updated);
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe('completed');
  });

  it('appends a new match if not found', () => {
    const current = [makeMatch({ id: 'm1' })];
    const newMatch = makeMatch({ id: 'm2' });
    const result = applyBracketMatchUpdate(current, newMatch);
    expect(result).toHaveLength(2);
  });
});

describe('findDownstreamMatchIds', () => {
  it('returns empty for unknown match', () => {
    expect(findDownstreamMatchIds('unknown', [])).toEqual([]);
  });

  it('finds downstream winner path', () => {
    const matches = [
      makeMatch({ id: 'm1', winnerNextMatchId: 'm3' }),
      makeMatch({ id: 'm2', winnerNextMatchId: 'm3' }),
      makeMatch({ id: 'm3', winnerNextMatchId: null }),
    ];
    const result = findDownstreamMatchIds('m1', matches);
    expect(result).toContain('m3');
  });

  it('finds both winner and loser paths', () => {
    const matches = [
      makeMatch({ id: 'm1', winnerNextMatchId: 'm2', loserNextMatchId: 'm3' }),
      makeMatch({ id: 'm2' }),
      makeMatch({ id: 'm3' }),
    ];
    const result = findDownstreamMatchIds('m1', matches);
    expect(result).toContain('m2');
    expect(result).toContain('m3');
  });

  it('handles chains without infinite loops', () => {
    const matches = [
      makeMatch({ id: 'm1', winnerNextMatchId: 'm2' }),
      makeMatch({ id: 'm2', winnerNextMatchId: 'm3' }),
      makeMatch({ id: 'm3' }),
    ];
    const result = findDownstreamMatchIds('m1', matches);
    expect(result).toEqual(['m2', 'm3']);
  });
});
