'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRealtimeBracket } from './useRealtimeBracket';
import type { Tournament, Match, Team } from '@/lib/types/tournament.types';
import { toMatch } from '@/lib/types/tournament.types';

interface UseBracketDataOptions {
  tournamentId?: string;
  joinCode?: string;
}

interface UseBracketDataReturn {
  tournament: Tournament | null;
  matches: Match[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  connectionState: string;
  refetch: () => void;
}

export function useBracketData({ tournamentId, joinCode }: UseBracketDataOptions): UseBracketDataReturn {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [initialMatches, setInitialMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = joinCode
        ? `/api/view/${joinCode}`
        : `/api/tournaments/${tournamentId}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to load bracket');
      }

      setTournament(json.data.tournament);
      setTeams(json.data.tournament.teams ?? []);
      setInitialMatches(json.data.tournament.matches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, joinCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resolvedId = tournament?.id ?? tournamentId ?? '';
  const {
    matches: realtimeMatchRows,
    connectionState,
  } = useRealtimeBracket(resolvedId);

  const realtimeMatches = useMemo(
    () => realtimeMatchRows.map((row) => toMatch(row)),
    [realtimeMatchRows]
  );

  const matches = realtimeMatches.length > 0 ? realtimeMatches : initialMatches;

  return {
    tournament,
    matches,
    teams,
    isLoading,
    error,
    connectionState,
    refetch: fetchData,
  };
}
