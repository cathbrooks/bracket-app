'use client';

import { useState, useEffect } from 'react';
import type { Team } from '@/lib/types/tournament.types';

interface AggregatePredictionCountsProps {
  matchId: string;
  tournamentId: string;
  teamA?: Team | null;
  teamB?: Team | null;
}

export function AggregatePredictionCounts({
  matchId,
  tournamentId,
  teamA,
  teamB,
}: AggregatePredictionCountsProps) {
  const [counts, setCounts] = useState<{ teamA: number; teamB: number }>({ teamA: 0, teamB: 0 });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}/predictions/leaderboard`);
        if (!res.ok) return;
        const json = await res.json();
        const entries = json.data?.leaderboard ?? [];

        let countA = 0;
        let countB = 0;
        for (const entry of entries) {
          if (entry.predictions?.[matchId] === teamA?.id) countA++;
          if (entry.predictions?.[matchId] === teamB?.id) countB++;
        }
        setCounts({ teamA: countA, teamB: countB });
      } catch { /* silently fail */ }
    }

    if (teamA?.id && teamB?.id) fetchCounts();
  }, [matchId, tournamentId, teamA?.id, teamB?.id]);

  const total = counts.teamA + counts.teamB;
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
      <span>{teamA?.name}: {counts.teamA}</span>
      <span className="text-muted-foreground/50">predictions</span>
      <span>{teamB?.name}: {counts.teamB}</span>
    </div>
  );
}
