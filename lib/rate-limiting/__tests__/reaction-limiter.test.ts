import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkReactionRateLimit } from '../reaction-limiter';

describe('checkReactionRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first reaction', () => {
    expect(checkReactionRateLimit('s1', 'm1')).toBe(true);
  });

  it('blocks reaction within cooldown period', () => {
    checkReactionRateLimit('s1', 'm1');
    expect(checkReactionRateLimit('s1', 'm1')).toBe(false);
  });

  it('allows reaction after cooldown period', () => {
    checkReactionRateLimit('s1', 'm1');
    vi.advanceTimersByTime(2100);
    expect(checkReactionRateLimit('s1', 'm1')).toBe(true);
  });

  it('uses separate limits per session-match pair', () => {
    checkReactionRateLimit('s1', 'm1');
    expect(checkReactionRateLimit('s1', 'm2')).toBe(true);
    expect(checkReactionRateLimit('s2', 'm1')).toBe(true);
  });
});
