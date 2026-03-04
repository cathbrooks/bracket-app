'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Info } from 'lucide-react';
import { usePredictionData } from '@/contexts/PredictionDataContext';

interface PredictionLeaderboardProps {
  currentSessionId?: string;
}

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-slate-400',
  3: 'text-amber-600',
};

const RANK_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function PredictionLeaderboard({ currentSessionId }: PredictionLeaderboardProps) {
  const { leaderboard, isLoading } = usePredictionData();
  const [showPointsKey, setShowPointsKey] = useState(false);

  if (isLoading) return null;

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No predictions submitted yet.
        </CardContent>
      </Card>
    );
  }

  const hasPoints = leaderboard.some((e) => e.totalPoints > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Prediction Leaderboard
          </CardTitle>
          <button
            type="button"
            onClick={() => setShowPointsKey((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-3 w-3" />
            Points key
          </button>
        </div>

        {showPointsKey && (
          <div className="mt-2 rounded-md bg-muted/50 p-3 text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How points work</p>
            <p>Points double each round — later rounds are worth more:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 font-mono">
              <span>Round 1</span><span className="text-right font-semibold text-foreground">1 pt</span>
              <span>Round 2</span><span className="text-right font-semibold text-foreground">2 pts</span>
              <span>Round 3 (QF)</span><span className="text-right font-semibold text-foreground">4 pts</span>
              <span>Round 4 (SF)</span><span className="text-right font-semibold text-foreground">8 pts</span>
              <span>Finals</span><span className="text-right font-semibold text-foreground">16 pts</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-[2rem_1fr_4.5rem_3.5rem] gap-2 border-b pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>#</span>
          <span>Name</span>
          <span className="text-right">Points</span>
          <span className="text-right">Correct</span>
        </div>

        <div className="mt-1 space-y-0.5">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.sessionId === currentSessionId;
            const isTop3 = entry.rank <= 3;

            return (
              <div
                key={entry.sessionId}
                className={`grid grid-cols-[2rem_1fr_4.5rem_3.5rem] items-center gap-2 rounded py-1.5 text-sm transition-colors ${
                  isCurrentUser
                    ? 'bg-primary/8 px-1 -mx-1 ring-1 ring-primary/20'
                    : ''
                }`}
              >
                <span className={`text-xs font-bold tabular-nums ${RANK_STYLES[entry.rank] ?? 'text-muted-foreground'}`}>
                  {RANK_ICONS[entry.rank] ?? `#${entry.rank}`}
                </span>

                <span className="flex items-center gap-1.5 truncate">
                  <span className={`truncate ${isTop3 ? 'font-semibold' : 'font-medium'}`}>
                    {entry.displayName}
                  </span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="shrink-0 text-[9px] px-1 py-0">You</Badge>
                  )}
                </span>

                <span className={`text-right tabular-nums font-bold ${
                  hasPoints && entry.rank === 1
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-foreground'
                }`}>
                  {entry.totalPoints}
                  <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">pts</span>
                </span>

                <span className="text-right tabular-nums text-xs text-muted-foreground">
                  {entry.correctCount}
                  {entry.accuracy > 0 && (
                    <span className="ml-0.5 text-[10px]">({entry.accuracy}%)</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {!hasPoints && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Points update as matches are completed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
