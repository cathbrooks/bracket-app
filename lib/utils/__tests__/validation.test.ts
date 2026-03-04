import { describe, it, expect } from 'vitest';
import {
  isPowerOfTwo,
  nextPowerOfTwo,
  calculateByes,
  isValidJoinCode,
  sanitizeTeamName,
  generateJoinCode,
  isValidUuid,
} from '../validation';

describe('isPowerOfTwo', () => {
  it('returns true for powers of two', () => {
    expect(isPowerOfTwo(1)).toBe(true);
    expect(isPowerOfTwo(2)).toBe(true);
    expect(isPowerOfTwo(4)).toBe(true);
    expect(isPowerOfTwo(8)).toBe(true);
    expect(isPowerOfTwo(16)).toBe(true);
  });

  it('returns false for non powers of two', () => {
    expect(isPowerOfTwo(0)).toBe(false);
    expect(isPowerOfTwo(3)).toBe(false);
    expect(isPowerOfTwo(5)).toBe(false);
    expect(isPowerOfTwo(-2)).toBe(false);
  });
});

describe('nextPowerOfTwo', () => {
  it('returns 1 for n <= 1', () => {
    expect(nextPowerOfTwo(0)).toBe(1);
    expect(nextPowerOfTwo(1)).toBe(1);
  });

  it('returns the number itself if already power of two', () => {
    expect(nextPowerOfTwo(4)).toBe(4);
    expect(nextPowerOfTwo(8)).toBe(8);
  });

  it('rounds up to next power of two', () => {
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
  });
});

describe('calculateByes', () => {
  it('returns 0 when team count is a power of two', () => {
    expect(calculateByes(4)).toBe(0);
    expect(calculateByes(8)).toBe(0);
  });

  it('calculates byes needed', () => {
    expect(calculateByes(3)).toBe(1);
    expect(calculateByes(5)).toBe(3);
    expect(calculateByes(6)).toBe(2);
  });
});

describe('isValidJoinCode', () => {
  it('returns true for valid codes', () => {
    expect(isValidJoinCode('ABC123')).toBe(true);
    expect(isValidJoinCode('XXXXXX')).toBe(true);
  });

  it('returns false for codes that are too short', () => {
    expect(isValidJoinCode('ABC')).toBe(false);
    expect(isValidJoinCode('')).toBe(false);
  });

  it('returns false for codes with invalid characters', () => {
    expect(isValidJoinCode('abc-12')).toBe(false);
    expect(isValidJoinCode('AB CD')).toBe(false);
  });
});

describe('sanitizeTeamName', () => {
  it('trims whitespace', () => {
    expect(sanitizeTeamName('  Team A  ')).toBe('Team A');
  });

  it('collapses internal whitespace', () => {
    expect(sanitizeTeamName('Team   A')).toBe('Team A');
  });

  it('enforces max length', () => {
    const long = 'A'.repeat(100);
    expect(sanitizeTeamName(long).length).toBe(50);
  });
});

describe('generateJoinCode', () => {
  it('generates a code of default length', () => {
    const code = generateJoinCode();
    expect(code.length).toBe(6);
  });

  it('generates codes with only allowed characters', () => {
    for (let i = 0; i < 10; i++) {
      const code = generateJoinCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it('supports custom length', () => {
    expect(generateJoinCode(10).length).toBe(10);
  });
});

describe('isValidUuid', () => {
  it('returns true for valid UUIDs', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('returns false for invalid UUIDs', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
  });
});
