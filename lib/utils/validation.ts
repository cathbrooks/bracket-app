import { JOIN_CODE_LENGTH, MAX_TEAM_NAME_LENGTH } from '@/lib/constants';

/**
 * Check if a number is a power of two (useful for bracket sizing).
 */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Calculate the next power of two >= n.
 */
export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

/**
 * Calculate the number of byes needed for a bracket.
 * Byes fill the bracket to the next power-of-two team count.
 */
export function calculateByes(teamCount: number): number {
  return nextPowerOfTwo(teamCount) - teamCount;
}

/**
 * Validate a join code format (alphanumeric, correct length).
 */
export function isValidJoinCode(code: string): boolean {
  if (code.length < JOIN_CODE_LENGTH) return false;
  return /^[A-Z0-9]+$/i.test(code);
}

/**
 * Sanitize a team name: trim whitespace, collapse internal whitespace.
 */
export function sanitizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, MAX_TEAM_NAME_LENGTH);
}

/**
 * Generate a random alphanumeric join code.
 */
export function generateJoinCode(length: number = JOIN_CODE_LENGTH): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validate that a UUID string is well-formed.
 */
export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
