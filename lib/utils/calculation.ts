import type { TournamentFormat } from '@/lib/constants';
import type { DurationEstimate } from '@/lib/types/tournament.types';
import { nextPowerOfTwo } from './validation';
import { formatDuration } from './format';

/**
 * Calculate total match count for a tournament format and team count.
 *
 * Single elimination: N - 1 matches
 * Double elimination: 2(N - 1) + 1 matches (includes grand finals)
 */
export function calculateMatchCount(
  format: TournamentFormat,
  teamCount: number
): number {
  if (teamCount < 2) return 0;

  if (format === 'single-elimination') {
    return teamCount - 1;
  }

  // Double elimination: 2(N-1) matches + 1 grand finals
  return 2 * (teamCount - 1) + 1;
}

/**
 * Calculate the number of rounds in a bracket.
 *
 * For single elimination: log2(nextPowerOfTwo(teamCount))
 * For double elimination: winners rounds + losers rounds + grand finals
 */
export function calculateRounds(
  format: TournamentFormat,
  teamCount: number
): number {
  if (teamCount < 2) return 0;
  const bracketSize = nextPowerOfTwo(teamCount);
  const winnersRounds = Math.log2(bracketSize);

  if (format === 'single-elimination') {
    return winnersRounds;
  }

  // Losers bracket has roughly 2 * (winnersRounds - 1) rounds, plus grand finals
  const losersRounds = 2 * (winnersRounds - 1);
  return winnersRounds + losersRounds + 1;
}

/**
 * Calculate the number of waves needed given match count and stations.
 * A wave is one round of simultaneous matches.
 */
export function calculateWaves(
  matchCount: number,
  stationCount: number
): number {
  if (stationCount <= 0 || matchCount <= 0) return 0;
  return Math.ceil(matchCount / stationCount);
}

/**
 * Calculate estimated tournament duration.
 */
export function calculateDuration(config: {
  format: TournamentFormat;
  teamCount: number;
  timePerMatchMinutes: number;
  stationCount?: number;
}): DurationEstimate {
  const {
    format,
    teamCount,
    timePerMatchMinutes,
    stationCount = 1,
  } = config;

  const matchCount = calculateMatchCount(format, teamCount);
  const waves = calculateWaves(matchCount, stationCount);
  const totalMinutes = waves * timePerMatchMinutes;

  return {
    totalMinutes,
    waves,
    matchCount,
    formattedDuration: formatDuration(totalMinutes),
  };
}
