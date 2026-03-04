import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/database.types';
import { ValidationError } from '@/lib/errors/custom-errors';

interface LeaderboardEntry {
  teamId: string;
  name: string;
  seed: number;
  timeCentiseconds: number;
  isTied: boolean;
}

/**
 * Generate leaderboard from time trial results.
 * Sorts teams by time ascending, resolves ties by created_at (earlier = better seed).
 * Assigns sequential seeds 1-N and updates team records.
 */
export async function generateLeaderboard(
  tournamentId: string
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error || !teams) {
    throw new ValidationError('Failed to fetch teams');
  }

  const teamRows = teams as unknown as Tables<'teams'>[];

  const teamsWithoutTimes = teamRows.filter((t) => t.time_trial_result_seconds === null);
  if (teamsWithoutTimes.length > 0) {
    const names = teamsWithoutTimes.map((t) => t.name).join(', ');
    throw new ValidationError(
      `The following teams have not recorded times: ${names}`
    );
  }

  const sorted = [...teamRows].sort((a, b) => {
    const timeDiff = a.time_trial_result_seconds! - b.time_trial_result_seconds!;
    if (timeDiff !== 0) return timeDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const leaderboard: LeaderboardEntry[] = sorted.map((team, index) => {
    const isTied = sorted.some(
      (other, otherIdx) =>
        otherIdx !== index &&
        other.time_trial_result_seconds === team.time_trial_result_seconds
    );

    return {
      teamId: team.id,
      name: team.name,
      seed: index + 1,
      timeCentiseconds: Math.round(team.time_trial_result_seconds! * 100),
      isTied,
    };
  });

  // Update all seeds in parallel instead of sequentially
  const updateResults = await Promise.all(
    leaderboard.map((entry) =>
      supabase
        .from('teams')
        .update({ seed: entry.seed } as never)
        .eq('id', entry.teamId)
        .eq('tournament_id', tournamentId)
    )
  );

  for (let i = 0; i < updateResults.length; i++) {
    if (updateResults[i].error) {
      throw new ValidationError(
        `Failed to update seed for team ${leaderboard[i].name}: ${updateResults[i].error!.message}`
      );
    }
  }

  return leaderboard;
}
