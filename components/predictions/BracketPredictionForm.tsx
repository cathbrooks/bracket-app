'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { groupByRound } from '@/lib/utils/bracket-layout';
import type { Match, Team, Tournament } from '@/lib/types/tournament.types';

interface BracketPredictionFormProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onSubmitted: () => void;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('bracket-session-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('bracket-session-id', id);
  }
  return id;
}

export function BracketPredictionForm({
  tournament,
  matches,
  teams,
  onSubmitted,
}: BracketPredictionFormProps) {
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const playableMatches = useMemo(
    () => matches.filter((m) => !m.isBye),
    [matches]
  );

  const rounds = useMemo(() => groupByRound(playableMatches), [playableMatches]);

  const totalRequired = playableMatches.length;
  const filledCount = Object.keys(predictions).length;
  const isComplete = filledCount === totalRequired;

  function handlePick(matchId: string, teamId: string) {
    setPredictions((prev) => ({ ...prev, [matchId]: teamId }));
  }

  async function handleSubmit() {
    if (!isComplete) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          predictions,
          sessionId: getSessionId(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to submit predictions');

      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Bracket Prediction Challenge</h2>
        <p className="text-sm text-muted-foreground">
          Pick the winner for every match. Predictions lock when the first match starts.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Badge variant={isComplete ? 'default' : 'secondary'}>
          {filledCount}/{totalRequired} picks
        </Badge>
      </div>

      <FormItem>
        <FormLabel>Display Name (optional)</FormLabel>
        <Input
          placeholder="Your name on the leaderboard"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
        />
      </FormItem>

      {rounds.map((round) => (
        <div key={round.round}>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {round.name}
          </h3>
          <div className="space-y-2">
            {round.matches.map((match) => {
              const teamA = match.teamAId ? teamMap.get(match.teamAId) : null;
              const teamB = match.teamBId ? teamMap.get(match.teamBId) : null;
              const picked = predictions[match.id];

              return (
                <Card key={match.id}>
                  <CardContent className="flex items-center gap-2 p-3">
                    <PickButton
                      team={teamA}
                      isSelected={picked === teamA?.id}
                      onClick={() => teamA && handlePick(match.id, teamA.id)}
                      disabled={!teamA}
                    />
                    <span className="text-xs text-muted-foreground">vs</span>
                    <PickButton
                      team={teamB}
                      isSelected={picked === teamB?.id}
                      onClick={() => teamB && handlePick(match.id, teamB.id)}
                      disabled={!teamB}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={!isComplete}
        loading={isSubmitting}
        className="w-full"
      >
        Submit Predictions
      </Button>
    </div>
  );
}

function PickButton({
  team,
  isSelected,
  onClick,
  disabled,
}: {
  team: Team | null | undefined;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 rounded-md border-2 px-3 py-2 text-sm font-medium transition-colors',
        isSelected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {team?.name ?? 'TBD'}
    </button>
  );
}
