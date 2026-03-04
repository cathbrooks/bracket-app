import type { TournamentFormat } from '@/lib/constants';
import type { DurationEstimate } from '@/lib/types/tournament.types';
import { calculateMatchCount, calculateWaves } from '@/lib/utils/calculation';
import { formatDuration } from '@/lib/utils/format';

/**
 * Server-side duration calculation mirroring the client-side logic.
 * Used when persisting estimated_duration_minutes to the database.
 */
export function calculateTournamentDuration(config: {
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
