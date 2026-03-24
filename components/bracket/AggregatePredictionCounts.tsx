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

  const rateA = Math.round((countA / total) * 100);
  const rateB = 100 - rateA;

  return (
    <div className="pt-1 space-y-0.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate max-w-[45%]">{teamA?.name}</span>
        <span className="shrink-0 text-muted-foreground/50">{total} picks</span>
        <span className="truncate max-w-[45%] text-right">{teamB?.name}</span>
      </div>
      <div className="flex items-center gap-0.5 text-[10px]">
        <span className="w-7 text-right font-medium text-primary/80">{rateA}%</span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary/50 rounded-full" style={{ width: `${rateA}%` }} />
        </div>
        <span className="w-7 font-medium text-muted-foreground">{rateB}%</span>
      </div>
    </div>
  );
}
