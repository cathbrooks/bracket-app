import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { UnauthorizedError, ValidationError, ForbiddenError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { validateTournamentOwnership } from '@/lib/validation/tournament.validation';
import { generateLeaderboard } from '@/lib/services/seeding/generateLeaderboard';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (
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

  if (tournament.state !== 'draft' && tournament.state !== 'seeding') {
    throw new ForbiddenError('Leaderboard can only be generated during draft or seeding phase');
  }

  if (tournament.seeding_mode !== 'time-trial') {
    throw new ValidationError('Tournament is not configured for time trial seeding');
  }

  const leaderboard = await generateLeaderboard(id);

  return NextResponse.json({
    data: { leaderboard },
    error: null,
  });
});
