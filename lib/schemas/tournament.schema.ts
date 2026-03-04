import { z } from 'zod';
import {
  TOURNAMENT_FORMATS,
  SEEDING_MODES,
  PARTICIPANT_TYPES,
  MIN_TEAM_COUNT,
  MAX_TEAM_COUNT,
  MIN_TOURNAMENT_NAME_LENGTH,
  MAX_TOURNAMENT_NAME_LENGTH,
  MAX_GAME_TYPE_LENGTH,
} from '@/lib/constants';

export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(MIN_TOURNAMENT_NAME_LENGTH, `Name must be at least ${MIN_TOURNAMENT_NAME_LENGTH} characters`)
    .max(MAX_TOURNAMENT_NAME_LENGTH, `Name must be at most ${MAX_TOURNAMENT_NAME_LENGTH} characters`),
  gameType: z
    .string()
    .min(1, 'Game type is required')
    .max(MAX_GAME_TYPE_LENGTH, `Game type must be at most ${MAX_GAME_TYPE_LENGTH} characters`),
  participantType: z.enum(PARTICIPANT_TYPES, {
    error: 'Please select teams or players',
  }),
});

export const formatSelectionSchema = z.object({
  format: z.enum(TOURNAMENT_FORMATS, {
    error: 'Please select a valid tournament format',
  }),
});

export const teamConfigSchema = z.object({
  teamCount: z
    .number({ error: 'Team count must be a number' })
    .int('Team count must be a whole number')
    .min(MIN_TEAM_COUNT, `Minimum ${MIN_TEAM_COUNT} teams required`)
    .max(MAX_TEAM_COUNT, `Maximum ${MAX_TEAM_COUNT} teams allowed`),
  seedingMode: z.enum(SEEDING_MODES).default('manual'),
});

export const timingConfigSchema = z.object({
  timePerMatchMinutes: z
    .number({ error: 'Time per match must be a number' })
    .int('Time per match must be a whole number')
    .min(1, 'Minimum 1 minute per match')
    .max(480, 'Maximum 8 hours per match')
    .optional(),
  stationCount: z
    .number({ error: 'Station count must be a number' })
    .int('Station count must be a whole number')
    .min(1, 'At least 1 station required')
    .max(16, 'Maximum 16 stations')
    .default(1),
});

export const tournamentConfigSchema = basicInfoSchema
  .merge(formatSelectionSchema)
  .merge(teamConfigSchema)
  .merge(timingConfigSchema);

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type FormatSelectionFormData = z.infer<typeof formatSelectionSchema>;
export type TeamConfigFormData = z.infer<typeof teamConfigSchema>;
export type TimingConfigFormData = z.infer<typeof timingConfigSchema>;
export type TournamentConfigFormData = z.infer<typeof tournamentConfigSchema>;
