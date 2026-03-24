'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  BracketPredictionRow,
  LeaderboardEntry,
} from '@/lib/types/tournament.types';
import type { ConnectionState } from '@/lib/realtime/config';
import { REALTIME_CONFIG } from '@/lib/realtime/config';
import { getReconnectDelay } from '@/lib/realtime/connection';
import {
  applyPredictionUpdate,
  sortLeaderboard,
} from '@/lib/realtime/delta-updates';

function toLeaderboard(predictions: BracketPredictionRow[]): LeaderboardEntry[] {
  const sorted = sortLeaderboard(predictions);
  return sorted.map((p, i) => ({
    id: p.id,
    displayName: p.display_name,
    totalPoints: p.total_points,
    correctCount: p.correct_count,
    rank: i + 1,
  }));
}

interface UseRealtimeLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  isConnected: boolean;
  connectionState: ConnectionState;
  error: string | null;
}

export function useRealtimeLeaderboard(
  tournamentId: string | null
): UseRealtimeLeaderboardReturn {
  const [predictions, setPredictions] = useState<BracketPredictionRow[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef(createClient());

  const fetchPredictions = useCallback(async () => {
    if (!tournamentId) return;

    const { data, error: fetchError } = await supabaseRef.current
      .from('bracket_predictions')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('total_points', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setPredictions(data ?? []);
    setError(null);
  }, [tournamentId]);

  useEffect(() => {
    if (!tournamentId) return;

    const supabase = supabaseRef.current;
    setConnectionState('connecting');

    fetchPredictions();

    const channel = supabase
      .channel(`leaderboard:${tournamentId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'bracket_predictions',
          filter: `tournament_id=eq.${tournamentId}`,
        } as never,
        (payload: {
          eventType: string;
          new: BracketPredictionRow;
        }) => {
          reconnectAttempts.current = 0;
          setConnectionState('connected');

          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            setPredictions((prev) =>
              applyPredictionUpdate(prev, payload.new)
            );
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
            reconnectTimerRef.current = setTimeout(() => {
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
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [tournamentId, fetchPredictions]);

  return {
    leaderboard: toLeaderboard(predictions),
    isConnected: connectionState === 'connected',
    connectionState,
    error,
  };
}
