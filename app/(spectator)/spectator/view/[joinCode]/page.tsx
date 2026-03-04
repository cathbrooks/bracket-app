'use client';

import { use } from 'react';
import { BracketView } from '@/components/bracket/BracketView';
import { BracketPredictionForm } from '@/components/predictions/BracketPredictionForm';
import { PredictionLeaderboard } from '@/components/predictions/PredictionLeaderboard';
import { SubmittedPredictions } from '@/components/predictions/SubmittedPredictions';
import { CelebrationScreen } from '@/components/predictions/CelebrationScreen';
import { useBracketData } from '@/hooks/useBracketData';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { PredictionDataProvider, usePredictionData } from '@/contexts/PredictionDataContext';
import { Loader2 } from 'lucide-react';
import type { Tournament, Match, Team } from '@/lib/types/tournament.types';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('bracket-session-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('bracket-session-id', id);
  }
  return id;
}

interface SpectatorContentProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  connectionState: string;
}

function SpectatorContent({ tournament, matches, teams, connectionState }: SpectatorContentProps) {
  const predictionsEnabled = tournament.predictionsEnabled;

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
          {predictionsEnabled ? (
            <CelebrationScreenWithPredictions tournament={tournament} championTeam={championTeam} />
          ) : (
            <CelebrationScreen
              tournamentName={tournament.name}
              winnerTeamName={championTeam.name}
              predictionWinner={null}
            />
          )}
        </div>
      ) : null}

      {predictionsEnabled ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <BracketView tournament={tournament} matches={matches} teams={teams} showPredictions />
          </div>
          <PredictionsSidebar tournament={tournament} matches={matches} teams={teams} />
        </div>
      ) : (
        <BracketView tournament={tournament} matches={matches} teams={teams} showPredictions={false} />
      )}
    </div>
  );
}

function CelebrationScreenWithPredictions({ tournament, championTeam }: { tournament: Tournament; championTeam: Team }) {
  const { leaderboard } = usePredictionData();
  const predictionWinner = (() => {
    if (tournament.state !== 'completed') return null;
    const top = leaderboard[0];
    if (!top) return null;
    return { displayName: top.displayName, totalPoints: top.totalPoints, correctCount: top.correctCount };
  })();

  return (
    <CelebrationScreen
      tournamentName={tournament.name}
      winnerTeamName={championTeam.name}
      predictionWinner={predictionWinner}
    />
  );
}

function PredictionsSidebar({ tournament, matches, teams }: { tournament: Tournament; matches: Match[]; teams: Team[] }) {
  const { leaderboard, refetch } = usePredictionData();
  const sessionId = getSessionId();

  const hasSubmittedPredictions = leaderboard.some((e) => e.sessionId === sessionId);
  const hasStarted = matches.some((m) => !m.isBye && m.state === 'completed');
  const showPredictionForm = !hasStarted && !hasSubmittedPredictions;
  const playableMatches = matches.filter((m) => !m.isBye);

  return (
    <div className="space-y-6">
      {showPredictionForm && playableMatches.length > 0 && (
        <BracketPredictionForm
          tournament={tournament}
          matches={matches}
          teams={teams}
          onSubmitted={refetch}
        />
      )}
      {hasSubmittedPredictions && (
        <SubmittedPredictions
          tournament={tournament}
          matches={matches}
          teams={teams}
          sessionId={sessionId}
        />
      )}
      <PredictionLeaderboard currentSessionId={sessionId} />
    </div>
  );
}

export default function SpectatorBracketPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = use(params);

  const { tournament, matches, teams, isLoading, error, connectionState } =
    useBracketData({ joinCode });

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

  const content = (
    <SpectatorContent
      tournament={tournament}
      matches={matches}
      teams={teams}
      connectionState={connectionState}
    />
  );

  if (tournament.predictionsEnabled) {
    return (
      <PredictionDataProvider tournamentId={tournament.id}>
        {content}
      </PredictionDataProvider>
    );
  }

  return content;
}
