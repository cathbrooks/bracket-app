import { createClient } from '@/lib/supabase/server';
import type { UpdateTournamentInput, Tournament } from '@/lib/types/tournament.types';
import { toTournament } from '@/lib/types/tournament.types';
import type { TablesUpdate } from '@/lib/database.types';
import { calculateTournamentDuration } from './calculateDuration';
import { validateTournamentOwnership, validateDraftState } from '@/lib/validation/tournament.validation';
import { ValidationError } from '@/lib/errors/custom-errors';

export async function updateTournament(
  userId: string,
  tournamentId: string,
  params: UpdateTournamentInput
): Promise<Tournament> {
  const supabase = await createClient();

  const existing = await validateTournamentOwnership(userId, tournamentId);

  if (params.state === undefined || params.state === existing.state) {
    validateDraftState(existing);
  }

  const update: TablesUpdate<'tournaments'> = {};

  if (params.name !== undefined) update.name = params.name;
  if (params.gameType !== undefined) update.game_type = params.gameType;
  if (params.format !== undefined) update.format = params.format;
  if (params.teamCount !== undefined) update.team_count = params.teamCount;
  if (params.stationCount !== undefined) update.station_count = params.stationCount;
  if (params.timePerMatchMinutes !== undefined) update.time_per_match_minutes = params.timePerMatchMinutes;
  if (params.seedingMode !== undefined) update.seeding_mode = params.seedingMode;
  if (params.state !== undefined) update.state = params.state;

  const timingChanged =
    params.timePerMatchMinutes !== undefined ||
    params.stationCount !== undefined ||
    params.format !== undefined ||
    params.teamCount !== undefined;

  if (timingChanged) {
    const format = params.format ?? existing.format;
    const teamCount = params.teamCount ?? existing.team_count;
    const timePerMatch = params.timePerMatchMinutes ?? existing.time_per_match_minutes;
    const stationCount = params.stationCount ?? existing.station_count;

    if (timePerMatch) {
      const estimate = calculateTournamentDuration({
        format,
        teamCount,
        timePerMatchMinutes: timePerMatch,
        stationCount: stationCount ?? 1,
      });
      update.estimated_duration_minutes = estimate.totalMinutes;
    }
  }

  const { data: updated, error } = await supabase
    .from('tournaments')
    .update(update as never)
    .eq('id', tournamentId)
    .select()
    .single();

  if (error || !updated) {
    throw new ValidationError(
      error?.message ?? 'Failed to update tournament'
    );
  }

  return toTournament(updated as never);
}
