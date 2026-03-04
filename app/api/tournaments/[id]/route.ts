import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { updateTournament } from '@/lib/services/tournaments/updateTournament';
import { validateTournamentOwnership, validateDraftState } from '@/lib/validation/tournament.validation';
import { toTournament, toTeam, toMatch } from '@/lib/types/tournament.types';
import type { Tables } from '@/lib/database.types';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (
  _request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tournament) {
    throw new NotFoundError('Tournament', id);
  }

  const tournamentRow = tournament as unknown as Tables<'tournaments'>;

  const [{ data: teams }, { data: matches }] = await Promise.all([
    supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', id)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true }),
  ]);

  const teamRows = (teams ?? []) as unknown as Tables<'teams'>[];
  const matchRows = (matches ?? []) as unknown as Tables<'matches'>[];

  return NextResponse.json({
    data: {
      tournament: {
        ...toTournament(tournamentRow),
        teams: teamRows.map(toTeam),
        matches: matchRows.map(toMatch),
      },
    },
    error: null,
  });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const body = await request.json();
  const updated = await updateTournament(user.id, id, body);

  return NextResponse.json({
    data: { tournament: updated },
    error: null,
  });
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const tournament = await validateTournamentOwnership(user.id, id);
  validateDraftState(tournament);

  await supabase.from('matches').delete().eq('tournament_id', id);
  await supabase.from('teams').delete().eq('tournament_id', id);

  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ValidationError(error.message);
  }

  return NextResponse.json({
    data: { success: true },
    error: null,
  });
});
