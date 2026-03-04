import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { UnauthorizedError, ValidationError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { createTournament } from '@/lib/services/tournaments/createTournament';
import { tournamentConfigSchema } from '@/lib/schemas/tournament.schema';
import { z } from 'zod';

const createTournamentBodySchema = tournamentConfigSchema.extend({
  teamNames: z.array(z.string()).optional(),
  teamRosters: z.array(z.array(z.string())).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  const body = await request.json();
  const parsed = createTournamentBodySchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (path) fieldErrors[path] = issue.message;
    }
    throw new ValidationError('Invalid tournament configuration', fieldErrors);
  }

  const result = await createTournament(user.id, {
    name: parsed.data.name,
    gameType: parsed.data.gameType,
    participantType: parsed.data.participantType,
    predictionsEnabled: parsed.data.predictionsEnabled,
    format: parsed.data.format,
    teamCount: parsed.data.teamCount,
    stationCount: parsed.data.stationCount,
    timePerMatchMinutes: parsed.data.timePerMatchMinutes,
    seedingMode: parsed.data.seedingMode,
    teamNames: parsed.data.teamNames,
    teamRosters: parsed.data.teamRosters,
  });

  return NextResponse.json(
    { data: result, error: null },
    { status: 201 }
  );
});
