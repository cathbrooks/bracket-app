import { describe, it, expect } from 'vitest';
import { getReconnectDelay } from '../connection';

describe('getReconnectDelay', () => {
  it('returns base delay for first attempt', () => {
    const delay = getReconnectDelay(0);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThan(1200);
  });

  it('increases with attempts using exponential backoff', () => {
    const d0 = getReconnectDelay(0);
    const d1 = getReconnectDelay(1);
    const d2 = getReconnectDelay(2);
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
  });

  it('caps at MAX_RECONNECT_DELAY_MS', () => {
    const delay = getReconnectDelay(100);
    expect(delay).toBeLessThanOrEqual(33000);
  });
});
