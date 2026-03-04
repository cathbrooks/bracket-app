'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tournament } from '@/lib/types/tournament.types';

interface TournamentSettingsFormProps {
  tournament: Tournament;
}

export function TournamentSettingsForm({ tournament }: TournamentSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(tournament.name);
  const [gameType, setGameType] = useState(tournament.gameType);
  const [stationCount, setStationCount] = useState(tournament.stationCount ?? 1);
  const [timePerMatch, setTimePerMatch] = useState(tournament.timePerMatchMinutes ?? 0);
  const [seedingMode, setSeedingMode] = useState(tournament.seedingMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDraft = tournament.state === 'draft';

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const body: Record<string, unknown> = {};
      if (name !== tournament.name) body.name = name;
      if (gameType !== tournament.gameType) body.gameType = gameType;
      if (stationCount !== tournament.stationCount) body.stationCount = stationCount;
      if (timePerMatch !== tournament.timePerMatchMinutes)
        body.timePerMatchMinutes = timePerMatch || null;
      if (seedingMode !== tournament.seedingMode) body.seedingMode = seedingMode;

      if (Object.keys(body).length === 0) {
        setSuccess('No changes to save.');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save settings');
      setSuccess('Settings saved.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Tournament Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
        )}
        {!isDraft && (
          <div className="mb-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Some settings can only be changed while the tournament is in draft state.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <FormItem>
            <FormLabel htmlFor="name">Tournament Name</FormLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isDraft}
              minLength={3}
              maxLength={100}
            />
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="gameType">Game Type</FormLabel>
            <Input
              id="gameType"
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              disabled={!isDraft}
              maxLength={50}
            />
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="stations">Stations</FormLabel>
            <Input
              id="stations"
              type="number"
              min={1}
              max={16}
              value={stationCount}
              onChange={(e) => setStationCount(parseInt(e.target.value) || 1)}
            />
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="timePerMatch">Time per Match (minutes)</FormLabel>
            <Input
              id="timePerMatch"
              type="number"
              min={0}
              max={480}
              value={timePerMatch}
              onChange={(e) => setTimePerMatch(parseInt(e.target.value) || 0)}
            />
            <FormMessage>
              Set to 0 to leave unspecified.
            </FormMessage>
          </FormItem>

          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Format:</span>{' '}
              {tournament.format === 'double-elimination'
                ? 'Double Elimination'
                : 'Single Elimination'}
            </p>
          </div>

          <FormItem>
            <FormLabel htmlFor="seedingMode">Seeding Mode</FormLabel>
            <Select
              value={seedingMode}
              onValueChange={(v) => setSeedingMode(v as 'manual' | 'time-trial')}
              disabled={!isDraft}
            >
              <SelectTrigger id="seedingMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="time-trial">Time Trials</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage>
              {!isDraft ? 'Seeding mode can only be changed in draft state.' : null}
            </FormMessage>
          </FormItem>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
