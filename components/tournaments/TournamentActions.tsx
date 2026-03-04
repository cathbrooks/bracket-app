'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tournament } from '@/lib/types/tournament.types';

interface TournamentActionsProps {
  tournament: Tournament;
}

const NEXT_STATE: Record<string, { label: string; target: string } | null> = {
  draft: { label: 'Start Tournament', target: 'in-progress' },
  registration: { label: 'Start Tournament', target: 'in-progress' },
  seeding: { label: 'Start Tournament', target: 'in-progress' },
  'in-progress': null,
  completed: null,
};

export function TournamentActions({ tournament }: TournamentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextState = NEXT_STATE[tournament.state];

  async function advanceState() {
    if (!nextState) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState.target }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to update tournament');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTournament() {
    if (!confirm('Are you sure you want to delete this tournament? This cannot be undone.')) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete tournament');
      router.push('/organizer/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {nextState && (
            <Button onClick={advanceState} disabled={loading}>
              {loading ? 'Updating...' : nextState.label}
            </Button>
          )}
          {tournament.state === 'draft' && (
            <Button variant="destructive" onClick={deleteTournament} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Tournament'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
