import { createClient } from '@/lib/supabase/server';
import { ForbiddenError, NotFoundError } from '@/lib/errors/custom-errors';
import type { Tables } from '@/lib/database.types';

type TournamentRow = Tables<'tournaments'>;

export async function validateTournamentOwnership(
  userId: string,
  tournamentId: string
): Promise<TournamentRow> {
  const supabase = await createClient();

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (error || !tournament) {
    throw new NotFoundError('Tournament', tournamentId);
  }

  const row = tournament as unknown as TournamentRow;

  if (row.owner_id !== userId) {
    throw new ForbiddenError('You do not own this tournament');
  }

  return row;
}

export function validateDraftState(tournament: TournamentRow): void {
  if (tournament.state !== 'draft') {
    throw new ForbiddenError(
      `Cannot modify tournament in "${tournament.state}" state. Only draft tournaments can be edited.`
    );
  }
}

export function validateTeamCount(count: number): void {
  if (count < 2 || count > 32) {
    throw new ForbiddenError('Team count must be between 2 and 32');
  }
}
