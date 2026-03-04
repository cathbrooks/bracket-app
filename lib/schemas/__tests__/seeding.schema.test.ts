import { describe, it, expect } from 'vitest';
import {
  manualSeedSchema,
  manualSeedListSchema,
  timeTrialTimeSchema,
  leaderboardSchema,
} from '../seeding.schema';

describe('manualSeedSchema', () => {
  it('accepts valid input', () => {
    const result = manualSeedSchema.safeParse({
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      seed: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    expect(manualSeedSchema.safeParse({ teamId: 'bad', seed: 1 }).success).toBe(false);
  });

  it('rejects seed < 1', () => {
    expect(manualSeedSchema.safeParse({
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      seed: 0,
    }).success).toBe(false);
  });

  it('rejects non-integer seed', () => {
    expect(manualSeedSchema.safeParse({
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      seed: 1.5,
    }).success).toBe(false);
  });
});

describe('manualSeedListSchema', () => {
  const uuid1 = '550e8400-e29b-41d4-a716-446655440001';
  const uuid2 = '550e8400-e29b-41d4-a716-446655440002';

  it('accepts valid seed list', () => {
    const result = manualSeedListSchema.safeParse({
      seeds: [
        { teamId: uuid1, seed: 1 },
        { teamId: uuid2, seed: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects fewer than 2 seeds', () => {
    expect(manualSeedListSchema.safeParse({
      seeds: [{ teamId: uuid1, seed: 1 }],
    }).success).toBe(false);
  });

  it('rejects duplicate seed numbers', () => {
    const result = manualSeedListSchema.safeParse({
      seeds: [
        { teamId: uuid1, seed: 1 },
        { teamId: uuid2, seed: 1 },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('timeTrialTimeSchema', () => {
  it('accepts valid time', () => {
    expect(timeTrialTimeSchema.safeParse({
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      timeSeconds: 120.5,
    }).success).toBe(true);
  });

  it('rejects negative time', () => {
    expect(timeTrialTimeSchema.safeParse({
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      timeSeconds: -1,
    }).success).toBe(false);
  });

  it('rejects time exceeding 24 hours', () => {
    expect(timeTrialTimeSchema.safeParse({
      teamId: '550e8400-e29b-41d4-a716-446655440000',
      timeSeconds: 86401,
    }).success).toBe(false);
  });
});

describe('leaderboardSchema', () => {
  it('accepts valid leaderboard', () => {
    const result = leaderboardSchema.safeParse({
      entries: [
        {
          teamId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Team A',
          seed: 1,
          timeTrialResultSeconds: 120.5,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts null timeTrialResultSeconds', () => {
    const result = leaderboardSchema.safeParse({
      entries: [{
        teamId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Team A',
        seed: 1,
        timeTrialResultSeconds: null,
      }],
    });
    expect(result.success).toBe(true);
  });
});
