import { describe, it, expect } from 'vitest';
import { calculateTournamentDuration } from '../calculateDuration';

describe('calculateTournamentDuration', () => {
  it('calculates single-elimination duration', () => {
    const result = calculateTournamentDuration({
      format: 'single-elimination',
      teamCount: 8,
      timePerMatchMinutes: 10,
      stationCount: 1,
    });
    expect(result.matchCount).toBe(7);
    expect(result.totalMinutes).toBe(70);
    expect(result.formattedDuration).toBe('1h 10m');
  });

  it('calculates double-elimination duration', () => {
    const result = calculateTournamentDuration({
      format: 'double-elimination',
      teamCount: 4,
      timePerMatchMinutes: 15,
    });
    expect(result.matchCount).toBe(7);
    expect(result.totalMinutes).toBe(105);
  });

  it('reduces waves with more stations', () => {
    const r1 = calculateTournamentDuration({
      format: 'single-elimination',
      teamCount: 8,
      timePerMatchMinutes: 10,
      stationCount: 1,
    });
    const r4 = calculateTournamentDuration({
      format: 'single-elimination',
      teamCount: 8,
      timePerMatchMinutes: 10,
      stationCount: 4,
    });
    expect(r4.totalMinutes).toBeLessThan(r1.totalMinutes);
  });
});
