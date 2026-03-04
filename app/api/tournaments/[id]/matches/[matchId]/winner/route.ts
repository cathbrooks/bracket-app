import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { validateTournamentOwnership } from '@/lib/validation/tournament.validation';
import { scorePredictionsForMatch } from '@/lib/services/predictions/scorePredictions';
import { toMatch } from '@/lib/types/tournament.types';
import type { Tables } from '@/lib/database.types';

type RouteContext = { params: Promise<{ id: string; matchId: string }> };

export const POST = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const { id, matchId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new UnauthorizedError();

  const tournament = await validateTournamentOwnership(user.id, id);
  if (tournament.state !== 'in-progress') {
    throw new ForbiddenError(
      'Winners can only be recorded after the tournament has started. Click "Start Tournament" first.'
    );
  }

  const body = await request.json();
  const { winnerId } = body as { winnerId: string };

  if (!winnerId) throw new ValidationError('winnerId is required');

  // Fetch current match to check state and round
  const { data: matchRow, error: fetchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .eq('tournament_id', id)
    .single();

  if (fetchError || !matchRow) throw new ValidationError('Match not found');

  const match = toMatch(matchRow as unknown as Tables<'matches'>);

  if (match.isBye) throw new ValidationError('Cannot record a winner for a bye match');

  // Transition to in-progress if still pending
  if (match.state === 'pending') {
    await supabase
      .from('matches')
      .update({ state: 'in-progress', started_at: new Date().toISOString() } as never)
      .eq('id', matchId);
  }

  // Advance winner via RPC
  const { error: rpcError } = await supabase.rpc('advance_match_winner', {
    p_match_id: matchId,
    p_winner_team_id: winnerId,
  });

  if (rpcError) throw new Error(rpcError.message);

  // Score all predictions for this match
  await scorePredictionsForMatch(id, matchId, winnerId, match.round);

  // Auto-complete any losers-bracket bye match that just received its only participant.
  // The RPC places the loser into the LB match but doesn't complete it when is_bye=true,
  // so we handle that here to keep the bracket advancing correctly.
  if (match.loserNextMatchId) {
    let currentByeId: string | null = match.loserNextMatchId;
    const loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;

    while (currentByeId && loserId) {
      const { data: lbRow } = await supabase
        .from('matches')
        .select('id, is_bye, state, team_a_id, team_b_id, winner_next_match_id')
        .eq('id', currentByeId)
        .single();

      if (!lbRow || !lbRow.is_bye || lbRow.state === 'completed') break;

      // Determine which slot the loser occupies (RPC may have placed it already)
      const occupiedBy = lbRow.team_a_id ?? lbRow.team_b_id;
      const resolvedLoser = occupiedBy ?? loserId;

      // Complete the bye match
      await supabase
        .from('matches')
        .update({
          team_a_id: resolvedLoser,
          team_b_id: null,
          winner_team_id: resolvedLoser,
          state: 'completed',
          completed_at: new Date().toISOString(),
        } as never)
        .eq('id', lbRow.id);

      // Place the survivor into the next LB match (team_a_id first, then team_b_id)
      if (lbRow.winner_next_match_id) {
        const { data: nextRow } = await supabase
          .from('matches')
          .select('id, team_a_id, team_b_id')
          .eq('id', lbRow.winner_next_match_id)
          .single();

        if (nextRow) {
          if (!nextRow.team_a_id) {
            await supabase
              .from('matches')
              .update({ team_a_id: resolvedLoser } as never)
              .eq('id', nextRow.id);
          } else if (!nextRow.team_b_id) {
            await supabase
              .from('matches')
              .update({ team_b_id: resolvedLoser } as never)
              .eq('id', nextRow.id);
          }
        }
      }

      // Check if the next match is also a bye (chain of byes)
      currentByeId = lbRow.winner_next_match_id ?? null;
    }
  }

  return NextResponse.json({ data: { success: true }, error: null });
});
