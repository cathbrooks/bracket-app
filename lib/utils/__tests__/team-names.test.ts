import { describe, it, expect } from 'vitest';
import {
  generateDefaultTeamNames,
  sanitizeTeamName,
  findDuplicateIndices,
  findDuplicateNames,
  applyDefaultNames,
} from '../team-names';

describe('generateDefaultTeamNames', () => {
  it('generates correct count of names', () => {
    expect(generateDefaultTeamNames(3)).toEqual(['Team 1', 'Team 2', 'Team 3']);
  });

  it('returns empty array for 0', () => {
    expect(generateDefaultTeamNames(0)).toEqual([]);
  });
});

describe('sanitizeTeamName', () => {
  it('trims and collapses whitespace', () => {
    expect(sanitizeTeamName('  Team   Alpha  ')).toBe('Team Alpha');
  });

  it('enforces max length of 50', () => {
    const long = 'X'.repeat(100);
    expect(sanitizeTeamName(long).length).toBe(50);
  });
});

describe('findDuplicateIndices', () => {
  it('returns empty for no duplicates', () => {
    expect(findDuplicateIndices(['Alpha', 'Beta', 'Gamma'])).toEqual([]);
  });

  it('finds case-insensitive duplicates', () => {
    const result = findDuplicateIndices(['Alpha', 'ALPHA', 'Beta']);
    expect(result).toContain(0);
    expect(result).toContain(1);
  });

  it('skips empty strings', () => {
    expect(findDuplicateIndices(['', '', 'Alpha'])).toEqual([]);
  });

  it('handles multiple duplicates', () => {
    const result = findDuplicateIndices(['a', 'b', 'a', 'b']);
    expect(result.sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('findDuplicateNames', () => {
  it('returns empty for unique names', () => {
    expect(findDuplicateNames(['Alpha', 'Beta'])).toEqual([]);
  });

  it('finds case-insensitive duplicate names', () => {
    expect(findDuplicateNames(['Alpha', 'alpha', 'Beta'])).toEqual(['Alpha']);
  });

  it('skips empty/whitespace names', () => {
    expect(findDuplicateNames(['', '  ', 'Alpha'])).toEqual([]);
  });
});

describe('applyDefaultNames', () => {
  it('fills empty entries with defaults', () => {
    expect(applyDefaultNames(['Alpha', '', ''], 3)).toEqual([
      'Alpha',
      'Team 2',
      'Team 3',
    ]);
  });

  it('extends array if shorter than count', () => {
    expect(applyDefaultNames(['A'], 3)).toEqual(['A', 'Team 2', 'Team 3']);
  });

  it('preserves all provided names', () => {
    expect(applyDefaultNames(['X', 'Y', 'Z'], 3)).toEqual(['X', 'Y', 'Z']);
  });
});
