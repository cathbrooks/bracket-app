'use client';

import { useEffect, useState } from 'react';
import { ManualSeedingInterface } from './ManualSeedingInterface';
import { TimeTrialInterface } from './TimeTrialInterface';
import { Loader2 } from 'lucide-react';
import type { Tournament, Team } from '@/lib/types/tournament.types';

interface SeedingWorkflowProps {
  tournamentId: string;
  onComplete: () => void;
}

export function SeedingWorkflow({ tournamentId, onComplete }: SeedingWorkflowProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load tournament');
        setTournament(json.data.tournament);
        setTeams(json.data.tournament.teams ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error ?? 'Tournament not found'}
      </div>
    );
  }

  const participantType = tournament.participantType ?? 'teams';

  if (tournament.seedingMode === 'time-trial') {
    return (
      <TimeTrialInterface
        tournamentId={tournamentId}
        teams={teams}
        participantType={participantType}
        stationCount={tournament.stationCount ?? 1}
        onComplete={onComplete}
      />
    );
  }

  return (
    <ManualSeedingInterface
      tournamentId={tournamentId}
      teams={teams}
      participantType={participantType}
      onComplete={onComplete}
    />
  );
}
