'use client';

import { usePredictionData } from '@/contexts/PredictionDataContext';
import type { Team } from '@/lib/types/tournament.types';

interface AggregatePredictionCountsProps {
  matchId: string;
  teamA?: Team | null;
  teamB?: Team | null;
}

export function AggregatePredictionCounts({
  matchId,
  teamA,
  teamB,
}: AggregatePredictionCountsProps) {
  const { matchCounts } = usePredictionData();

  const teamCounts = matchCounts.get(matchId);
  const countA = teamCounts?.get(teamA?.id ?? '') ?? 0;
  const countB = teamCounts?.get(teamB?.id ?? '') ?? 0;

  const total = countA + countB;
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
      <span>{teamA?.name}: {countA}</span>
      <span className="text-muted-foreground/50">predictions</span>
      <span>{teamB?.name}: {countB}</span>
    </div>
  );
}
