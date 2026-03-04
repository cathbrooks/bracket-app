'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import type { Team } from '@/lib/types/tournament.types';

interface ManualTimeEntryProps {
  teams: Team[];
  recordedTeamIds: Set<string>;
  onTimeSubmitted: (teamId: string, centiseconds: number) => void;
}

export function ManualTimeEntry({
  teams,
  recordedTeamIds,
  onTimeSubmitted,
}: ManualTimeEntryProps) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [centiseconds, setCentiseconds] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableTeams = teams.filter((t) => !recordedTeamIds.has(t.id));

  function handleSubmit() {
    setError(null);

    if (!selectedTeamId) {
      setError('Please select a team');
      return;
    }

    const mins = parseInt(minutes, 10) || 0;
    const secs = parseInt(seconds, 10) || 0;
    const cs = parseInt(centiseconds, 10) || 0;

    if (secs < 0 || secs > 59) {
      setError('Seconds must be 0-59');
      return;
    }
    if (cs < 0 || cs > 99) {
      setError('Centiseconds must be 0-99');
      return;
    }

    const totalCentiseconds = (mins * 60 * 100) + (secs * 100) + cs;

    if (totalCentiseconds <= 0) {
      setError('Time must be greater than zero');
      return;
    }

    onTimeSubmitted(selectedTeamId, totalCentiseconds);

    setSelectedTeamId('');
    setMinutes('');
    setSeconds('');
    setCentiseconds('');
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Manual Time Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormItem>
          <FormLabel>Team</FormLabel>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select a team...</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
            {teams.filter((t) => recordedTeamIds.has(t.id)).map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} (replace time)
              </option>
            ))}
          </select>
        </FormItem>

        <div className="grid grid-cols-3 gap-3">
          <FormItem>
            <FormLabel>Minutes</FormLabel>
            <Input
              type="number"
              min={0}
              placeholder="00"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </FormItem>
          <FormItem>
            <FormLabel>Seconds</FormLabel>
            <Input
              type="number"
              min={0}
              max={59}
              placeholder="00"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
            />
          </FormItem>
          <FormItem>
            <FormLabel>Centiseconds</FormLabel>
            <Input
              type="number"
              min={0}
              max={99}
              placeholder="00"
              value={centiseconds}
              onChange={(e) => setCentiseconds(e.target.value)}
            />
          </FormItem>
        </div>

        {error && <FormMessage>{error}</FormMessage>}

        <Button onClick={handleSubmit} className="w-full" size="sm">
          Record Time
        </Button>
      </CardContent>
    </Card>
  );
}
