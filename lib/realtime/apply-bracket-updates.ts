import type { Match } from '@/lib/types/tournament.types';

/**
 * Apply a match update to the current matches array.
 * Returns a new array with the updated match replaced in-place.
 */
export function applyBracketMatchUpdate(
  currentMatches: Match[],
  updatedMatch: Match
): Match[] {
  const idx = currentMatches.findIndex((m) => m.id === updatedMatch.id);
  if (idx === -1) {
    return [...currentMatches, updatedMatch];
  }
  const next = [...currentMatches];
  next[idx] = updatedMatch;
  return next;
}

/**
 * Find matches downstream of a given match (winner path + loser path).
 */
export function findDownstreamMatchIds(
  matchId: string,
  matches: Match[]
): string[] {
  const ids = new Set<string>();
  const match = matches.find((m) => m.id === matchId);
  if (!match) return [];

  const queue = [match.winnerNextMatchId, match.loserNextMatchId].filter(
    (id): id is string => id !== null
  );

  while (queue.length > 0) {
    const nextId = queue.shift()!;
    if (ids.has(nextId)) continue;
    ids.add(nextId);
    const nextMatch = matches.find((m) => m.id === nextId);
    if (nextMatch) {
      if (nextMatch.winnerNextMatchId) queue.push(nextMatch.winnerNextMatchId);
      if (nextMatch.loserNextMatchId) queue.push(nextMatch.loserNextMatchId);
    }
  }

  return Array.from(ids);
}
