import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { UnauthorizedError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { validateTournamentOwnership } from '@/lib/validation/tournament.validation';
import { generateBracket } from '@/lib/services/bracket/generateBracket';
import { toTeam } from '@/lib/types/tournament.types';
import type { Tables } from '@/lib/database.types';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (
  _request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new UnauthorizedError();

  const tournament = await validateTournamentOwnership(user.id, id);

  const { data: teamRows } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', id)
    .order('seed', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  const teams = ((teamRows ?? []) as unknown as Tables<'teams'>[]).map(toTeam);

  const matches = await generateBracket(id, tournament.format, teams);

  return NextResponse.json({ data: { matches }, error: null }, { status: 201 });
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new UnauthorizedError();

  await validateTournamentOwnership(user.id, id);

  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', id);

  if (error) throw new Error(error.message);

  return NextResponse.json({ data: { deleted: true }, error: null });
});
