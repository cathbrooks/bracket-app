export const TOURNAMENT_FORMATS = [
  "single-elimination",
  "double-elimination",
] as const;

export const MATCH_STATES = [
  "pending",
  "in-progress",
  "completed",
  "skipped",
] as const;

export const TOURNAMENT_STATES = [
  "draft",
  "registration",
  "seeding",
  "in-progress",
  "completed",
] as const;

export const SEEDING_MODES = ["manual", "time-trial"] as const;

export const PARTICIPANT_TYPES = ["teams", "players"] as const;
export type ParticipantType = (typeof PARTICIPANT_TYPES)[number];

export const BRACKET_CATEGORIES = [
  "winners",
  "losers",
  "grand-finals",
] as const;

export const EMOJI_TYPES = [
  "fire",
  "shocked",
  "sad",
  "clap",
] as const;

export const MIN_TEAM_COUNT = 2;
export const MAX_TEAM_COUNT = 32;
export const MIN_TOURNAMENT_NAME_LENGTH = 3;
export const MAX_TOURNAMENT_NAME_LENGTH = 100;
export const MAX_TEAM_NAME_LENGTH = 50;
export const MAX_GAME_TYPE_LENGTH = 50;
export const JOIN_CODE_LENGTH = 6;

export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];
export type MatchState = (typeof MATCH_STATES)[number];
export type TournamentState = (typeof TOURNAMENT_STATES)[number];
export type SeedingMode = (typeof SEEDING_MODES)[number];
export type BracketCategory = (typeof BRACKET_CATEGORIES)[number];
export type EmojiType = (typeof EMOJI_TYPES)[number];

export const ROUTES = {
  home: "/",
  auth: {
    login: "/login",
    signup: "/signup",
    callback: "/api/auth/callback",
  },
  organizer: {
    create: "/organizer/create",
    dashboard: "/organizer/dashboard",
    tournament: (id: string) => `/organizer/tournament/${id}`,
    bracket: (id: string) => `/organizer/tournament/${id}/bracket`,
    seeding: (id: string) => `/organizer/tournament/${id}/seeding`,
    settings: (id: string) => `/organizer/tournament/${id}/settings`,
  },
  spectator: {
    join: "/spectator/view",
    tournament: (id: string) => `/spectator/tournament/${id}`,
    bracket: (id: string) => `/spectator/tournament/${id}/bracket`,
  },
} as const;
