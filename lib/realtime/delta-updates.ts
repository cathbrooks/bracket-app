import type { MatchRow, ReactionRow, BracketPredictionRow } from '@/lib/types/tournament.types';

/**
 * Apply a match INSERT to existing state.
 */
export function applyMatchInsert(
  state: MatchRow[],
  newMatch: MatchRow
): MatchRow[] {
  const exists = state.some((m) => m.id === newMatch.id);
  if (exists) return applyMatchUpdate(state, newMatch);
  return [...state, newMatch];
}

/**
 * Apply a match UPDATE to existing state.
 */
export function applyMatchUpdate(
  state: MatchRow[],
  updatedMatch: MatchRow
): MatchRow[] {
  return state.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
}

/**
 * Apply a match DELETE to existing state.
 */
export function applyMatchDelete(
  state: MatchRow[],
  matchId: string
): MatchRow[] {
  return state.filter((m) => m.id !== matchId);
}

/**
 * Apply a reaction INSERT/UPDATE to aggregated counts.
 */
export function applyReactionChange(
  counts: Record<string, number>,
  reaction: ReactionRow,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
): Record<string, number> {
  const next = { ...counts };

  if (eventType === 'INSERT') {
    next[reaction.emoji_type] = (next[reaction.emoji_type] ?? 0) + 1;
  } else if (eventType === 'DELETE') {
    next[reaction.emoji_type] = Math.max(
      (next[reaction.emoji_type] ?? 0) - 1,
      0
    );
  }

  return next;
}

/**
 * Apply a prediction UPDATE to the leaderboard state.
 */
export function applyPredictionUpdate(
  state: BracketPredictionRow[],
  updated: BracketPredictionRow
): BracketPredictionRow[] {
  const exists = state.some((p) => p.id === updated.id);
  if (!exists) return [...state, updated];
  return state.map((p) => (p.id === updated.id ? updated : p));
}

/**
 * Sort predictions by total_points descending, then correct_count descending.
 */
export function sortLeaderboard(
  predictions: BracketPredictionRow[]
): BracketPredictionRow[] {
  return [...predictions].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return b.correct_count - a.correct_count;
  });
}
