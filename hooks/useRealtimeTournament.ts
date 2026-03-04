'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TournamentRow } from '@/lib/types/tournament.types';
import type { ConnectionState } from '@/lib/realtime/config';
import { REALTIME_CONFIG } from '@/lib/realtime/config';
import { getReconnectDelay } from '@/lib/realtime/connection';

interface UseRealtimeTournamentReturn {
  tournament: TournamentRow | null;
  isConnected: boolean;
  connectionState: ConnectionState;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRealtimeTournament(
  tournamentId: string | null
): UseRealtimeTournamentReturn {
  const [tournament, setTournament] = useState<TournamentRow | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const supabaseRef = useRef(createClient());

  const fetchTournament = useCallback(async () => {
    if (!tournamentId) return;

    const { data, error: fetchError } = await supabaseRef.current
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setTournament(data);
    setError(null);
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) return;

    const supabase = supabaseRef.current;
    setConnectionState('connecting');

    fetchTournament();

    const channel = supabase
      .channel(`tournament:${tournamentId}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`,
        } as never,
        (payload: { new: TournamentRow }) => {
          reconnectAttempts.current = 0;
          setConnectionState('connected');
          setTournament(payload.new);
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
  }, [tournamentId, fetchTournament]);

  return {
    tournament,
    isConnected: connectionState === 'connected',
    connectionState,
    error,
    refetch: fetchTournament,
  };
}
