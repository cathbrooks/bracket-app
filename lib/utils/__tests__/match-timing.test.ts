import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMatchTimingText, getMatchTimingDetails } from '../match-timing';
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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getMatchTimingText', () => {
  it('returns automatic advancement for byes', () => {
    expect(getMatchTimingText(makeMatch({ isBye: true }))).toBe('Automatic advancement');
  });

  it('returns completed text', () => {
    const text = getMatchTimingText(makeMatch({ state: 'completed', completedAt: '2025-06-15T11:55:00Z' }));
    expect(text).toContain('Completed');
  });

  it('returns in-progress text', () => {
    const text = getMatchTimingText(makeMatch({ state: 'in-progress', startedAt: '2025-06-15T11:50:00Z' }));
    expect(text).toContain('Started');
  });

  it('returns waiting for teams when both missing', () => {
    expect(getMatchTimingText(makeMatch({ teamAId: null, teamBId: null }))).toBe('Waiting for teams');
  });

  it('returns waiting for opponent when one missing', () => {
    expect(getMatchTimingText(makeMatch({ teamBId: null }))).toBe('Waiting for opponent');
  });

  it('returns ready to play when both present', () => {
    expect(getMatchTimingText(makeMatch())).toBe('Ready to play');
  });
});

describe('getMatchTimingDetails', () => {
  it('returns bye details', () => {
    const d = getMatchTimingDetails(makeMatch({ isBye: true }));
    expect(d.primary).toContain('Bye');
  });

  it('returns completed details with secondary', () => {
    const d = getMatchTimingDetails(makeMatch({
      state: 'completed',
      completedAt: '2025-06-15T11:55:00Z',
      startedAt: '2025-06-15T11:50:00Z',
    }));
    expect(d.primary).toContain('Completed');
    expect(d.secondary).toContain('Started');
  });

  it('returns in-progress details', () => {
    const d = getMatchTimingDetails(makeMatch({ state: 'in-progress', startedAt: '2025-06-15T11:50:00Z' }));
    expect(d.primary).toContain('Started');
  });

  it('returns waiting for previous matches', () => {
    const d = getMatchTimingDetails(makeMatch({ teamAId: null }));
    expect(d.primary).toBe('Waiting for previous matches');
  });

  it('returns ready to play', () => {
    const d = getMatchTimingDetails(makeMatch());
    expect(d.primary).toBe('Ready to play');
  });
});
