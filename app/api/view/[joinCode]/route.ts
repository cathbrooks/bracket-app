import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { NotFoundError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { toTournament, toTeam, toMatch } from '@/lib/types/tournament.types';
import type { Tables } from '@/lib/database.types';

type RouteContext = { params: Promise<{ joinCode: string }> };

export const GET = withErrorHandler(async (
  _request: NextRequest,
  context: RouteContext
) => {
  const { joinCode } = await context.params;
  const supabase = await createClient();

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .ilike('join_code', joinCode)
    .single();

  if (error || !tournament) {
    throw new NotFoundError('Tournament');
  }

  const tournamentRow = tournament as unknown as Tables<'tournaments'>;

  const [{ data: teams }, { data: matches }] = await Promise.all([
    supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentRow.id)
      .order('seed', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentRow.id)
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
