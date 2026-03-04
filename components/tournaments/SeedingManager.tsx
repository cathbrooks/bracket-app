'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tournament, Team } from '@/lib/types/tournament.types';
import { formatTime } from '@/lib/utils';

interface SeedingManagerProps {
  tournament: Tournament;
  initialTeams: Team[];
}

export function SeedingManager({ tournament, initialTeams }: SeedingManagerProps) {
  const router = useRouter();
  const [seeds, setSeeds] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialTeams.forEach((t) => {
      if (t.seed) map[t.id] = t.seed;
    });
    return map;
  });
  const [timeTrials, setTimeTrials] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialTeams.forEach((t) => {
      if (t.timeTrialResultSeconds != null) map[t.id] = String(t.timeTrialResultSeconds);
    });
    return map;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isManual = tournament.seedingMode === 'manual';
  const isEditable = tournament.state === 'draft' || tournament.state === 'seeding';

  async function saveManualSeeds() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const seedList = Object.entries(seeds)
      .filter(([, seed]) => seed > 0)
      .map(([teamId, seed]) => ({ teamId, seed }));

    if (seedList.length < 2) {
      setError('At least 2 teams must be seeded.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/seeds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seeds: seedList }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save seeds');
      setSuccess('Seeds saved successfully.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function autoAssign() {
    const newSeeds: Record<string, number> = {};
    initialTeams.forEach((t, i) => {
      newSeeds[t.id] = i + 1;
    });
    setSeeds(newSeeds);
  }

  async function saveAllTimes() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const entries = Object.entries(timeTrials).filter(([, v]) => v.trim() !== '');
    if (entries.length === 0) {
      setError('Enter at least one time before saving.');
      setLoading(false);
      return;
    }

    const errors: string[] = [];

    for (const [teamId, raw] of entries) {
      const seconds = parseFloat(raw);
      if (isNaN(seconds) || seconds <= 0) {
        const name = initialTeams.find((t) => t.id === teamId)?.name ?? teamId;
        errors.push(`${name}: invalid time`);
        continue;
      }

      try {
        const res = await fetch(`/api/tournaments/${tournament.id}/teams/${teamId}/time`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSeconds: seconds }),
        });
        const json = await res.json();
        if (!res.ok) {
          const name = initialTeams.find((t) => t.id === teamId)?.name ?? teamId;
          errors.push(`${name}: ${json.error ?? 'failed'}`);
        }
      } catch {
        const name = initialTeams.find((t) => t.id === teamId)?.name ?? teamId;
        errors.push(`${name}: network error`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('; '));
    } else {
      setSuccess(`Saved times for ${entries.length} team${entries.length > 1 ? 's' : ''}.`);
    }

    setLoading(false);
    router.refresh();
  }

  async function generateSeeds() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/leaderboard`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate seeds');
      setSuccess('Seeds generated from time trial results! Fastest team gets seed #1.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const allTimesEntered = initialTeams.every(
    (t) => t.timeTrialResultSeconds != null || (timeTrials[t.id] && parseFloat(timeTrials[t.id]) > 0)
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
      )}

      {isManual ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manual Seeding</CardTitle>
              {isEditable && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={autoAssign}>
                    Auto-Assign 1–{initialTeams.length}
                  </Button>
                  <Button size="sm" onClick={saveManualSeeds} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Seeds'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {initialTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                >
                  <div className="w-16">
                    {isEditable ? (
                      <Input
                        type="number"
                        min={1}
                        max={initialTeams.length}
                        value={seeds[team.id] ?? ''}
                        onChange={(e) =>
                          setSeeds((s) => ({
                            ...s,
                            [team.id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="h-8 text-center text-sm"
                      />
                    ) : (
                      <Badge variant="outline">
                        {team.seed ? `#${team.seed}` : '—'}
                      </Badge>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium">{team.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Time Trial Seeding</CardTitle>
              <CardDescription>
                Enter each team&apos;s time trial result in seconds. The fastest team will be
                seeded #1. Save all times, then generate seeds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialTeams.map((team) => {
                  const hasSavedTime = team.timeTrialResultSeconds != null;
                  return (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 rounded-md border px-4 py-3"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{team.name}</div>
                        {hasSavedTime && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            Recorded: {formatTime(team.timeTrialResultSeconds!)}
                          </div>
                        )}
                      </div>

                      {isEditable ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="e.g. 45.32"
                            value={timeTrials[team.id] ?? ''}
                            onChange={(e) =>
                              setTimeTrials((tt) => ({ ...tt, [team.id]: e.target.value }))
                            }
                            className="h-9 w-32 text-sm font-mono"
                          />
                          <span className="text-xs text-muted-foreground">sec</span>
                        </div>
                      ) : (
                        <Badge variant={hasSavedTime ? 'secondary' : 'outline'}>
                          {hasSavedTime
                            ? formatTime(team.timeTrialResultSeconds!)
                            : 'No time'}
                        </Badge>
                      )}

                      {team.seed != null && (
                        <Badge variant="default">Seed #{team.seed}</Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {isEditable && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={saveAllTimes} disabled={loading}>
                    {loading ? 'Saving...' : 'Save All Times'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateSeeds}
                    disabled={loading || !allTimesEntered}
                    title={
                      allTimesEntered
                        ? 'Generate seeds from recorded times'
                        : 'Save times for all teams first'
                    }
                  >
                    {loading ? 'Generating...' : 'Generate Seeds from Times'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {!isEditable && (
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...initialTeams]
                    .filter((t) => t.seed != null)
                    .sort((a, b) => a.seed! - b.seed!)
                    .map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                      >
                        <Badge variant="default" className="w-12 justify-center">
                          #{team.seed}
                        </Badge>
                        <span className="flex-1 text-sm font-medium">{team.name}</span>
                        {team.timeTrialResultSeconds != null && (
                          <span className="font-mono text-sm text-muted-foreground">
                            {formatTime(team.timeTrialResultSeconds)}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
