import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/database.types';

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

  const points = Math.pow(2, round - 1);

  const { data: predictions } = await supabase
    .from('prediction_scores')
    .select('id, bracket_prediction_id, predicted_winner_team_id')
    .eq('match_id', matchId);

  if (!predictions || predictions.length === 0) return;

  const predRows = predictions as unknown as Tables<'prediction_scores'>[];

  for (const pred of predRows) {
    const correct = pred.predicted_winner_team_id === winnerTeamId;
    const earned = correct ? points : 0;

    await supabase
      .from('prediction_scores')
      .update({
        actual_winner_team_id: winnerTeamId,
        points_earned: earned,
      } as never)
      .eq('id', pred.id);

    if (correct) {
      const { data: allScores } = await supabase
        .from('prediction_scores')
        .select('points_earned')
        .eq('bracket_prediction_id', pred.bracket_prediction_id);

      const scoreRows = (allScores ?? []) as unknown as { points_earned: number }[];
      const totalPoints = scoreRows.reduce((sum, s) => sum + s.points_earned, 0);
      const correctCount = scoreRows.filter((s) => s.points_earned > 0).length;

      await supabase
        .from('bracket_predictions')
        .update({
          total_points: totalPoints,
          correct_count: correctCount,
        } as never)
        .eq('id', pred.bracket_prediction_id);
    }
  }
}
