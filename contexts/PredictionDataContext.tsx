'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalPoints: number;
  correctCount: number;
  accuracy: number;
  sessionId: string;
  predictions: Record<string, string>;
}

interface PredictionDataContextValue {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  /** matchId → teamId → prediction count */
  matchCounts: Map<string, Map<string, number>>;
  /** Trigger an immediate leaderboard refresh */
  refetch: () => void;
}

export const PredictionDataContext = createContext<PredictionDataContextValue>({
  leaderboard: [],
  isLoading: true,
  matchCounts: new Map(),
  refetch: () => {},
});

interface PredictionDataProviderProps {
  tournamentId: string;
  children: ReactNode;
  pollIntervalMs?: number;
}

export function PredictionDataProvider({
  tournamentId,
  children,
  pollIntervalMs = 15000,
}: PredictionDataProviderProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchTick, setFetchTick] = useState(0);
  const tournamentIdRef = useRef(tournamentId);
  tournamentIdRef.current = tournamentId;

  const refetch = useCallback(() => setFetchTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      try {
        const res = await fetch(
          `/api/tournaments/${tournamentIdRef.current}/predictions/leaderboard`
        );
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) setLeaderboard(json.data?.leaderboard ?? []);
      } catch {
        /* silently fail */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tournamentId, pollIntervalMs, fetchTick]);

  const matchCounts = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const entry of leaderboard) {
      for (const [matchId, teamId] of Object.entries(entry.predictions ?? {})) {
        if (!map.has(matchId)) map.set(matchId, new Map());
        const teamMap = map.get(matchId)!;
        teamMap.set(teamId, (teamMap.get(teamId) ?? 0) + 1);
      }
    }
    return map;
  }, [leaderboard]);

  return (
    <PredictionDataContext.Provider value={{ leaderboard, isLoading, matchCounts, refetch }}>
      {children}
    </PredictionDataContext.Provider>
  );
}

export function usePredictionData() {
  return useContext(PredictionDataContext);
}
