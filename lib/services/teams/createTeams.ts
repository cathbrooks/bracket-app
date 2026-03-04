import { createClient } from '@/lib/supabase/server';
import type { Team } from '@/lib/types/tournament.types';
import { toTeam } from '@/lib/types/tournament.types';
import type { TablesInsert, Tables } from '@/lib/database.types';
import { applyDefaultNames, sanitizeTeamName } from '@/lib/utils/team-names';
import { ValidationError } from '@/lib/errors/custom-errors';

/**
 * Create teams for a tournament, applying default names when entries are empty.
 * Preserves entry order for use in random seeding.
 */
export async function createTeams(
  tournamentId: string,
  teamNames: string[],
  count: number
): Promise<Team[]> {
  const supabase = await createClient();

  const names = applyDefaultNames(teamNames, count);

  const inserts: TablesInsert<'teams'>[] = names.map((name) => ({
    tournament_id: tournamentId,
    name: sanitizeTeamName(name),
  }));

  const { data: teams, error } = await supabase
    .from('teams')
    .insert(inserts as never)
    .select();

  if (error || !teams) {
    throw new ValidationError(error?.message ?? 'Failed to create teams');
  }

  return (teams as unknown as Tables<'teams'>[]).map(toTeam);
}
