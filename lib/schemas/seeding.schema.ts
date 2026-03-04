import { z } from 'zod';

export const manualSeedSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  seed: z
    .number({ error: 'Seed must be a number' })
    .int('Seed must be a whole number')
    .min(1, 'Seed must be at least 1'),
});

export const manualSeedListSchema = z.object({
  seeds: z
    .array(manualSeedSchema)
    .min(2, 'At least 2 teams must be seeded')
    .refine(
      (seeds) => {
        const seedNums = seeds.map((s) => s.seed);
        return new Set(seedNums).size === seedNums.length;
      },
      { message: 'Each seed number must be unique' }
    ),
});

export const timeTrialTimeSchema = z.object({
  teamId: z.string().uuid('Invalid team ID'),
  timeSeconds: z
    .number({ error: 'Time must be a number' })
    .positive('Time must be positive')
    .max(86400, 'Time cannot exceed 24 hours'),
});

export const leaderboardSchema = z.object({
  entries: z.array(
    z.object({
      teamId: z.string().uuid('Invalid team ID'),
      name: z.string(),
      seed: z.number().int().min(1),
      timeTrialResultSeconds: z.number().positive().nullable(),
    })
  ),
});

export type ManualSeedFormData = z.infer<typeof manualSeedSchema>;
export type ManualSeedListFormData = z.infer<typeof manualSeedListSchema>;
export type TimeTrialTimeFormData = z.infer<typeof timeTrialTimeSchema>;
export type LeaderboardFormData = z.infer<typeof leaderboardSchema>;
