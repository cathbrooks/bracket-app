import { createClient } from '@/lib/supabase/server';
import type { Team } from '@/lib/types/tournament.types';
import { toTeam } from '@/lib/types/tournament.types';
import type { Tables } from '@/lib/database.types';
import { ValidationError } from '@/lib/errors/custom-errors';

interface SeedAssignment {
  teamId: string;
  seed: number;
}

/**
 * Assign manual seeds to all teams in a tournament.
 * Validates uniqueness, 1-N range, and all teams present.
 */
export async function assignManualSeeds(
  tournamentId: string,
  assignments: SeedAssignment[]
): Promise<Team[]> {
  const supabase = await createClient();

  const { data: existingTeams, error: fetchError } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId);

  if (fetchError || !existingTeams) {
    throw new ValidationError('Failed to fetch teams');
  }

  const teamRows = existingTeams as unknown as Tables<'teams'>[];

  if (assignments.length !== teamRows.length) {
    throw new ValidationError(
      `Expected ${teamRows.length} seed assignments, received ${assignments.length}`
    );
  }

  const teamIds = new Set(teamRows.map((t) => t.id));
  for (const assignment of assignments) {
    if (!teamIds.has(assignment.teamId)) {
      throw new ValidationError(`Team ${assignment.teamId} not found in tournament`);
    }
  }

  const seeds = assignments.map((a) => a.seed);
  if (new Set(seeds).size !== seeds.length) {
    throw new ValidationError('Each seed number must be unique');
  }

  const expectedSeeds = Array.from({ length: teamRows.length }, (_, i) => i + 1);
  const sortedSeeds = [...seeds].sort((a, b) => a - b);
  if (JSON.stringify(sortedSeeds) !== JSON.stringify(expectedSeeds)) {
    throw new ValidationError(
      `Seeds must be sequential from 1 to ${teamRows.length}`
    );
  }

  const updatedTeams: Team[] = [];
  for (const assignment of assignments) {
    const { data: updated, error: updateError } = await supabase
      .from('teams')
      .update({ seed: assignment.seed } as never)
      .eq('id', assignment.teamId)
      .eq('tournament_id', tournamentId)
      .select()
      .single();

    if (updateError || !updated) {
      throw new ValidationError(
        updateError?.message ?? `Failed to update seed for team ${assignment.teamId}`
      );
    }

    updatedTeams.push(toTeam(updated as unknown as Tables<'teams'>));
  }

  return updatedTeams.sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
}
