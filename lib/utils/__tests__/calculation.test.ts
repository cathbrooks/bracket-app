import { describe, it, expect } from 'vitest';
import {
  calculateMatchCount,
  calculateRounds,
  calculateWaves,
  calculateDuration,
} from '../calculation';

describe('calculateMatchCount', () => {
  it('returns 0 for fewer than 2 teams', () => {
    expect(calculateMatchCount('single-elimination', 0)).toBe(0);
    expect(calculateMatchCount('single-elimination', 1)).toBe(0);
  });

  it('single-elimination: N-1 matches', () => {
    expect(calculateMatchCount('single-elimination', 2)).toBe(1);
    expect(calculateMatchCount('single-elimination', 4)).toBe(3);
    expect(calculateMatchCount('single-elimination', 8)).toBe(7);
    expect(calculateMatchCount('single-elimination', 16)).toBe(15);
  });

  it('double-elimination: 2(N-1)+1 matches', () => {
    expect(calculateMatchCount('double-elimination', 2)).toBe(3);
    expect(calculateMatchCount('double-elimination', 4)).toBe(7);
    expect(calculateMatchCount('double-elimination', 8)).toBe(15);
  });
});

describe('calculateRounds', () => {
  it('returns 0 for fewer than 2 teams', () => {
    expect(calculateRounds('single-elimination', 1)).toBe(0);
  });

  it('single-elimination rounds', () => {
    expect(calculateRounds('single-elimination', 2)).toBe(1);
    expect(calculateRounds('single-elimination', 4)).toBe(2);
    expect(calculateRounds('single-elimination', 8)).toBe(3);
    expect(calculateRounds('single-elimination', 3)).toBe(2);
  });

  it('double-elimination has more rounds than single', () => {
    const se = calculateRounds('single-elimination', 8);
    const de = calculateRounds('double-elimination', 8);
    expect(de).toBeGreaterThan(se);
  });
});

describe('calculateWaves', () => {
  it('returns 0 for 0 stations or 0 matches', () => {
    expect(calculateWaves(0, 1)).toBe(0);
    expect(calculateWaves(5, 0)).toBe(0);
    expect(calculateWaves(5, -1)).toBe(0);
  });

  it('calculates waves correctly', () => {
    expect(calculateWaves(7, 1)).toBe(7);
    expect(calculateWaves(7, 2)).toBe(4);
    expect(calculateWaves(7, 4)).toBe(2);
    expect(calculateWaves(7, 7)).toBe(1);
    expect(calculateWaves(7, 10)).toBe(1);
  });
});

describe('calculateDuration', () => {
  it('returns correct duration estimate', () => {
    const result = calculateDuration({
      format: 'single-elimination',
      teamCount: 8,
      timePerMatchMinutes: 10,
      stationCount: 1,
    });
    expect(result.matchCount).toBe(7);
    expect(result.waves).toBe(7);
    expect(result.totalMinutes).toBe(70);
    expect(result.formattedDuration).toBe('1h 10m');
  });

  it('multiple stations reduce waves', () => {
    const result = calculateDuration({
      format: 'single-elimination',
      teamCount: 8,
      timePerMatchMinutes: 10,
      stationCount: 4,
    });
    expect(result.waves).toBe(2);
    expect(result.totalMinutes).toBe(20);
  });

  it('defaults stationCount to 1', () => {
    const result = calculateDuration({
      format: 'single-elimination',
      teamCount: 4,
      timePerMatchMinutes: 15,
    });
    expect(result.waves).toBe(3);
    expect(result.totalMinutes).toBe(45);
  });
});
