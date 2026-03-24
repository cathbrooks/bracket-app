'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Tournament, Team, Match } from '@/lib/types/tournament.types';

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
  canRecordWinners,
  onSelectWinner,
  onUndoWinner,
  loading,
  undoLoading,
}: {
  match: Match;
  teams: Team[];
  isOrganizer?: boolean;
  canRecordWinners?: boolean;
  onSelectWinner?: (matchId: string, winnerId: string) => void;
  onUndoWinner?: (matchId: string) => void;
  loading?: boolean;
  undoLoading?: boolean;
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
    canRecordWinners &&
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

      {isOrganizer && canRecordWinners && match.state === 'completed' && !match.isBye && onUndoWinner && (
        <div className="mt-2">
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-destructive"
            disabled={undoLoading}
            onClick={() => onUndoWinner(match.id)}
          >
            Undo result
          </Button>
        </div>
      )}
    </div>
  );
}

export function BracketView({ tournament, teams, matches, isOrganizer }: BracketViewProps) {
  const canRecordWinners = tournament.state === 'in-progress';
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [undoMatchId, setUndoMatchId] = useState<string | null>(null);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);

  const categories = [...new Set(matches.map((m) => m.bracketCategory ?? 'winners'))];

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/bracket`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to reset bracket');
      }
      setShowResetDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset bracket');
    } finally {
      setResetting(false);
    }
  }

  function handleRequestUndo(matchId: string) {
    setUndoMatchId(matchId);
    setShowUndoDialog(true);
  }

  async function handleConfirmUndo() {
    if (!undoMatchId) return;
    setUndoLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/tournaments/${tournament.id}/matches/${undoMatchId}/winner`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to undo result');
      }
      setShowUndoDialog(false);
      setUndoMatchId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo result');
    } finally {
      setUndoLoading(false);
    }
  }

  async function handleSelectWinner(matchId: string, winnerId: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/tournaments/${tournament.id}/matches/${matchId}/winner`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ winnerId }),
        }
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to record result');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record result');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isOrganizer && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowResetDialog(true)}
            disabled={loading || resetting}
          >
            Reset Bracket
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Bracket?</DialogTitle>
            <DialogDescription>
              This will permanently delete all matches and results for this tournament.
              The bracket will be regenerated from the current seeding. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={resetting}
              loading={resetting}
            >
              Yes, Reset Bracket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Match Result?</DialogTitle>
            <DialogDescription>
              This will clear the recorded winner and reverse any bracket advancement
              from this match. Prediction scores for this match will also be reset.
              The match will return to in-progress so the correct result can be recorded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUndoDialog(false)}
              disabled={undoLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmUndo}
              disabled={undoLoading}
              loading={undoLoading}
            >
              Undo Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        canRecordWinners={canRecordWinners}
                        onSelectWinner={handleSelectWinner}
                        onUndoWinner={handleRequestUndo}
                        loading={loading}
                        undoLoading={undoLoading && undoMatchId === m.id}
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
