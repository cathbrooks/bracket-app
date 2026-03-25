import { describe, it, expect } from 'vitest';
import {
  applyMatchInsert,
  applyMatchUpdate,
  applyMatchDelete,
  applyReactionChange,
  applyPredictionUpdate,
  sortLeaderboard,
} from '../delta-updates';
import type { MatchRow, ReactionRow, BracketPredictionRow } from '@/lib/types/tournament.types';

const matchRow: MatchRow = {
  id: 'm1',
  tournament_id: 't1',
  round: 1,
  match_number: 1,
  bracket_category: 'winners',
  team_a_id: 'a',
  team_b_id: 'b',
  winner_team_id: null,
  winner_next_match_id: null,
  loser_next_match_id: null,
  is_bye: false,
  state: 'pending',
  started_at: null,
  completed_at: null,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
};

describe('applyMatchInsert', () => {
  it('adds a new match', () => {
    const result = applyMatchInsert([], matchRow);
    expect(result).toHaveLength(1);
  });

  it('updates if match already exists', () => {
    const updated = { ...matchRow, state: 'completed' as const };
    const result = applyMatchInsert([matchRow], updated);
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe('completed');
  });
});

describe('applyMatchUpdate', () => {
  it('replaces matching match', () => {
    const updated = { ...matchRow, state: 'in-progress' as const };
    const result = applyMatchUpdate([matchRow], updated);
    expect(result[0].state).toBe('in-progress');
  });

  it('leaves non-matching matches alone', () => {
    const other = { ...matchRow, id: 'm2' };
    const result = applyMatchUpdate([other], matchRow);
    expect(result[0].id).toBe('m2');
  });
});

describe('applyMatchDelete', () => {
  it('removes the match', () => {
    const result = applyMatchDelete([matchRow], 'm1');
    expect(result).toHaveLength(0);
  });

  it('does nothing if not found', () => {
    const result = applyMatchDelete([matchRow], 'unknown');
    expect(result).toHaveLength(1);
  });
});

describe('applyReactionChange', () => {
  it('increments on INSERT', () => {
    const counts = { fire: 0, trophy: 1 };
    const reaction = { emoji_type: 'fire' } as ReactionRow;
    const result = applyReactionChange(counts, reaction, 'INSERT');
    expect(result.fire).toBe(1);
  });

  it('decrements on DELETE without going below 0', () => {
    const counts = { fire: 0 };
    const reaction = { emoji_type: 'fire' } as ReactionRow;
    const result = applyReactionChange(counts, reaction, 'DELETE');
    expect(result.fire).toBe(0);
  });

  it('does not change on UPDATE', () => {
    const counts = { fire: 5 };
    const reaction = { emoji_type: 'fire' } as ReactionRow;
    const result = applyReactionChange(counts, reaction, 'UPDATE');
    expect(result.fire).toBe(5);
  });
});

describe('applyPredictionUpdate', () => {
  const pred: BracketPredictionRow = {
    id: 'p1',
    tournament_id: 't1',
    session_id: 's1',
    display_name: 'User1',
    predictions: {},
    total_points: 0,
    correct_count: 0,
    submitted_at: '2025-01-01',
    updated_at: '2025-01-01',
  };

  it('adds new prediction', () => {
    const result = applyPredictionUpdate([], pred);
    expect(result).toHaveLength(1);
  });

  it('updates existing prediction', () => {
    const updated = { ...pred, total_points: 10 };
    const result = applyPredictionUpdate([pred], updated);
    expect(result).toHaveLength(1);
    expect(result[0].total_points).toBe(10);
  });
});

describe('sortLeaderboard', () => {
  const mkPred = (id: string, points: number, correct: number): BracketPredictionRow => ({
    id,
    tournament_id: 't1',
    session_id: 's1',
    display_name: id,
    predictions: {},
    total_points: points,
    correct_count: correct,
    submitted_at: '2025-01-01',
    updated_at: '2025-01-01',
  });

  it('sorts by total_points descending', () => {
    const result = sortLeaderboard([mkPred('a', 5, 2), mkPred('b', 10, 1)]);
    expect(result[0].id).toBe('b');
  });

  it('breaks ties by correct_count descending', () => {
    const result = sortLeaderboard([mkPred('a', 10, 2), mkPred('b', 10, 5)]);
    expect(result[0].id).toBe('b');
  });

  it('does not mutate original array', () => {
    const original = [mkPred('a', 5, 2), mkPred('b', 10, 1)];
    const copy = [...original];
    sortLeaderboard(original);
    expect(original[0].id).toBe(copy[0].id);
  });
});
