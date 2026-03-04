import { describe, it, expect } from 'vitest';
import { getMatchDisplayState, getMatchStateStyles, getMatchStateLabel } from '../match-state';
import type { Match } from '@/lib/types/tournament.types';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: '1',
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

describe('getMatchDisplayState', () => {
  it('returns bye for bye matches', () => {
    expect(getMatchDisplayState(makeMatch({ isBye: true }))).toBe('bye');
  });

  it('returns the match state for non-bye matches', () => {
    expect(getMatchDisplayState(makeMatch({ state: 'pending' }))).toBe('pending');
    expect(getMatchDisplayState(makeMatch({ state: 'in-progress' }))).toBe('in-progress');
    expect(getMatchDisplayState(makeMatch({ state: 'completed' }))).toBe('completed');
  });
});

describe('getMatchStateStyles', () => {
  it('returns styles for each state', () => {
    for (const state of ['pending', 'in-progress', 'completed', 'bye'] as const) {
      const styles = getMatchStateStyles(state);
      expect(styles).toHaveProperty('card');
      expect(styles).toHaveProperty('border');
      expect(styles).toHaveProperty('label');
    }
  });

  it('in-progress includes ring styling', () => {
    expect(getMatchStateStyles('in-progress').card).toContain('ring');
  });
});

describe('getMatchStateLabel', () => {
  it('returns human labels', () => {
    expect(getMatchStateLabel('pending')).toBe('Upcoming');
    expect(getMatchStateLabel('in-progress')).toBe('Live');
    expect(getMatchStateLabel('completed')).toBe('Completed');
    expect(getMatchStateLabel('skipped')).toBe('Skipped');
    expect(getMatchStateLabel('bye')).toBe('Bye');
  });

  it('returns input for unknown state', () => {
    expect(getMatchStateLabel('unknown' as never)).toBe('unknown');
  });
});
