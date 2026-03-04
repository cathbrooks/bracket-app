import { z } from 'zod';
import { MAX_TEAM_NAME_LENGTH } from '@/lib/constants';

export const teamNameSchema = z
  .string()
  .max(MAX_TEAM_NAME_LENGTH, `Team name must be at most ${MAX_TEAM_NAME_LENGTH} characters`)
  .transform((val) => val.trim());

export const teamNamesArraySchema = z
  .array(teamNameSchema)
  .min(2, 'At least 2 team names required');

export type TeamNameFormData = z.infer<typeof teamNameSchema>;
