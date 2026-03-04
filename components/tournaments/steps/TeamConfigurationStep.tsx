'use client';

import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { MIN_TEAM_COUNT, MAX_TEAM_COUNT } from '@/lib/constants';
import { isPowerOfTwo, nextPowerOfTwo, calculateByes } from '@/lib/utils/validation';
import { AlertTriangle, Info, Timer, ListOrdered } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TeamConfigData {
  teamCount: number;
  teamNames: string[];
  seedingMode: 'manual' | 'time-trial';
}

interface TeamConfigurationStepProps {
  values: TeamConfigData;
  onChange: (data: TeamConfigData) => void;
  onValidChange: (valid: boolean) => void;
}

export function TeamConfigurationStep({ values, onChange, onValidChange }: TeamConfigurationStepProps) {
  const [countError, setCountError] = useState<string | null>(null);

  const validateCount = useCallback((count: number) => {
    if (count < MIN_TEAM_COUNT) {
      setCountError(`Minimum ${MIN_TEAM_COUNT} teams required`);
      return false;
    }
    if (count > MAX_TEAM_COUNT) {
      setCountError(`Maximum ${MAX_TEAM_COUNT} teams allowed. This limit ensures optimal bracket performance and readability.`);
      return false;
    }
    setCountError(null);
    return true;
  }, []);

  useEffect(() => {
    onValidChange(validateCount(values.teamCount));
  }, [values.teamCount, onValidChange, validateCount]);

  function handleCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const count = parseInt(e.target.value, 10) || 0;
    const clampedCount = Math.min(count, MAX_TEAM_COUNT + 1);

    const currentNames = values.teamNames;
    const newNames = Array.from({ length: clampedCount }, (_, i) =>
      currentNames[i] ?? ''
    );

    onChange({ teamCount: clampedCount, teamNames: newNames });
  }

  function handleNameChange(index: number, name: string) {
    const newNames = [...values.teamNames];
    newNames[index] = name;
    onChange({ ...values, teamNames: newNames });
  }

  const byeCount = values.teamCount >= MIN_TEAM_COUNT ? calculateByes(values.teamCount) : 0;
  const duplicates = findDuplicateNames(values.teamNames);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Team Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Set the number of teams and optionally name them.
        </p>
      </div>

      <FormItem>
        <FormLabel htmlFor="teamCount" error={!!countError}>
          Number of Teams
        </FormLabel>
        <Input
          id="teamCount"
          type="number"
          min={MIN_TEAM_COUNT}
          max={MAX_TEAM_COUNT}
          value={values.teamCount || ''}
          onChange={handleCountChange}
        />
        <FormMessage>{countError}</FormMessage>
        <FormDescription>
          Between {MIN_TEAM_COUNT} and {MAX_TEAM_COUNT} teams
        </FormDescription>
      </FormItem>

      {byeCount > 0 && values.teamCount >= MIN_TEAM_COUNT && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Bracket will expand to {nextPowerOfTwo(values.teamCount)} slots
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              {byeCount} higher-seeded team{byeCount > 1 ? 's' : ''} will receive a first-round bye.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Seeding Method</h3>
          <p className="text-xs text-muted-foreground">
            Choose how teams will be seeded before the bracket starts.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              value: 'manual' as const,
              label: 'Manual Seeding',
              description: 'Assign seed numbers to each team yourself.',
              icon: ListOrdered,
            },
            {
              value: 'time-trial' as const,
              label: 'Time Trials',
              description: 'Record a timed run for each team. Fastest gets seed #1.',
              icon: Timer,
            },
          ].map((option) => {
            const isSelected = values.seedingMode === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ ...values, seedingMode: option.value })}
                className={cn(
                  'flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all hover:border-primary/50',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {values.teamCount >= MIN_TEAM_COUNT && values.teamCount <= MAX_TEAM_COUNT && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Team Names</FormLabel>
            <FormDescription>
              Leave blank for default names (Team 1, Team 2, etc.)
            </FormDescription>
          </div>

          {duplicates.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Duplicate names detected: {duplicates.join(', ')}
              </p>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: values.teamCount }, (_, i) => (
              <Input
                key={i}
                placeholder={`Team ${i + 1}`}
                value={values.teamNames[i] ?? ''}
                onChange={(e) => handleNameChange(i, e.target.value)}
                maxLength={50}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function findDuplicateNames(names: string[]): string[] {
  const filled = names.filter((n) => n.trim().length > 0).map((n) => n.trim());
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const name of filled) {
    if (seen.has(name.toLowerCase())) {
      duplicates.add(name);
    }
    seen.add(name.toLowerCase());
  }
  return Array.from(duplicates);
}
