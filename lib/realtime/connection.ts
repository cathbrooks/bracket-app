import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { REALTIME_CONFIG, type ConnectionState } from './config';

export interface ChannelCallbacks {
  onStatusChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

/**
 * Create a Supabase Realtime channel with connection state tracking.
 */
export function createRealtimeChannel(
  supabase: SupabaseClient<Database>,
  channelName: string,
  callbacks?: ChannelCallbacks
): RealtimeChannel {
  const channel = supabase.channel(channelName);

  channel.on('system' as never, {} as never, (payload: { extension: string; status: string }) => {
    if (payload.extension === 'postgres_changes') {
      if (payload.status === 'ok') {
        callbacks?.onStatusChange?.('connected');
      } else {
        callbacks?.onStatusChange?.('disconnected');
      }
    }
  });

  return channel;
}

/**
 * Subscribe to Postgres changes on a specific table.
 */
export function subscribeToChanges<T extends Record<string, unknown>>(
  channel: RealtimeChannel,
  options: {
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    schema?: string;
    table: string;
    filter?: string;
  },
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T;
    old: Partial<T>;
  }) => void
): RealtimeChannel {
  return channel.on(
    'postgres_changes' as never,
    {
      event: options.event,
      schema: options.schema ?? 'public',
      table: options.table,
      filter: options.filter,
    } as never,
    callback as never
  );
}

/**
 * Calculate reconnection delay using exponential backoff with jitter.
 */
export function getReconnectDelay(attempt: number): number {
  const baseDelay = REALTIME_CONFIG.RECONNECT_DELAY_MS;
  const factor = REALTIME_CONFIG.RECONNECT_BACKOFF_FACTOR;
  const maxDelay = REALTIME_CONFIG.MAX_RECONNECT_DELAY_MS;

  const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
  const jitter = delay * 0.1 * Math.random();
  return Math.floor(delay + jitter);
}
