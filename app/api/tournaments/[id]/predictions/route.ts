import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { ValidationError, ConflictError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const { id } = await context.params;
  const supabase = await createClient();

  const body = await request.json();
  const { displayName, predictions, sessionId } = body as {
    displayName?: string;
    predictions: Record<string, string>;
    sessionId: string;
  };

  if (!sessionId) {
    throw new ValidationError('Session ID is required');
  }

  if (!predictions || typeof predictions !== 'object' || Object.keys(predictions).length === 0) {
    throw new ValidationError('Predictions are required');
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, state')
    .eq('id', id)
    .single();

  if (!tournament) {
    throw new ValidationError('Tournament not found');
  }

  const { data: completedMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', id)
    .eq('is_bye', false)
    .eq('state', 'completed')
    .limit(1);

  if (completedMatches && completedMatches.length > 0) {
    throw new ValidationError('Predictions are locked — matches have already started');
  }

  const { data: existing } = await supabase
    .from('bracket_predictions')
    .select('id')
    .eq('tournament_id', id)
    .eq('session_id', sessionId)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new ConflictError('You have already submitted predictions for this tournament');
  }

  const { data: prediction, error: insertError } = await supabase
    .from('bracket_predictions')
    .insert({
      tournament_id: id,
      session_id: sessionId,
      display_name: displayName || `Predictor #${Math.floor(Math.random() * 999) + 1}`,
      predictions: predictions as never,
    } as never)
    .select()
    .single();

  if (insertError || !prediction) {
    throw new ValidationError(insertError?.message ?? 'Failed to submit predictions');
  }

  const predRow = prediction as unknown as { id: string };

  const matchIds = Object.keys(predictions);
  const scoreInserts = matchIds.map((matchId) => ({
    bracket_prediction_id: predRow.id,
    match_id: matchId,
    predicted_winner_team_id: predictions[matchId],
  }));

  if (scoreInserts.length > 0) {
    await supabase.from('prediction_scores').insert(scoreInserts as never);
  }

  return NextResponse.json({
    data: { predictionId: predRow.id },
    error: null,
  }, { status: 201 });
});
