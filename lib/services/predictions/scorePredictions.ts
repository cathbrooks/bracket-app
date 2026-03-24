import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/database.types';
import { pointsForRound } from './pointsForRound';

// Re-usable helper: aggregate prediction_scores into bracket_predictions totals.
async function updateBracketPredictionTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bracketPredictionIds: string[]
): Promise<void> {
  const { data: allScores } = await supabase
    .from('prediction_scores')
    .select('bracket_prediction_id, points_earned')
    .in('bracket_prediction_id', bracketPredictionIds);

  if (!allScores || allScores.length === 0) return;

  const totals = new Map<string, { totalPoints: number; correctCount: number }>();
  for (const id of bracketPredictionIds) {
    totals.set(id, { totalPoints: 0, correctCount: 0 });
  }
  for (const score of allScores as unknown as { bracket_prediction_id: string; points_earned: number }[]) {
    const entry = totals.get(score.bracket_prediction_id);
    if (entry) {
      entry.totalPoints += score.points_earned;
      if (score.points_earned > 0) entry.correctCount++;
    }
  }

  await Promise.all(
    [...totals.entries()].map(([id, { totalPoints, correctCount }]) =>
      supabase
        .from('bracket_predictions')
        .update({ total_points: totalPoints, correct_count: correctCount } as never)
        .eq('id', id)
    )
  );
}

/**
 * Score all predictions for a completed match.
 * Points double each round: R1=1, R2=2, R3=4, Finals=8, etc.
 */
export async function scorePredictionsForMatch(
  tournamentId: string,
  matchId: string,
  winnerTeamId: string,
  round: number
): Promise<void> {
  const supabase = await createClient();

  const points = pointsForRound(round);

  const { data: predictions } = await supabase
    .from('prediction_scores')
    .select('id, bracket_prediction_id, predicted_winner_team_id')
    .eq('match_id', matchId);

  if (!predictions || predictions.length === 0) return;

  const predRows = predictions as unknown as Tables<'prediction_scores'>[];

  const correctIds = predRows
    .filter((p) => p.predicted_winner_team_id === winnerTeamId)
    .map((p) => p.id);
  const incorrectIds = predRows
    .filter((p) => p.predicted_winner_team_id !== winnerTeamId)
    .map((p) => p.id);

  // Batch update all prediction_scores in parallel — two calls instead of one per row
  await Promise.all([
    correctIds.length > 0 &&
      supabase
        .from('prediction_scores')
        .update({ actual_winner_team_id: winnerTeamId, points_earned: points } as never)
        .in('id', correctIds),
    incorrectIds.length > 0 &&
      supabase
        .from('prediction_scores')
        .update({ actual_winner_team_id: winnerTeamId, points_earned: 0 } as never)
        .in('id', incorrectIds),
  ]);

  const bracketPredictionIds = [...new Set(predRows.map((p) => p.bracket_prediction_id))];
  await updateBracketPredictionTotals(supabase, bracketPredictionIds);
}

/**
 * Revert prediction scores for a match whose result has been undone.
 * Clears actual_winner_team_id and points_earned, then recalculates
 * bracket_predictions totals from the remaining scored matches.
 */
export async function unscoreMatch(
  _tournamentId: string,
  matchId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: predictions } = await supabase
    .from('prediction_scores')
    .select('id, bracket_prediction_id')
    .eq('match_id', matchId);

  if (!predictions || predictions.length === 0) return;

  const predRows = predictions as unknown as Tables<'prediction_scores'>[];
  const allIds = predRows.map((p) => p.id);

  await supabase
    .from('prediction_scores')
    .update({ actual_winner_team_id: null, points_earned: 0 } as never)
    .in('id', allIds);

  const bracketPredictionIds = [...new Set(predRows.map((p) => p.bracket_prediction_id))];
  await updateBracketPredictionTotals(supabase, bracketPredictionIds);
}
