import { MAX_TEAM_NAME_LENGTH } from '@/lib/constants';

/**
 * Generate default team names for a given count.
 * Returns ["Team 1", "Team 2", ...].
 */
export function generateDefaultTeamNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
}

/**
 * Sanitize a team name: trim whitespace, collapse internal spaces, enforce max length.
 */
export function sanitizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, MAX_TEAM_NAME_LENGTH);
}

/**
 * Find indices of duplicate team names (case-insensitive).
 * Returns array of indices that are duplicates of earlier entries.
 */
export function findDuplicateIndices(names: string[]): number[] {
  const seen = new Map<string, number>();
  const duplicates: number[] = [];

  for (let i = 0; i < names.length; i++) {
    const normalized = names[i].trim().toLowerCase();
    if (!normalized) continue;

    if (seen.has(normalized)) {
      duplicates.push(i);
      const firstIdx = seen.get(normalized)!;
      if (!duplicates.includes(firstIdx)) {
        duplicates.push(firstIdx);
      }
    } else {
      seen.set(normalized, i);
    }
  }

  return duplicates.sort((a, b) => a - b);
}

/**
 * Find duplicate team name strings (case-insensitive).
 * Returns array of duplicate name values.
 */
export function findDuplicateNames(names: string[]): string[] {
  const filled = names.filter((n) => n.trim().length > 0);
  const counts = new Map<string, number>();

  for (const name of filled) {
    const key = name.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return filled.filter((name) => {
    const key = name.trim().toLowerCase();
    return (counts.get(key) ?? 0) > 1;
  }).filter((name, i, arr) =>
    arr.findIndex((n) => n.trim().toLowerCase() === name.trim().toLowerCase()) === i
  );
}

/**
 * Apply default names to empty entries, preserving user-provided names.
 */
export function applyDefaultNames(names: string[], count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const provided = names[i]?.trim();
    return provided || `Team ${i + 1}`;
  });
}
