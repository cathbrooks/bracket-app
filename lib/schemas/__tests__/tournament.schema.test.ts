import { describe, it, expect } from 'vitest';
import {
  basicInfoSchema,
  formatSelectionSchema,
  teamConfigSchema,
  timingConfigSchema,
  tournamentConfigSchema,
} from '../tournament.schema';

describe('basicInfoSchema', () => {
  it('validates correct input', () => {
    const result = basicInfoSchema.safeParse({
      name: 'My Tournament',
      gameType: 'Chess',
      participantType: 'teams',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name too short', () => {
    const result = basicInfoSchema.safeParse({
      name: 'ab',
      gameType: 'Chess',
      participantType: 'teams',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing game type', () => {
    const result = basicInfoSchema.safeParse({
      name: 'Tournament',
      gameType: '',
      participantType: 'teams',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid participant type', () => {
    const result = basicInfoSchema.safeParse({
      name: 'Tournament',
      gameType: 'Chess',
      participantType: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('formatSelectionSchema', () => {
  it('accepts valid formats', () => {
    expect(formatSelectionSchema.safeParse({ format: 'single-elimination' }).success).toBe(true);
    expect(formatSelectionSchema.safeParse({ format: 'double-elimination' }).success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(formatSelectionSchema.safeParse({ format: 'round-robin' }).success).toBe(false);
  });
});

describe('teamConfigSchema', () => {
  it('accepts valid team count', () => {
    const result = teamConfigSchema.safeParse({ teamCount: 8 });
    expect(result.success).toBe(true);
  });

  it('rejects team count below minimum', () => {
    expect(teamConfigSchema.safeParse({ teamCount: 1 }).success).toBe(false);
  });

  it('rejects team count above maximum', () => {
    expect(teamConfigSchema.safeParse({ teamCount: 33 }).success).toBe(false);
  });

  it('rejects non-integer team count', () => {
    expect(teamConfigSchema.safeParse({ teamCount: 5.5 }).success).toBe(false);
  });
});

describe('timingConfigSchema', () => {
  it('accepts valid timing', () => {
    const result = timingConfigSchema.safeParse({
      timePerMatchMinutes: 10,
      stationCount: 2,
    });
    expect(result.success).toBe(true);
  });

  it('allows optional timePerMatchMinutes', () => {
    const result = timingConfigSchema.safeParse({ stationCount: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects 0 minute matches', () => {
    expect(timingConfigSchema.safeParse({ timePerMatchMinutes: 0 }).success).toBe(false);
  });
});

describe('tournamentConfigSchema', () => {
  it('validates a complete config', () => {
    const result = tournamentConfigSchema.safeParse({
      name: 'Test Tournament',
      gameType: 'Chess',
      participantType: 'teams',
      format: 'single-elimination',
      teamCount: 8,
      seedingMode: 'manual',
      stationCount: 1,
    });
    expect(result.success).toBe(true);
  });
});
