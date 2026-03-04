'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalPoints: number;
  correctCount: number;
  accuracy: number;
  sessionId: string;
}

interface PredictionLeaderboardProps {
  tournamentId: string;
  currentSessionId?: string;
}

export function PredictionLeaderboard({ tournamentId, currentSessionId }: PredictionLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}/predictions/leaderboard`);
        if (!res.ok) return;
        const json = await res.json();
        setEntries(json.data?.leaderboard ?? []);
      } catch { /* silently fail */ }
      finally { setIsLoading(false); }
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  if (isLoading) return null;
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No predictions submitted yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          Prediction Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_3.5rem] gap-2 border-b pb-2 text-[10px] font-medium text-muted-foreground">
            <span>Rank</span>
            <span>Name</span>
            <span className="text-right">Points</span>
            <span className="text-right">Correct</span>
            <span className="text-right">Acc.</span>
          </div>
          {entries.map((entry) => {
            const isCurrentUser = entry.sessionId === currentSessionId;
            return (
              <div
                key={entry.sessionId}
                className={`grid grid-cols-[2.5rem_1fr_4rem_4rem_3.5rem] items-center gap-2 py-1.5 text-sm ${
                  isCurrentUser ? 'bg-primary/5 rounded -mx-2 px-2' : ''
                }`}
              >
                <span className={`font-mono font-semibold ${
                  entry.rank === 1 ? 'text-yellow-500' :
                  entry.rank === 2 ? 'text-gray-400' :
                  entry.rank === 3 ? 'text-amber-700' : ''
                }`}>
                  #{entry.rank}
                </span>
                <span className="truncate font-medium">
                  {entry.displayName}
                  {isCurrentUser && (
                    <Badge variant="outline" className="ml-1.5 text-[9px]">You</Badge>
                  )}
                </span>
                <span className="text-right font-semibold tabular-nums">{entry.totalPoints}</span>
                <span className="text-right tabular-nums text-muted-foreground">{entry.correctCount}</span>
                <span className="text-right tabular-nums text-muted-foreground">{entry.accuracy}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
