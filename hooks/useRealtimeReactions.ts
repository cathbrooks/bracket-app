'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ReactionRow, ReactionCounts } from '@/lib/types/tournament.types';
import type { ConnectionState } from '@/lib/realtime/config';
import { EMOJI_TYPES } from '@/lib/constants';
import { REALTIME_CONFIG } from '@/lib/realtime/config';
import { getReconnectDelay } from '@/lib/realtime/connection';
import { applyReactionChange } from '@/lib/realtime/delta-updates';

function emptyReactionCounts(): ReactionCounts {
  const counts = {} as ReactionCounts;
  for (const type of EMOJI_TYPES) {
    counts[type] = 0;
  }
  return counts;
}

interface UseRealtimeReactionsReturn {
  reactionCounts: ReactionCounts;
  isConnected: boolean;
  connectionState: ConnectionState;
  error: string | null;
}

export function useRealtimeReactions(
  matchId: string | null
): UseRealtimeReactionsReturn {
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(
    emptyReactionCounts()
  );
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const supabaseRef = useRef(createClient());

  const fetchCounts = useCallback(async () => {
    if (!matchId) return;

    const { data, error: fetchError } = await supabaseRef.current
      .from('reactions')
      .select('*')
      .eq('match_id', matchId);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    const counts = emptyReactionCounts();
    for (const row of (data ?? []) as ReactionRow[]) {
      const key = row.emoji_type as keyof ReactionCounts;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    setReactionCounts(counts);
    setError(null);
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    const supabase = supabaseRef.current;
    setConnectionState('connecting');

    fetchCounts();

    const channel = supabase
      .channel(`reactions:${matchId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `match_id=eq.${matchId}`,
        } as never,
        (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE';
          new: ReactionRow;
          old: ReactionRow;
        }) => {
          reconnectAttempts.current = 0;
          setConnectionState('connected');

          const reaction =
            payload.eventType === 'DELETE' ? payload.old : payload.new;

          setReactionCounts((prev) =>
            applyReactionChange(prev, reaction, payload.eventType) as ReactionCounts
          );
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState('connected');
          reconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionState('reconnecting');
          if (
            reconnectAttempts.current <
            REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS
          ) {
            const delay = getReconnectDelay(reconnectAttempts.current);
            reconnectAttempts.current += 1;
            setTimeout(() => {
              channel.subscribe();
            }, delay);
          } else {
            setConnectionState('disconnected');
            setError('Connection lost. Please refresh the page.');
          }
        } else if (status === 'CLOSED') {
          setConnectionState('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchCounts]);

  return {
    reactionCounts,
    isConnected: connectionState === 'connected',
    connectionState,
    error,
  };
}
