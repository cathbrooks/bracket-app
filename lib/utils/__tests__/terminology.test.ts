import { describe, it, expect } from 'vitest';
import { getParticipantLabels } from '../terminology';

describe('getParticipantLabels', () => {
  it('returns team labels for "teams"', () => {
    const labels = getParticipantLabels('teams');
    expect(labels.singular).toBe('Team');
    expect(labels.plural).toBe('Teams');
    expect(labels.possessive).toBe("team's");
    expect(labels.placeholder(0)).toBe('Team 1');
    expect(labels.placeholder(4)).toBe('Team 5');
  });

  it('returns player labels for "players"', () => {
    const labels = getParticipantLabels('players');
    expect(labels.singular).toBe('Player');
    expect(labels.plural).toBe('Players');
    expect(labels.possessive).toBe("player's");
    expect(labels.placeholder(0)).toBe('Player 1');
  });
});
