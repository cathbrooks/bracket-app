import { describe, it, expect } from 'vitest';
import { shuffleTeams } from '../shuffleTeams';
import type { Team } from '@/lib/types/tournament.types';

function makeTeam(id: string): Team {
  return {
    id,
    tournamentId: 't1',
    name: `Team ${id}`,
    seed: null,
    timeTrialResultSeconds: null,
    roster: null,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };
}

describe('shuffleTeams', () => {
  it('returns same length array', () => {
    const teams = [makeTeam('1'), makeTeam('2'), makeTeam('3')];
    const result = shuffleTeams(teams);
    expect(result).toHaveLength(3);
  });

  it('contains all original teams', () => {
    const teams = [makeTeam('1'), makeTeam('2'), makeTeam('3'), makeTeam('4')];
    const result = shuffleTeams(teams);
    const ids = result.map((t) => t.id).sort();
    expect(ids).toEqual(['1', '2', '3', '4']);
  });

  it('does not mutate original array', () => {
    const teams = [makeTeam('1'), makeTeam('2')];
    const original = [...teams];
    shuffleTeams(teams);
    expect(teams[0].id).toBe(original[0].id);
  });

  it('returns empty array for empty input', () => {
    expect(shuffleTeams([])).toEqual([]);
  });
});
