import type { Tables } from '@/lib/database.types';
import type {
  TournamentFormat,
  TournamentState,
  MatchState,
  SeedingMode,
  BracketCategory,
  EmojiType,
} from '@/lib/constants';

// ── Row types (direct DB representations) ──────────────────────────
export type TournamentRow = Tables<'tournaments'>;
export type TeamRow = Tables<'teams'>;
export type MatchRow = Tables<'matches'>;
export type ReactionRow = Tables<'reactions'>;
export type BracketPredictionRow = Tables<'bracket_predictions'>;
export type PredictionScoreRow = Tables<'prediction_scores'>;

// ── Domain entities (enriched / aliased for clarity) ────────────────
export interface Tournament {
  id: string;
  name: string;
  gameType: string;
  format: TournamentFormat;
  teamCount: number;
  stationCount: number | null;
  timePerMatchMinutes: number | null;
  seedingMode: SeedingMode;
  estimatedDurationMinutes: number | null;
  joinCode: string;
  state: TournamentState;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  seed: number | null;
  timeTrialResultSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  bracketCategory: BracketCategory | null;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  winnerNextMatchId: string | null;
  loserNextMatchId: string | null;
  isBye: boolean;
  state: MatchState;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  matchId: string;
  sessionId: string;
  emojiType: EmojiType;
  createdAt: string;
  updatedAt: string;
}

export interface BracketPrediction {
  id: string;
  tournamentId: string;
  sessionId: string;
  displayName: string;
  predictions: Record<string, string>;
  totalPoints: number;
  correctCount: number;
  submittedAt: string;
  updatedAt: string;
}

export interface PredictionScore {
  id: string;
  bracketPredictionId: string;
  matchId: string;
  predictedWinnerTeamId: string | null;
  actualWinnerTeamId: string | null;
  pointsEarned: number;
  createdAt: string;
  updatedAt: string;
}

// ── Partial types for creation / update ─────────────────────────────
export interface CreateTournamentInput {
  name: string;
  gameType: string;
  format: TournamentFormat;
  teamCount: number;
  stationCount?: number;
  timePerMatchMinutes?: number;
  seedingMode?: SeedingMode;
}

export interface UpdateTournamentInput {
  name?: string;
  gameType?: string;
  format?: TournamentFormat;
  teamCount?: number;
  stationCount?: number | null;
  timePerMatchMinutes?: number | null;
  seedingMode?: SeedingMode;
  state?: TournamentState;
}

export interface CreateTeamInput {
  tournamentId: string;
  name: string;
  seed?: number;
}

export interface UpdateTeamInput {
  name?: string;
  seed?: number | null;
  timeTrialResultSeconds?: number | null;
}

// ── Query result types (with joined data) ───────────────────────────
export interface MatchWithTeams extends Match {
  teamA: Team | null;
  teamB: Team | null;
  winner: Team | null;
}

export interface TournamentWithTeams extends Tournament {
  teams: Team[];
}

export interface TournamentWithBracket extends Tournament {
  teams: Team[];
  matches: Match[];
}

// ── Reaction aggregates ─────────────────────────────────────────────
export type ReactionCounts = Record<EmojiType, number>;

// ── Leaderboard entry ───────────────────────────────────────────────
export interface LeaderboardEntry {
  id: string;
  displayName: string;
  totalPoints: number;
  correctCount: number;
  rank: number;
}

// ── Match advancement result (from RPC) ─────────────────────────────
export interface MatchAdvancementResult {
  match: MatchRow;
  winner_next: MatchRow | null;
  loser_next: MatchRow | null;
}

// ── Duration estimate ───────────────────────────────────────────────
export interface DurationEstimate {
  totalMinutes: number;
  waves: number;
  matchCount: number;
  formattedDuration: string;
}

// ── Row → Domain converters ─────────────────────────────────────────
export function toTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    gameType: row.game_type,
    format: row.format,
    teamCount: row.team_count,
    stationCount: row.station_count,
    timePerMatchMinutes: row.time_per_match_minutes,
    seedingMode: row.seeding_mode,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    joinCode: row.join_code,
    state: row.state,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    seed: row.seed,
    timeTrialResultSeconds: row.time_trial_result_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    round: row.round,
    matchNumber: row.match_number,
    bracketCategory: row.bracket_category as BracketCategory | null,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    winnerTeamId: row.winner_team_id,
    winnerNextMatchId: row.winner_next_match_id,
    loserNextMatchId: row.loser_next_match_id,
    isBye: row.is_bye,
    state: row.state,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
