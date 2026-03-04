import type { Team } from '@/lib/types/tournament.types';

/**
 * Fisher-Yates shuffle using crypto.getRandomValues for unbiased randomness.
 * Returns a new shuffled array without modifying the original.
 */
export function shuffleTeams(teams: Team[]): Team[] {
  const shuffled = [...teams];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
