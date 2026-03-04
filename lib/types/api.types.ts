import type {
  Tournament,
  Team,
  Match,
  MatchWithTeams,
  TournamentWithTeams,
  TournamentWithBracket,
  LeaderboardEntry,
  ReactionCounts,
  DurationEstimate,
  CreateTournamentInput,
  UpdateTournamentInput,
  CreateTeamInput,
  UpdateTeamInput,
} from './tournament.types';
import type { EmojiType } from '@/lib/constants';

// ── Pagination ──────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Generic API response wrappers ───────────────────────────────────
export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
}

export interface ApiErrorResponse {
  data: null;
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Tournament endpoints ────────────────────────────────────────────
export type CreateTournamentRequest = CreateTournamentInput;

export interface CreateTournamentResponse {
  tournament: Tournament;
}

export type UpdateTournamentRequest = UpdateTournamentInput;

export interface UpdateTournamentResponse {
  tournament: Tournament;
}

export interface GetTournamentResponse {
  tournament: TournamentWithBracket;
}

export interface ListTournamentsResponse {
  tournaments: Tournament[];
}

// ── Team endpoints ──────────────────────────────────────────────────
export type CreateTeamRequest = Omit<CreateTeamInput, 'tournamentId'>;

export interface CreateTeamResponse {
  team: Team;
}

export type UpdateTeamRequest = UpdateTeamInput;

export interface UpdateTeamResponse {
  team: Team;
}

export interface ListTeamsResponse {
  teams: Team[];
}

export interface BulkCreateTeamsRequest {
  teams: { name: string; seed?: number }[];
}

export interface BulkCreateTeamsResponse {
  teams: Team[];
}

// ── Match endpoints ─────────────────────────────────────────────────
export interface ListMatchesResponse {
  matches: Match[];
}

export interface GetMatchResponse {
  match: MatchWithTeams;
}

export interface RecordMatchResultRequest {
  winnerTeamId: string;
}

export interface RecordMatchResultResponse {
  match: Match;
  winnerNext: Match | null;
  loserNext: Match | null;
}

// ── Seeding endpoints ───────────────────────────────────────────────
export interface UpdateSeedsRequest {
  seeds: { teamId: string; seed: number }[];
}

export interface UpdateSeedsResponse {
  teams: Team[];
}

export interface RecordTimeTrialRequest {
  teamId: string;
  timeSeconds: number;
}

export interface RecordTimeTrialResponse {
  team: Team;
}

// ── Spectator endpoints ─────────────────────────────────────────────
export interface JoinTournamentRequest {
  joinCode: string;
}

export interface JoinTournamentResponse {
  tournament: TournamentWithTeams;
}

// ── Reaction endpoints ──────────────────────────────────────────────
export interface SubmitReactionRequest {
  matchId: string;
  emojiType: EmojiType;
  sessionId: string;
}

export interface SubmitReactionResponse {
  reactionCounts: ReactionCounts;
}

export interface GetReactionCountsResponse {
  reactionCounts: ReactionCounts;
}

// ── Bracket prediction endpoints ────────────────────────────────────
export interface SubmitPredictionRequest {
  displayName: string;
  predictions: Record<string, string>;
  sessionId: string;
}

export interface SubmitPredictionResponse {
  predictionId: string;
}

export interface GetLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

// ── Duration calculation ────────────────────────────────────────────
export interface CalculateDurationRequest {
  format: string;
  teamCount: number;
  timePerMatchMinutes: number;
  stationCount?: number;
}

export interface CalculateDurationResponse {
  estimate: DurationEstimate;
}

// ── Health check ────────────────────────────────────────────────────
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
}
