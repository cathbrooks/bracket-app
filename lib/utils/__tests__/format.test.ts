import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTime,
  formatDuration,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTournamentState,
} from '../format';

describe('formatTime', () => {
  it('formats zero centiseconds', () => {
    expect(formatTime(0)).toBe('00:00.00');
  });

  it('formats centiseconds into MM:SS.ss', () => {
    expect(formatTime(12345)).toBe('02:03.45');
  });

  it('handles exact minutes', () => {
    expect(formatTime(6000)).toBe('01:00.00');
  });

  it('pads single digits', () => {
    expect(formatTime(105)).toBe('00:01.05');
  });
});

describe('formatDuration', () => {
  it('returns 0m for zero or negative', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(-5)).toBe('0m');
  });

  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(150)).toBe('2h 30m');
  });
});

describe('formatDate', () => {
  it('formats ISO timestamp to locale date', () => {
    const result = formatDate('2025-06-15T12:00:00Z');
    expect(result).toContain('2025');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
  });
});

describe('formatDateTime', () => {
  it('formats ISO timestamp with date and time', () => {
    const result = formatDateTime('2025-06-15T14:30:00Z');
    expect(result).toContain('2025');
    expect(result).toContain('Jun');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for recent timestamps', () => {
    expect(formatRelativeTime('2025-06-15T11:59:30Z')).toBe('just now');
  });

  it('returns minutes ago', () => {
    expect(formatRelativeTime('2025-06-15T11:55:00Z')).toBe('5m ago');
  });

  it('returns hours ago', () => {
    expect(formatRelativeTime('2025-06-15T09:00:00Z')).toBe('3h ago');
  });

  it('returns days ago', () => {
    expect(formatRelativeTime('2025-06-13T12:00:00Z')).toBe('2d ago');
  });

  it('falls back to formatDate for old timestamps', () => {
    const result = formatRelativeTime('2025-01-15T12:00:00Z');
    expect(result).toContain('2025');
  });
});

describe('formatTournamentState', () => {
  it('maps known states to labels', () => {
    expect(formatTournamentState('draft')).toBe('Draft');
    expect(formatTournamentState('registration')).toBe('Registration');
    expect(formatTournamentState('seeding')).toBe('Seeding');
    expect(formatTournamentState('in-progress')).toBe('In Progress');
    expect(formatTournamentState('completed')).toBe('Completed');
  });

  it('returns the state string for unknown states', () => {
    expect(formatTournamentState('unknown')).toBe('unknown');
  });
});
