'use client';

import { useStopwatch } from '@/hooks/useStopwatch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime } from '@/lib/utils/format';
import { Play, Square, RotateCcw, Flag, UserCheck } from 'lucide-react';

interface StopwatchProps {
  stationNumber: number;
  onTimeRecorded: (centiseconds: number) => void;
  disabled?: boolean;
}

export function Stopwatch({ stationNumber, onTimeRecorded, disabled = false }: StopwatchProps) {
  const { centiseconds, isRunning, lapTimes, finalTime, start, stop, lap, reset } = useStopwatch();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Station {stationNumber}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="font-mono text-4xl font-bold tabular-nums tracking-tight">
            {formatTime(centiseconds)}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {!isRunning && finalTime === null && (
            <Button
              size="sm"
              onClick={start}
              disabled={disabled}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Start
            </Button>
          )}

          {isRunning && (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={stop}
                className="gap-1.5"
              >
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={lap}
                className="gap-1.5"
              >
                <Flag className="h-3.5 w-3.5" />
                Lap
              </Button>
            </>
          )}

          {!isRunning && finalTime !== null && (
            <>
              <Button
                size="sm"
                onClick={() => onTimeRecorded(finalTime)}
                className="gap-1.5"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={reset}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </>
          )}
        </div>

        {lapTimes.length > 0 && (
          <div className="space-y-1 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Laps</p>
            {lapTimes.map((time, i) => (
              <div key={i} className="flex justify-between text-xs tabular-nums">
                <span className="text-muted-foreground">Lap {i + 1}</span>
                <span className="font-mono">{formatTime(time)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
