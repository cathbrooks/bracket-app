export const REALTIME_CONFIG = {
  RECONNECT_DELAY_MS: 1000,
  MAX_RECONNECT_ATTEMPTS: 10,
  RECONNECT_BACKOFF_FACTOR: 2,
  MAX_RECONNECT_DELAY_MS: 30000,
  HEARTBEAT_INTERVAL_MS: 30000,
} as const;

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
