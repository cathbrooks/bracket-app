'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Team } from '@/lib/types/tournament.types';
import type { ParticipantType } from '@/lib/constants';
import { getParticipantLabels } from '@/lib/utils/terminology';

interface ManualSeedingInterfaceProps {
  tournamentId: string;
  teams: Team[];
  participantType: ParticipantType;
  onComplete: () => void;
}

interface SeedEntry {
  teamId: string;
  teamName: string;
  seed: number | null;
}

export function ManualSeedingInterface({
  tournamentId,
  teams,
  participantType,
  onComplete,
}: ManualSeedingInterfaceProps) {
  const labels = getParticipantLabels(participantType);
  const [entries, setEntries] = useState<SeedEntry[]>(
    teams.map((t) => ({
      teamId: t.id,
      teamName: t.name,
      seed: t.seed,
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const seedValues = entries.map((e) => e.seed).filter((s): s is number => s !== null);
  const duplicateSeeds = seedValues.filter((s, i) => seedValues.indexOf(s) !== i);
  const allAssigned = entries.every((e) => e.seed !== null && e.seed >= 1);
  const noDuplicates = new Set(seedValues).size === seedValues.length;
  const isValid = allAssigned && noDuplicates && seedValues.length === teams.length;

  function handleSeedChange(index: number, value: string) {
    const num = parseInt(value, 10);
    const updated = [...entries];
    updated[index] = { ...updated[index], seed: isNaN(num) ? null : num };
    setEntries(updated);
  }

  async function handleSubmit() {
    if (!isValid) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/seeds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seeds: entries.map((e) => ({
            teamId: e.teamId,
            seed: e.seed!,
          })),
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to assign seeds');
      }

      onComplete();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Manual Seeding</h2>
        <p className="text-sm text-muted-foreground">
          Assign a unique seed (1 to {teams.length}) to each {labels.singular.toLowerCase()}. Seed 1 is the strongest.
        </p>
      </div>

      {submitError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seed Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.map((entry, index) => {
            const isDuplicate = entry.seed !== null && duplicateSeeds.includes(entry.seed);
            const outOfRange = entry.seed !== null && (entry.seed < 1 || entry.seed > teams.length);

            return (
              <div key={entry.teamId} className="flex items-center gap-3">
                <div className="w-8 text-center text-sm text-muted-foreground">
                  #{index + 1}
                </div>
                <div className="flex-1 text-sm font-medium">{entry.teamName}</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={teams.length}
                    value={entry.seed ?? ''}
                    onChange={(e) => handleSeedChange(index, e.target.value)}
                    className={cn(
                      'w-20 text-center',
                      isDuplicate && 'border-destructive',
                      outOfRange && 'border-destructive'
                    )}
                    placeholder="—"
                  />
                  {entry.seed !== null && !isDuplicate && !outOfRange && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {isDuplicate && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {duplicateSeeds.length > 0 && (
        <FormMessage>
          Duplicate seeds detected: {[...new Set(duplicateSeeds)].join(', ')}. Each seed must be unique.
        </FormMessage>
      )}

      {!allAssigned && seedValues.length > 0 && (
        <FormMessage>
          All {labels.plural.toLowerCase()} must have a seed assigned before proceeding.
        </FormMessage>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          loading={isSubmitting}
        >
          Confirm Seeds
        </Button>
      </div>
    </div>
  );
}
