import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { UnauthorizedError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { validateTournamentOwnership, validateDraftState } from '@/lib/validation/tournament.validation';
import { manualSeedListSchema } from '@/lib/schemas/seeding.schema';
import { assignManualSeeds } from '@/lib/services/seeding/assignManualSeeds';
import { ValidationError } from '@/lib/errors/custom-errors';

type RouteContext = { params: Promise<{ id: string }> };

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

  const tournament = await validateTournamentOwnership(user.id, id);
  validateDraftState(tournament);

  if (tournament.seeding_mode !== 'manual') {
    throw new ValidationError('Tournament is not configured for manual seeding');
  }

  const body = await request.json();
  const parsed = manualSeedListSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (path) fieldErrors[path] = issue.message;
    }
    throw new ValidationError('Invalid seed assignments', fieldErrors);
  }

  const teams = await assignManualSeeds(id, parsed.data.seeds);

  return NextResponse.json({
    data: { teams },
    error: null,
  });
});
