'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MatchRow } from '@/lib/types/tournament.types';
import type { ConnectionState } from '@/lib/realtime/config';
import { REALTIME_CONFIG } from '@/lib/realtime/config';
import { getReconnectDelay } from '@/lib/realtime/connection';
import {
  applyMatchInsert,
  applyMatchUpdate,
  applyMatchDelete,
} from '@/lib/realtime/delta-updates';

interface UseRealtimeBracketReturn {
  matches: MatchRow[];
  isConnected: boolean;
  connectionState: ConnectionState;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRealtimeBracket(
  tournamentId: string | null
): UseRealtimeBracketReturn {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const supabaseRef = useRef(createClient());

  const fetchMatches = useCallback(async () => {
    if (!tournamentId) return;

    const { data, error: fetchError } = await supabaseRef.current
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round')
      .order('match_number');

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setMatches(data ?? []);
    setError(null);
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) return;

    const supabase = supabaseRef.current;
    setConnectionState('connecting');

    fetchMatches();

    const channel = supabase
      .channel(`bracket:${tournamentId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        } as never,
        (payload: { eventType: string; new: MatchRow; old: { id: string } }) => {
          reconnectAttempts.current = 0;
          setConnectionState('connected');

          switch (payload.eventType) {
            case 'INSERT':
              setMatches((prev) => applyMatchInsert(prev, payload.new));
              break;
            case 'UPDATE':
              setMatches((prev) => applyMatchUpdate(prev, payload.new));
              break;
            case 'DELETE':
              setMatches((prev) => applyMatchDelete(prev, payload.old.id));
              break;
          }
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
  }, [tournamentId, fetchMatches]);

  return {
    matches,
    isConnected: connectionState === 'connected',
    connectionState,
    error,
    refetch: fetchMatches,
  };
}
