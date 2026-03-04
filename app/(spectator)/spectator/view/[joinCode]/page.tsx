'use client';

import { use, useState, useEffect } from 'react';
import { BracketView } from '@/components/bracket/BracketView';
import { BracketPredictionForm } from '@/components/predictions/BracketPredictionForm';
import { PredictionLeaderboard } from '@/components/predictions/PredictionLeaderboard';
import { CelebrationScreen } from '@/components/predictions/CelebrationScreen';
import { useBracketData } from '@/hooks/useBracketData';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Loader2 } from 'lucide-react';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('bracket-session-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('bracket-session-id', id);
  }
  return id;
}

export default function SpectatorBracketPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = use(params);
  const [hasSubmittedPredictions, setHasSubmittedPredictions] = useState(false);
  const [predictionWinner, setPredictionWinner] = useState<{
    displayName: string;
    totalPoints: number;
    correctCount: number;
  } | null>(null);

  const { tournament, matches, teams, isLoading, error, connectionState } =
    useBracketData({ joinCode });

  useEffect(() => {
    if (!tournament?.id || hasSubmittedPredictions) return;
    async function checkSubmission() {
      try {
        const res = await fetch(`/api/tournaments/${tournament.id}/predictions/leaderboard`);
        if (!res.ok) return;
        const json = await res.json();
        const entries = json.data?.leaderboard ?? [];
        const sessionId = getSessionId();
        const submitted = entries.some((e: { sessionId: string }) => e.sessionId === sessionId);
        if (submitted) setHasSubmittedPredictions(true);
      } catch { /* ignore */ }
    }
    checkSubmission();
  }, [tournament?.id, hasSubmittedPredictions]);

  useEffect(() => {
    if (!tournament?.id || tournament.state !== 'completed') return;
    async function fetchPredictionWinner() {
      try {
        const res = await fetch(`/api/tournaments/${tournament.id}/predictions/leaderboard`);
        if (!res.ok) return;
        const json = await res.json();
        const entries = json.data?.leaderboard ?? [];
        const top = entries[0];
        if (top) {
          setPredictionWinner({
            displayName: top.displayName,
            totalPoints: top.totalPoints,
            correctCount: top.correctCount,
          });
        }
      } catch { /* ignore */ }
    }
    fetchPredictionWinner();
  }, [tournament?.id, tournament?.state]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-md rounded-md bg-destructive/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">Tournament Not Found</h2>
          <p className="mt-2 text-sm text-destructive/80">
            {error ?? 'The join code is invalid or the tournament does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const hasStarted = matches.some((m) => !m.isBye && m.state === 'completed');
  const showPredictionForm = !hasStarted && !hasSubmittedPredictions;
  const playableMatches = matches.filter((m) => !m.isBye);

  const lastMatch = [...playableMatches].sort((a, b) => b.round - a.round)[0];
  const championTeam = lastMatch?.winnerTeamId
    ? teams.find((t) => t.id === lastMatch.winnerTeamId)
    : null;

  const isCompleted = tournament.state === 'completed';

  return (
    <div className="container py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{tournament.name}</h1>
          <p className="text-sm text-muted-foreground">{tournament.gameType}</p>
        </div>
        <ConnectionStatus state={connectionState as 'connected' | 'connecting' | 'disconnected' | 'reconnecting'} />
      </div>

      {isCompleted && championTeam ? (
        <div className="mb-8">
          <CelebrationScreen
            tournamentName={tournament.name}
            winnerTeamName={championTeam.name}
            predictionWinner={predictionWinner}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <BracketView
            tournament={tournament}
            matches={matches}
            teams={teams}
          />
        </div>

        <div className="space-y-6">
          {showPredictionForm && playableMatches.length > 0 && (
            <BracketPredictionForm
              tournament={tournament}
              matches={matches}
              teams={teams}
              onSubmitted={() => setHasSubmittedPredictions(true)}
            />
          )}
          <PredictionLeaderboard
            tournamentId={tournament.id}
            currentSessionId={getSessionId()}
          />
        </div>
      </div>
    </div>
  );
}
