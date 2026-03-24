import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { NotFoundError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { pointsForRound } from '@/lib/services/predictions/pointsForRound';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (
  _request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('id', id)
    .single();

  if (!tournament) {
    throw new NotFoundError('Tournament', id);
  }

  // Fetch all completed non-bye matches so we can compute scores on the fly.
  // Points double each round: round 1 = 1pt, round 2 = 2pts, round 3 = 4pts, etc.
  // Exclude bye matches — they are not predictable; accuracy % uses only playable matches.
  const { data: completedMatches } = await supabase
    .from('matches')
    .select('id, round, winner_team_id, is_bye')
    .eq('tournament_id', id)
    .eq('state', 'completed')
    .not('winner_team_id', 'is', null);

  const matchResults = new Map<string, { winnerId: string; points: number }>();
  for (const m of completedMatches ?? []) {
    const row = m as { id: string; round: number; winner_team_id: string; is_bye: boolean };
    if (row.is_bye) continue; // exclude bye matches from scoring and accuracy percentage
    matchResults.set(row.id, {
      winnerId: row.winner_team_id,
      points: pointsForRound(row.round),
    });
  }

  // Denominator for accuracy: only non-bye completed matches (playable matches that were actually played)
  const totalPlayableMatches = matchResults.size;

  // Fetch all predictions
  const { data: predictions } = await supabase
    .from('bracket_predictions')
    .select('id, display_name, session_id, predictions')
    .eq('tournament_id', id);

  const rows = (predictions ?? []) as unknown as {
    id: string;
    display_name: string;
    session_id: string;
    predictions: Record<string, string> | null;
  }[];

  // Compute scores dynamically from match results
  const scored = rows.map((row) => {
    const picks = row.predictions ?? {};
    let totalPoints = 0;
    let correctCount = 0;

    for (const [matchId, result] of matchResults) {
      const predicted = picks[matchId];
      if (predicted === result.winnerId) {
        totalPoints += result.points;
        correctCount++;
      }
    }

    return {
      id: row.id,
      displayName: row.display_name,
      sessionId: row.session_id,
      predictions: picks,
      totalPoints,
      correctCount,
    };
  });

  // Sort by points desc, then correct count desc
  scored.sort((a, b) =>
    b.totalPoints !== a.totalPoints
      ? b.totalPoints - a.totalPoints
      : b.correctCount - a.correctCount
  );

  const leaderboard = scored.map((entry, index) => ({
    rank: index + 1,
    displayName: entry.displayName,
    totalPoints: entry.totalPoints,
    correctCount: entry.correctCount,
    accuracy:
      totalPlayableMatches > 0
        ? Math.round((entry.correctCount / totalPlayableMatches) * 100)
        : 0,
    sessionId: entry.sessionId,
    predictions: entry.predictions,
  }));

  return NextResponse.json({
    data: { leaderboard },
    error: null,
  });
});
