import { describe, it, expect } from 'vitest';
import { cn, formatTime, formatDuration, generateJoinCode } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatTime', () => {
  it('formats seconds to MM:SS.ss', () => {
    const result = formatTime(65.5);
    expect(result).toBe('01:05.50');
  });

  it('handles zero', () => {
    expect(formatTime(0)).toBe('00:00.00');
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });
});

describe('generateJoinCode', () => {
  it('generates 6-character code', () => {
    expect(generateJoinCode()).toHaveLength(6);
  });

  it('uses only allowed characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateJoinCode()).toMatch(/^[A-Z0-9]+$/);
    }
  });
});
