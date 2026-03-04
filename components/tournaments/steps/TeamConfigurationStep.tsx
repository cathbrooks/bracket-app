'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { MIN_TEAM_COUNT, MAX_TEAM_COUNT } from '@/lib/constants';
import type { ParticipantType } from '@/lib/constants';
import { getParticipantLabels } from '@/lib/utils/terminology';
import { nextPowerOfTwo, calculateByes } from '@/lib/utils/validation';
import {
  AlertTriangle,
  Info,
  Timer,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TeamConfigData {
  participantType: ParticipantType;
  teamCount: number;
  teamNames: string[];
  seedingMode: 'manual' | 'time-trial';
  hasRosters: boolean;
  teamRosters: string[][];
}

interface TeamConfigurationStepProps {
  values: TeamConfigData;
  onChange: (data: Partial<TeamConfigData>) => void;
  onValidChange: (valid: boolean) => void;
}

function computeCountValidation(count: number, plural: string) {
  if (count < MIN_TEAM_COUNT) {
    return {
      valid: false,
      error: `Minimum ${MIN_TEAM_COUNT} ${plural.toLowerCase()} required`,
    };
  }
  if (count > MAX_TEAM_COUNT) {
    return {
      valid: false,
      error: `Maximum ${MAX_TEAM_COUNT} ${plural.toLowerCase()} allowed. This limit ensures optimal bracket performance and readability.`,
    };
  }
  return { valid: true, error: null as string | null };
}

export function TeamConfigurationStep({ values, onChange, onValidChange }: TeamConfigurationStepProps) {
  const labels = getParticipantLabels(values.participantType ?? 'teams');
  const isTeams = values.participantType === 'teams';
  const { valid: countValid, error: countError } = computeCountValidation(
    values.teamCount,
    labels.plural
  );
  const allNamesFilled = values.teamNames
    .slice(0, values.teamCount)
    .every((n) => (n ?? '').trim().length > 0);

  // Roster validation: if rosters are enabled, every filled player slot must have a name
  const rosterValid = !values.hasRosters || values.teamRosters
    .slice(0, values.teamCount)
    .every((roster) =>
      (roster ?? []).every((p) => (p ?? '').trim().length > 0)
    );

  const isValid = countValid && allNamesFilled && rosterValid;
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  function handleCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const count = parseInt(e.target.value, 10) || 0;
    const clampedCount = Math.min(count, MAX_TEAM_COUNT + 1);
    const currentNames = values.teamNames;
    const newNames = Array.from({ length: clampedCount }, (_, i) => currentNames[i] ?? '');
    const currentRosters = values.teamRosters ?? [];
    const newRosters = Array.from({ length: clampedCount }, (_, i) => currentRosters[i] ?? []);
    onChange({ teamCount: clampedCount, teamNames: newNames, teamRosters: newRosters });
  }

  function handleNameChange(index: number, name: string) {
    const newNames = [...values.teamNames];
    newNames[index] = name;
    onChange({ teamNames: newNames });
  }

  function handleRosterToggle() {
    if (values.hasRosters) {
      onChange({ hasRosters: false });
    } else {
      // Seed each team with one empty player slot
      const newRosters = Array.from({ length: values.teamCount }, (_, ti) =>
        values.teamRosters?.[ti]?.length ? values.teamRosters[ti] : ['']
      );
      onChange({ hasRosters: true, teamRosters: newRosters });
    }
  }

  function handlePlayerNameChange(teamIndex: number, playerIndex: number, name: string) {
    const newRosters = (values.teamRosters ?? []).map((r, ti) =>
      ti === teamIndex
        ? r.map((p, pi) => (pi === playerIndex ? name : p))
        : r
    );
    onChange({ teamRosters: newRosters });
  }

  function handleAddPlayer(teamIndex: number) {
    const newRosters = (values.teamRosters ?? []).map((r, ti) =>
      ti === teamIndex ? [...r, ''] : r
    );
    onChange({ teamRosters: newRosters });
  }

  function handleRemovePlayer(teamIndex: number, playerIndex: number) {
    const newRosters = (values.teamRosters ?? []).map((r, ti) =>
      ti === teamIndex ? r.filter((_, pi) => pi !== playerIndex) : r
    );
    onChange({ teamRosters: newRosters });
  }

  function toggleTeamExpanded(index: number) {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  const byeCount = values.teamCount >= MIN_TEAM_COUNT ? calculateByes(values.teamCount) : 0;
  const duplicates = findDuplicateNames(values.teamNames);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{labels.singular} Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Set the number of {labels.plural.toLowerCase()} and enter each name (required).
        </p>
      </div>

      <FormItem>
        <FormLabel htmlFor="teamCount" error={!!countError}>
          Number of {labels.plural}
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
          Between {MIN_TEAM_COUNT} and {MAX_TEAM_COUNT} {labels.plural.toLowerCase()}
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
              {byeCount} higher-seeded {labels.singular.toLowerCase()}{byeCount > 1 ? 's' : ''} will receive a first-round bye.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Seeding Method</h3>
          <p className="text-xs text-muted-foreground">
            Choose how {labels.plural.toLowerCase()} will be seeded before the bracket starts.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              value: 'manual' as const,
              label: 'Manual Seeding',
              description: `Assign seed numbers to each ${labels.singular.toLowerCase()} yourself.`,
              icon: ListOrdered,
            },
            {
              value: 'time-trial' as const,
              label: 'Time Trials',
              description: `Record a timed run for each ${labels.singular.toLowerCase()}. Fastest gets seed #1.`,
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
            <FormLabel>{labels.singular} Names (required)</FormLabel>
            <FormDescription>
              Enter a name for each {labels.singular.toLowerCase()}
            </FormDescription>
          </div>

          {!allNamesFilled && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                All {labels.plural.toLowerCase()} must have a name.
              </p>
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Duplicate names detected: {duplicates.join(', ')}
              </p>
            </div>
          )}

          {/* No roster: simple grid of name inputs */}
          {!values.hasRosters ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: values.teamCount }, (_, i) => (
                <Input
                  key={i}
                  placeholder={labels.placeholder(i)}
                  value={values.teamNames[i] ?? ''}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  maxLength={50}
                />
              ))}
            </div>
          ) : (
            /* Rosters enabled: each team is an expandable card */
            <div className="space-y-2">
              {Array.from({ length: values.teamCount }, (_, i) => {
                const isExpanded = expandedTeams.has(i);
                const roster = values.teamRosters?.[i] ?? [];
                const teamName = values.teamNames[i] ?? '';
                const hasMissingPlayers = roster.some((p) => !p.trim());
                return (
                  <div key={i} className="rounded-lg border">
                    {/* Team header row */}
                    <div className="flex items-center gap-2 p-2">
                      <Input
                        placeholder={labels.placeholder(i)}
                        value={teamName}
                        onChange={(e) => handleNameChange(i, e.target.value)}
                        maxLength={50}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => toggleTeamExpanded(i)}
                        className={cn(
                          'flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                          hasMissingPlayers
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <Users className="h-3.5 w-3.5" />
                        {roster.length} player{roster.length !== 1 ? 's' : ''}
                        {isExpanded
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Expanded player list */}
                    {isExpanded && (
                      <div className="border-t bg-muted/30 px-3 pb-3 pt-2 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Players on {teamName || labels.placeholder(i)}
                        </p>

                        {roster.length === 0 && (
                          <p className="text-xs text-muted-foreground italic">
                            No players added yet.
                          </p>
                        )}

                        <div className="space-y-1.5">
                          {roster.map((player, pi) => (
                            <div key={pi} className="flex items-center gap-2">
                              <span className="w-5 text-center text-xs text-muted-foreground shrink-0">
                                {pi + 1}
                              </span>
                              <Input
                                placeholder={`Player ${pi + 1}`}
                                value={player}
                                onChange={(e) => handlePlayerNameChange(i, pi, e.target.value)}
                                maxLength={50}
                                className="h-8 flex-1 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePlayer(i, pi)}
                                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                aria-label={`Remove player ${pi + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => handleAddPlayer(i)}
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add Player
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Roster toggle – only for teams */}
      {isTeams && values.teamCount >= MIN_TEAM_COUNT && values.teamCount <= MAX_TEAM_COUNT && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Team Rosters (optional)</p>
              <p className="text-xs text-muted-foreground">
                Name the players on each team — teams can have different sizes
              </p>
            </div>
            <button
              type="button"
              onClick={handleRosterToggle}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                values.hasRosters ? 'bg-primary' : 'bg-muted'
              )}
              aria-checked={values.hasRosters}
              role="switch"
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  values.hasRosters ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
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
