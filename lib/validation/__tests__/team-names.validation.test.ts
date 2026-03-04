import { describe, it, expect } from 'vitest';
import { teamNameSchema, teamNamesArraySchema } from '../team-names.validation';

describe('teamNameSchema', () => {
  it('accepts valid team name', () => {
    const result = teamNameSchema.safeParse('Team Alpha');
    expect(result.success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = teamNameSchema.safeParse('  Team A  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('Team A');
  });

  it('rejects name over max length', () => {
    const result = teamNameSchema.safeParse('A'.repeat(51));
    expect(result.success).toBe(false);
  });
});

describe('teamNamesArraySchema', () => {
  it('accepts array of 2+ names', () => {
    const result = teamNamesArraySchema.safeParse(['Alpha', 'Beta']);
    expect(result.success).toBe(true);
  });

  it('rejects fewer than 2 names', () => {
    expect(teamNamesArraySchema.safeParse(['Solo']).success).toBe(false);
  });
});
