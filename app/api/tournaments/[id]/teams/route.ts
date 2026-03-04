import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { UnauthorizedError, NotFoundError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { toTeam } from '@/lib/types/tournament.types';
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

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('id', id)
    .single();

  if (!tournament) {
    throw new NotFoundError('Tournament', id);
  }

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', id)
    .order('seed', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw new NotFoundError('Teams');
  }

  const teamRows = (teams ?? []) as unknown as Tables<'teams'>[];

  return NextResponse.json({
    data: { teams: teamRows.map(toTeam) },
    error: null,
  });
});
