'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Clock } from 'lucide-react';
import { calculateDuration } from '@/lib/utils/calculation';
import { isPowerOfTwo, nextPowerOfTwo, calculateByes } from '@/lib/utils/validation';
import type { TournamentFormat } from '@/lib/constants';

interface WizardConfig {
  name: string;
  gameType: string;
  format: TournamentFormat;
  grandFinalsReset: boolean;
  teamCount: number;
  teamNames: string[];
  stationCount: number;
  matchDurationMinutes: number;
  bufferTimeMinutes: number;
  seedingMode: 'manual' | 'time-trial';
}

interface ReviewStepProps {
  config: WizardConfig;
  onEditStep: (step: number) => void;
}

export function ReviewStep({ config, onEditStep }: ReviewStepProps) {
  const timePerMatch = config.matchDurationMinutes + config.bufferTimeMinutes;

  const estimate = timePerMatch > 0
    ? calculateDuration({
        format: config.format,
        teamCount: config.teamCount,
        timePerMatchMinutes: timePerMatch,
        stationCount: config.stationCount,
      })
    : null;

  const byeCount = calculateByes(config.teamCount);
  const bracketSize = nextPowerOfTwo(config.teamCount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Verify your tournament settings before creating.
        </p>
      </div>

      {estimate && (
        <div className="flex items-center gap-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estimated Duration</p>
            <p className="text-2xl font-bold text-primary">{estimate.formattedDuration}</p>
            <p className="text-xs text-muted-foreground">
              {estimate.matchCount} matches in {estimate.waves} wave{estimate.waves !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Basic Info" onEdit={() => onEditStep(0)}>
          <ReviewField label="Tournament Name" value={config.name} />
          <ReviewField label="Game" value={config.gameType} />
        </ReviewCard>

        <ReviewCard title="Format" onEdit={() => onEditStep(1)}>
          <ReviewField
            label="Bracket Type"
            value={
              config.format === 'single-elimination'
                ? 'Single Elimination'
                : 'Double Elimination'
            }
          />
          {config.format === 'double-elimination' && (
            <ReviewField
              label="Grand Finals Reset"
              value={config.grandFinalsReset ? 'Enabled' : 'Disabled'}
            />
          )}
        </ReviewCard>

        <ReviewCard title="Teams" onEdit={() => onEditStep(2)}>
          <ReviewField label="Team Count" value={String(config.teamCount)} />
          <ReviewField
            label="Seeding"
            value={config.seedingMode === 'time-trial' ? 'Time Trials' : 'Manual'}
          />
          {byeCount > 0 && (
            <ReviewField
              label="Bracket Size"
              value={`${bracketSize} (${byeCount} bye${byeCount !== 1 ? 's' : ''})`}
            />
          )}
          {config.teamNames.filter(n => n.trim()).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {config.teamNames.map((name, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {name.trim() || `Team ${i + 1}`}
                </Badge>
              ))}
            </div>
          )}
        </ReviewCard>

        <ReviewCard title="Timing" onEdit={() => onEditStep(3)}>
          <ReviewField label="Match Duration" value={`${config.matchDurationMinutes} min`} />
          <ReviewField label="Buffer Time" value={`${config.bufferTimeMinutes} min`} />
          <ReviewField label="Stations" value={String(config.stationCount)} />
        </ReviewCard>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
