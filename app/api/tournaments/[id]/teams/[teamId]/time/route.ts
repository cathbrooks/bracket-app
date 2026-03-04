import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { UnauthorizedError, ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { validateTournamentOwnership } from '@/lib/validation/tournament.validation';
import { toTeam } from '@/lib/types/tournament.types';
import type { Tables } from '@/lib/database.types';
import { timeTrialTimeSchema } from '@/lib/schemas/seeding.schema';

type RouteContext = { params: Promise<{ id: string; teamId: string }> };

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const { id, teamId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const tournament = await validateTournamentOwnership(user.id, id);

  if (tournament.state !== 'draft' && tournament.state !== 'seeding') {
    throw new ForbiddenError('Time trials can only be recorded during draft or seeding phase');
  }

  if (tournament.seeding_mode !== 'time-trial') {
    throw new ValidationError('Tournament is not configured for time trial seeding');
  }

  const body = await request.json();

  const parsed = timeTrialTimeSchema.safeParse({ teamId, timeSeconds: body.timeSeconds });
  if (!parsed.success) {
    throw new ValidationError('Invalid time value');
  }

  const { data: team, error: fetchError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('tournament_id', id)
    .single();

  if (fetchError || !team) {
    throw new NotFoundError('Team', teamId);
  }

  const { data: updated, error: updateError } = await supabase
    .from('teams')
    .update({ time_trial_result_seconds: parsed.data.timeSeconds } as never)
    .eq('id', teamId)
    .eq('tournament_id', id)
    .select()
    .single();

  if (updateError || !updated) {
    throw new ValidationError(
      updateError?.message ?? 'Failed to record time'
    );
  }

  return NextResponse.json({
    data: { team: toTeam(updated as unknown as Tables<'teams'>) },
    error: null,
  });
});
