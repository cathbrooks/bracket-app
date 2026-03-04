import { createClient } from '@/lib/supabase/server';
import type { CreateTournamentInput, Tournament, Team } from '@/lib/types/tournament.types';
import { getParticipantLabels } from '@/lib/utils/terminology';
import { toTournament, toTeam } from '@/lib/types/tournament.types';
import type { TablesInsert } from '@/lib/database.types';
import { generateUniqueJoinCode } from './generateJoinCode';
import { calculateTournamentDuration } from './calculateDuration';
import { ValidationError } from '@/lib/errors/custom-errors';

interface CreateTournamentParams extends CreateTournamentInput {
  teamNames?: string[];
  teamRosters?: string[][];
}

interface CreateTournamentResult {
  tournament: Tournament;
  teams: Team[];
}

export async function createTournament(
  userId: string,
  params: CreateTournamentParams
): Promise<CreateTournamentResult> {
  const supabase = await createClient();

  const joinCode = await generateUniqueJoinCode();

  let estimatedDurationMinutes: number | null = null;
  if (params.timePerMatchMinutes) {
    const estimate = calculateTournamentDuration({
      format: params.format,
      teamCount: params.teamCount,
      timePerMatchMinutes: params.timePerMatchMinutes,
      stationCount: params.stationCount,
    });
    estimatedDurationMinutes = estimate.totalMinutes;
  }

  const participantType = params.participantType ?? 'teams';
  const labels = getParticipantLabels(participantType);

  const tournamentInsert: TablesInsert<'tournaments'> = {
    name: params.name,
    game_type: params.gameType,
    format: params.format,
    participant_type: participantType,
    team_count: params.teamCount,
    station_count: params.stationCount ?? 1,
    time_per_match_minutes: params.timePerMatchMinutes ?? null,
    seeding_mode: params.seedingMode ?? 'manual',
    estimated_duration_minutes: estimatedDurationMinutes,
    roster_size: null,
    join_code: joinCode,
    state: 'draft',
    owner_id: userId,
  };

  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .insert(tournamentInsert as never)
    .select()
    .single();

  // #region agent log
  fetch('http://127.0.0.1:7886/ingest/2affbf00-a3fc-4e94-a928-3efc7a4a95d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd6809'},body:JSON.stringify({sessionId:'dd6809',location:'createTournament.ts:55',message:'tournament insert result',data:{hasData:!!tournament,errorMsg:tournamentError?.message??null,errorCode:tournamentError?.code??null,errorDetails:tournamentError?.details??null,errorHint:tournamentError?.hint??null},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  if (tournamentError || !tournament) {
    throw new ValidationError(
      tournamentError?.message ?? 'Failed to create tournament'
    );
  }

  const tournamentRow = tournament as unknown as TablesInsert<'tournaments'> & { id: string };

  const teamNames = params.teamNames ?? [];
  const teamRosters = params.teamRosters ?? [];
  const teamInserts: TablesInsert<'teams'>[] = Array.from(
    { length: params.teamCount },
    (_, i) => ({
      tournament_id: tournamentRow.id,
      name: teamNames[i]?.trim() || labels.placeholder(i),
      roster: teamRosters[i]?.length
        ? teamRosters[i].map((p) => p.trim()).filter(Boolean)
        : null,
    })
  );

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .insert(teamInserts as never)
    .select();

  if (teamsError || !teams) {
    await supabase.from('tournaments').delete().eq('id', tournamentRow.id);
    throw new ValidationError(
      teamsError?.message ?? 'Failed to create teams'
    );
  }

  return {
    tournament: toTournament(tournament as never),
    teams: (teams as never[]).map(toTeam),
  };
}
