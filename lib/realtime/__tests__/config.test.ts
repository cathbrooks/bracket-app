import { describe, it, expect } from 'vitest';
import { REALTIME_CONFIG } from '../config';

describe('REALTIME_CONFIG', () => {
  it('has expected properties', () => {
    expect(REALTIME_CONFIG.RECONNECT_DELAY_MS).toBe(1000);
    expect(REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS).toBe(10);
    expect(REALTIME_CONFIG.RECONNECT_BACKOFF_FACTOR).toBe(2);
    expect(REALTIME_CONFIG.MAX_RECONNECT_DELAY_MS).toBe(30000);
    expect(REALTIME_CONFIG.HEARTBEAT_INTERVAL_MS).toBe(30000);
  });
});
