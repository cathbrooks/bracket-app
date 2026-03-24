'use client';

import { use, useState } from 'react';
import { BracketView } from '@/components/bracket/BracketView';
import { BracketPredictionForm } from '@/components/predictions/BracketPredictionForm';
import { PredictionLeaderboard } from '@/components/predictions/PredictionLeaderboard';
import { SubmittedPredictions } from '@/components/predictions/SubmittedPredictions';
import { CelebrationScreen } from '@/components/predictions/CelebrationScreen';
import { useBracketData } from '@/hooks/useBracketData';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { PredictionDataProvider, usePredictionData } from '@/contexts/PredictionDataContext';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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

type MobileTab = 'bracket' | 'predict' | 'leaderboard';

function SpectatorContent({ tournament, matches, teams, connectionState }: SpectatorContentProps) {
  const { leaderboard, refetch } = usePredictionData();
  const sessionId = getSessionId();
  const [activeTab, setActiveTab] = useState<MobileTab>('bracket');

  const hasSubmittedPredictions = leaderboard.some((e) => e.sessionId === sessionId);

  const predictionWinner = (() => {
    if (tournament.state !== 'completed') return null;
    const top = leaderboard[0];
    if (!top) return null;
    return { displayName: top.displayName, totalPoints: top.totalPoints, correctCount: top.correctCount };
  })();

  const hasStarted = matches.some((m) => !m.isBye && m.state === 'completed');
  const showPredictionForm = !hasStarted && !hasSubmittedPredictions;
  const playableMatches = matches.filter((m) => !m.isBye);

  const lastMatch = [...playableMatches].sort((a, b) => b.round - a.round)[0];
  const championTeam = lastMatch?.winnerTeamId
    ? teams.find((t) => t.id === lastMatch.winnerTeamId)
    : null;

  const isCompleted = tournament.state === 'completed';
  const hasPredictTab = showPredictionForm && playableMatches.length > 0;

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: 'bracket', label: 'Bracket' },
    ...(hasPredictTab ? [{ id: 'predict' as MobileTab, label: 'Predict' }] : []),
    { id: 'leaderboard', label: 'Scores' },
  ];

  const sidebarContent = (
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

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight sm:text-xl">{tournament.name}</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{tournament.gameType}</p>
          </div>
          <div className="shrink-0">
            <ConnectionStatus state={connectionState as 'connected' | 'connecting' | 'disconnected' | 'reconnecting'} />
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="container pb-0 lg:hidden">
          <div className="flex border-b">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {tab.id === 'leaderboard' && leaderboard.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                    {leaderboard.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Celebration banner */}
      {isCompleted && championTeam && (
        <div className="container pt-4 pb-2">
          <CelebrationScreen
            tournamentName={tournament.name}
            winnerTeamName={championTeam.name}
            predictionWinner={predictionWinner}
          />
        </div>
      )}

      {/* Mobile content — tab-driven */}
      <div className="container flex-1 pb-28 pt-4 lg:hidden">
        {activeTab === 'bracket' && (
          <BracketView tournament={tournament} matches={matches} teams={teams} />
        )}
        {activeTab === 'predict' && hasPredictTab && (
          <BracketPredictionForm
            tournament={tournament}
            matches={matches}
            teams={teams}
            onSubmitted={() => { refetch(); setActiveTab('leaderboard'); }}
          />
        )}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
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
        )}
      </div>

      {/* Desktop content — side-by-side */}
      <div className="container hidden pb-28 pt-4 lg:block">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <BracketView tournament={tournament} matches={matches} teams={teams} />
          {sidebarContent}
        </div>
      </div>
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

  return (
    <PredictionDataProvider tournamentId={tournament.id}>
      <SpectatorContent
        tournament={tournament}
        matches={matches}
        teams={teams}
        connectionState={connectionState}
      />
    </PredictionDataProvider>
  );
}
