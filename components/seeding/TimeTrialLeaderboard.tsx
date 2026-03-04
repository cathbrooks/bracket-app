'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils/format';
import { Trophy, Pencil } from 'lucide-react';

interface LeaderboardEntry {
  teamId: string;
  name: string;
  seed: number;
  timeCentiseconds: number;
  isTied: boolean;
}

interface TimeTrialLeaderboardProps {
  entries: LeaderboardEntry[];
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting?: boolean;
}

export function TimeTrialLeaderboard({
  entries,
  onConfirm,
  onEdit,
  isSubmitting = false,
}: TimeTrialLeaderboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Time Trial Leaderboard</h2>
        <p className="text-sm text-muted-foreground">
          Seeds are assigned based on fastest times. Review before confirming.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" />
            Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-[3rem_1fr_6rem_4rem] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
              <span>Rank</span>
              <span>Team</span>
              <span className="text-right">Time</span>
              <span className="text-center">Seed</span>
            </div>
            {entries.map((entry) => (
              <div
                key={entry.teamId}
                className="grid grid-cols-[3rem_1fr_6rem_4rem] items-center gap-2 py-2 text-sm"
              >
                <span className="font-mono font-semibold">
                  {entry.seed <= 3 ? (
                    <span className={
                      entry.seed === 1
                        ? 'text-yellow-500'
                        : entry.seed === 2
                          ? 'text-gray-400'
                          : 'text-amber-700'
                    }>
                      #{entry.seed}
                    </span>
                  ) : (
                    `#${entry.seed}`
                  )}
                </span>
                <span className="font-medium">
                  {entry.name}
                  {entry.isTied && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Tied
                    </Badge>
                  )}
                </span>
                <span className="text-right font-mono tabular-nums">
                  {formatTime(entry.timeCentiseconds)}
                </span>
                <span className="text-center font-semibold text-primary">
                  {entry.seed}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Times
        </Button>
        <Button onClick={onConfirm} loading={isSubmitting}>
          Confirm Seeds
        </Button>
      </div>
    </div>
  );
}
