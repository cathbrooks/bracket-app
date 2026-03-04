import { describe, it, expect } from 'vitest';
import {
  groupByRound,
  groupByBracketCategory,
  getRoundName,
  calculateMatchPositions,
  MATCH_WIDTH,
  MATCH_HEIGHT,
  ROUND_GAP,
} from '../bracket-layout';
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

describe('groupByRound', () => {
  it('groups matches by round number', () => {
    const matches = [
      makeMatch({ id: 'm1', round: 1, matchNumber: 1 }),
      makeMatch({ id: 'm2', round: 1, matchNumber: 2 }),
      makeMatch({ id: 'm3', round: 2, matchNumber: 3 }),
    ];
    const groups = groupByRound(matches);
    expect(groups).toHaveLength(2);
    expect(groups[0].round).toBe(1);
    expect(groups[0].matches).toHaveLength(2);
    expect(groups[1].round).toBe(2);
    expect(groups[1].matches).toHaveLength(1);
  });

  it('sorts matches within round by matchNumber', () => {
    const matches = [
      makeMatch({ id: 'm2', round: 1, matchNumber: 2 }),
      makeMatch({ id: 'm1', round: 1, matchNumber: 1 }),
    ];
    const groups = groupByRound(matches);
    expect(groups[0].matches[0].id).toBe('m1');
  });
});

describe('groupByBracketCategory', () => {
  it('groups by category in correct order', () => {
    const matches = [
      makeMatch({ id: 'm1', bracketCategory: 'losers', round: 3 }),
      makeMatch({ id: 'm2', bracketCategory: 'winners', round: 1 }),
      makeMatch({ id: 'm3', bracketCategory: 'grand-finals', round: 5 }),
    ];
    const groups = groupByBracketCategory(matches);
    expect(groups[0].category).toBe('winners');
    expect(groups[1].category).toBe('losers');
    expect(groups[2].category).toBe('grand-finals');
  });

  it('handles null category', () => {
    const matches = [makeMatch({ bracketCategory: null })];
    const groups = groupByBracketCategory(matches);
    expect(groups[0].label).toBe('Bracket');
  });
});

describe('getRoundName', () => {
  it('returns Finals for last round', () => {
    expect(getRoundName(3, 3, 1)).toBe('Finals');
  });

  it('returns Semifinals for penultimate round with 2 or fewer matches', () => {
    expect(getRoundName(2, 3, 2)).toBe('Semifinals');
  });

  it('returns Quarterfinals when appropriate', () => {
    expect(getRoundName(1, 3, 4)).toBe('Quarterfinals');
  });

  it('returns Round N for early rounds', () => {
    expect(getRoundName(1, 5, 8)).toBe('Round 1');
  });
});

describe('calculateMatchPositions', () => {
  it('returns positions for all matches', () => {
    const rounds = groupByRound([
      makeMatch({ id: 'm1', round: 1, matchNumber: 1 }),
      makeMatch({ id: 'm2', round: 1, matchNumber: 2 }),
      makeMatch({ id: 'm3', round: 2, matchNumber: 3 }),
    ]);
    const positions = calculateMatchPositions(rounds);
    expect(positions.size).toBe(3);
    expect(positions.get('m1')!.x).toBe(0);
    expect(positions.get('m3')!.x).toBe(MATCH_WIDTH + ROUND_GAP);
  });

  it('positions first round at x=0', () => {
    const rounds = groupByRound([makeMatch({ id: 'm1', round: 1, matchNumber: 1 })]);
    const positions = calculateMatchPositions(rounds);
    expect(positions.get('m1')!.x).toBe(0);
  });

  it('uses provided match height', () => {
    const rounds = groupByRound([makeMatch({ id: 'm1', round: 1, matchNumber: 1 })]);
    const positions = calculateMatchPositions(rounds, 100);
    expect(positions.get('m1')!.height).toBe(100);
  });
});
