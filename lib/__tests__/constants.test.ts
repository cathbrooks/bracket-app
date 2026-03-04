import { describe, it, expect } from 'vitest';
import {
  TOURNAMENT_FORMATS,
  MATCH_STATES,
  TOURNAMENT_STATES,
  SEEDING_MODES,
  PARTICIPANT_TYPES,
  BRACKET_CATEGORIES,
  EMOJI_TYPES,
  MIN_TEAM_COUNT,
  MAX_TEAM_COUNT,
  MIN_TOURNAMENT_NAME_LENGTH,
  MAX_TOURNAMENT_NAME_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  JOIN_CODE_LENGTH,
  ROUTES,
} from '../constants';

describe('constants', () => {
  it('has correct tournament formats', () => {
    expect(TOURNAMENT_FORMATS).toContain('single-elimination');
    expect(TOURNAMENT_FORMATS).toContain('double-elimination');
    expect(TOURNAMENT_FORMATS).toHaveLength(2);
  });

  it('has correct match states', () => {
    expect(MATCH_STATES).toContain('pending');
    expect(MATCH_STATES).toContain('in-progress');
    expect(MATCH_STATES).toContain('completed');
    expect(MATCH_STATES).toContain('skipped');
  });

  it('has correct tournament states', () => {
    expect(TOURNAMENT_STATES).toHaveLength(5);
    expect(TOURNAMENT_STATES).toContain('draft');
    expect(TOURNAMENT_STATES).toContain('completed');
  });

  it('has seeding modes', () => {
    expect(SEEDING_MODES).toEqual(['manual', 'time-trial']);
  });

  it('has participant types', () => {
    expect(PARTICIPANT_TYPES).toEqual(['teams', 'players']);
  });

  it('has bracket categories', () => {
    expect(BRACKET_CATEGORIES).toContain('winners');
    expect(BRACKET_CATEGORIES).toContain('losers');
    expect(BRACKET_CATEGORIES).toContain('grand-finals');
  });

  it('has emoji types', () => {
    expect(EMOJI_TYPES).toHaveLength(6);
  });

  it('has correct numeric constraints', () => {
    expect(MIN_TEAM_COUNT).toBe(2);
    expect(MAX_TEAM_COUNT).toBe(32);
    expect(MIN_TOURNAMENT_NAME_LENGTH).toBe(3);
    expect(MAX_TOURNAMENT_NAME_LENGTH).toBe(100);
    expect(MAX_TEAM_NAME_LENGTH).toBe(50);
    expect(JOIN_CODE_LENGTH).toBe(6);
  });

  it('ROUTES has correct structure', () => {
    expect(ROUTES.home).toBe('/');
    expect(ROUTES.auth.login).toBe('/login');
    expect(ROUTES.organizer.tournament('abc')).toBe('/organizer/tournament/abc');
    expect(ROUTES.organizer.bracket('abc')).toBe('/organizer/tournament/abc/bracket');
    expect(ROUTES.spectator.join).toBe('/spectator/view');
  });
});
