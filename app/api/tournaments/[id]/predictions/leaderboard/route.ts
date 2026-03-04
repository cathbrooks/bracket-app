import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { NotFoundError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';

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

  const { data: predictions } = await supabase
    .from('bracket_predictions')
    .select('*')
    .eq('tournament_id', id)
    .order('total_points', { ascending: false })
    .order('correct_count', { ascending: false });

  const rows = (predictions ?? []) as unknown as {
    id: string;
    display_name: string;
    total_points: number;
    correct_count: number;
    session_id: string;
    predictions: Record<string, string> | null;
  }[];

  const totalMatches = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', id)
    .neq('is_bye', true);

  const matchCount = totalMatches.count ?? 0;

  const leaderboard = rows.map((row, index) => ({
    rank: index + 1,
    displayName: row.display_name,
    totalPoints: row.total_points,
    correctCount: row.correct_count,
    accuracy: matchCount > 0 ? Math.round((row.correct_count / matchCount) * 100) : 0,
    sessionId: row.session_id,
    predictions: row.predictions ?? {},
  }));

  return NextResponse.json({
    data: { leaderboard },
    error: null,
  });
});
