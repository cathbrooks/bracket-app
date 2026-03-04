'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Tournament, Team, Match } from '@/lib/types/tournament.types';
import { createClient } from '@/lib/supabase/client';

interface BracketViewProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  isOrganizer?: boolean;
}

function MatchCard({
  match,
  teams,
  isOrganizer,
  onSelectWinner,
  loading,
}: {
  match: Match;
  teams: Team[];
  isOrganizer?: boolean;
  onSelectWinner?: (matchId: string, winnerId: string) => void;
  loading?: boolean;
}) {
  const teamA = teams.find((t) => t.id === match.teamAId);
  const teamB = teams.find((t) => t.id === match.teamBId);
  const winner = teams.find((t) => t.id === match.winnerTeamId);

  if (match.isBye) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Bye — {teamA?.name ?? teamB?.name ?? 'TBD'} advances
      </div>
    );
  }

  const canReport =
    isOrganizer &&
    match.state !== 'completed' &&
    teamA &&
    teamB &&
    onSelectWinner;

  return (
    <div className="rounded-md border bg-card p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div
            className={`truncate ${match.winnerTeamId === match.teamAId ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
          >
            {teamA?.name ?? 'TBD'}
          </div>
          <div
            className={`truncate ${match.winnerTeamId === match.teamBId ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
          >
            {teamB?.name ?? 'TBD'}
          </div>
        </div>
        <Badge
          variant={
            match.state === 'completed'
              ? 'secondary'
              : match.state === 'in-progress'
                ? 'default'
                : 'outline'
          }
        >
          {match.state === 'completed' && winner ? 'Done' : match.state}
        </Badge>
      </div>

      {canReport && (
        <div className="mt-2 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            disabled={loading}
            onClick={() => onSelectWinner(match.id, teamA.id)}
          >
            {teamA.name} wins
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            disabled={loading}
            onClick={() => onSelectWinner(match.id, teamB.id)}
          >
            {teamB.name} wins
          </Button>
        </div>
      )}
    </div>
  );
}

export function BracketView({ tournament, teams, matches, isOrganizer }: BracketViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [...new Set(matches.map((m) => m.bracketCategory ?? 'winners'))];

  async function handleSelectWinner(matchId: string, winnerId: string) {
    setLoading(true);
    setError(null);

    try {
      const match = matches.find((m) => m.id === matchId);
      if (match && match.state === 'pending') {
        const supabase = createClient();
        await supabase
          .from('matches')
          .update({ state: 'in-progress', started_at: new Date().toISOString() } as never)
          .eq('id', matchId);
      }

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc('advance_match_winner', {
        p_match_id: matchId,
        p_winner_team_id: winnerId,
      });

      if (rpcError) throw new Error(rpcError.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record result');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {categories.map((category) => {
        const categoryMatches = matches.filter(
          (m) => (m.bracketCategory ?? 'winners') === category
        );
        const catRounds = new Map<number, Match[]>();
        for (const m of categoryMatches) {
          if (!catRounds.has(m.round)) catRounds.set(m.round, []);
          catRounds.get(m.round)!.push(m);
        }
        const sortedCatRounds = Array.from(catRounds.entries()).sort(([a], [b]) => a - b);

        return (
          <div key={category}>
            {categories.length > 1 && (
              <h2 className="mb-3 text-lg font-semibold capitalize">{category} Bracket</h2>
            )}
            <div className="flex gap-6 overflow-x-auto pb-4">
              {sortedCatRounds.map(([round, roundMatches]) => (
                <div key={round} className="flex-shrink-0" style={{ minWidth: 220 }}>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Round {round}
                  </h3>
                  <div className="space-y-3">
                    {roundMatches.map((m) => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        teams={teams}
                        isOrganizer={isOrganizer}
                        onSelectWinner={handleSelectWinner}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
