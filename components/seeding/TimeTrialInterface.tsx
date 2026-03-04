'use client';

import { useState, useCallback } from 'react';
import { Stopwatch } from './Stopwatch';
import { ManualTimeEntry } from './ManualTimeEntry';
import { TimeTrialLeaderboard } from './TimeTrialLeaderboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils/format';
import { Check, Clock, ListOrdered } from 'lucide-react';
import type { Team } from '@/lib/types/tournament.types';

interface RecordedTime {
  teamId: string;
  teamName: string;
  centiseconds: number;
}

interface LeaderboardEntry {
  teamId: string;
  name: string;
  seed: number;
  timeCentiseconds: number;
  isTied: boolean;
}

interface TimeTrialInterfaceProps {
  tournamentId: string;
  teams: Team[];
  stationCount: number;
  onComplete: () => void;
}

type Phase = 'timing' | 'leaderboard';

export function TimeTrialInterface({
  tournamentId,
  teams,
  stationCount,
  onComplete,
}: TimeTrialInterfaceProps) {
  const [phase, setPhase] = useState<Phase>('timing');
  const [recordedTimes, setRecordedTimes] = useState<Map<string, RecordedTime>>(new Map());
  const [pendingTime, setPendingTime] = useState<{ centiseconds: number; station: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordedTeamIds = new Set(recordedTimes.keys());
  const unrecordedTeams = teams.filter((t) => !recordedTeamIds.has(t.id));
  const allTimesRecorded = recordedTimes.size === teams.length;

  const handleStopwatchTime = useCallback((centiseconds: number, station: number) => {
    setPendingTime({ centiseconds, station });
  }, []);

  async function assignTimeToTeam(teamId: string, centiseconds: number) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    try {
      const timeSeconds = centiseconds / 100;
      const response = await fetch(
        `/api/tournaments/${tournamentId}/teams/${teamId}/time`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSeconds }),
        }
      );

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? 'Failed to record time');
      }

      setRecordedTimes((prev) => {
        const next = new Map(prev);
        next.set(teamId, { teamId, teamName: team.name, centiseconds });
        return next;
      });
      setPendingTime(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save time');
    }
  }

  function handleManualTimeSubmit(teamId: string, centiseconds: number) {
    assignTimeToTeam(teamId, centiseconds);
  }

  async function handleGenerateLeaderboard() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/leaderboard`, {
        method: 'POST',
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to generate leaderboard');
      }

      setLeaderboard(json.data.leaderboard);
      setPhase('leaderboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmSeeds() {
    setIsSubmitting(true);
    try {
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (phase === 'leaderboard') {
    return (
      <TimeTrialLeaderboard
        entries={leaderboard}
        onConfirm={handleConfirmSeeds}
        onEdit={() => setPhase('timing')}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Time Trials</h2>
        <p className="text-sm text-muted-foreground">
          Time each team using the stopwatches or enter times manually.
          Record times for all {teams.length} teams to generate the leaderboard.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Badge variant={allTimesRecorded ? 'default' : 'secondary'}>
          {recordedTimes.size}/{teams.length} recorded
        </Badge>
        {allTimesRecorded && (
          <Badge variant="default" className="bg-green-600">
            <Check className="mr-1 h-3 w-3" />
            All times recorded
          </Badge>
        )}
      </div>

      {/* Team assignment dialog when a stopwatch has a pending time */}
      {pendingTime && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium">
              Assign time {formatTime(pendingTime.centiseconds)} from Station {pendingTime.station} to:
            </p>
            <div className="flex flex-wrap gap-2">
              {unrecordedTeams.map((team) => (
                <Button
                  key={team.id}
                  size="sm"
                  variant="outline"
                  onClick={() => assignTimeToTeam(team.id, pendingTime.centiseconds)}
                >
                  {team.name}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPendingTime(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stopwatch grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: stationCount }, (_, i) => (
          <Stopwatch
            key={i}
            stationNumber={i + 1}
            onTimeRecorded={(cs) => handleStopwatchTime(cs, i + 1)}
            disabled={!!pendingTime}
          />
        ))}
      </div>

      <ManualTimeEntry
        teams={teams}
        recordedTeamIds={recordedTeamIds}
        onTimeSubmitted={handleManualTimeSubmit}
      />

      {/* Recorded times summary */}
      {recordedTimes.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Recorded Times</p>
            </div>
            <div className="space-y-1">
              {Array.from(recordedTimes.values())
                .sort((a, b) => a.centiseconds - b.centiseconds)
                .map((rec) => (
                  <div key={rec.teamId} className="flex justify-between text-sm">
                    <span>{rec.teamName}</span>
                    <span className="font-mono tabular-nums">
                      {formatTime(rec.centiseconds)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleGenerateLeaderboard}
          disabled={!allTimesRecorded}
          loading={isSubmitting}
          className="gap-2"
        >
          <ListOrdered className="h-4 w-4" />
          Generate Leaderboard
        </Button>
      </div>
    </div>
  );
}
