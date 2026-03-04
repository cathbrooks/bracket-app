'use client';

import { MatchCard } from './MatchCard';
import { ReactionBar } from './ReactionBar';
import { MatchTooltip } from './MatchTooltip';
import { AggregatePredictionCounts } from './AggregatePredictionCounts';
import { useReactions } from '@/hooks/useReactions';
import type { Match, Team } from '@/lib/types/tournament.types';

interface SpectatorMatchCardProps {
  tournamentId: string;
  match: Match;
  teamA?: Team | null;
  teamB?: Team | null;
  compact?: boolean;
  showPredictions?: boolean;
  onClick?: () => void;
}

export function SpectatorMatchCard({
  tournamentId,
  match,
  teamA,
  teamB,
  compact = false,
  showPredictions = true,
  onClick,
}: SpectatorMatchCardProps) {
  const { counts, currentReaction, submitReaction } = useReactions(match.id, tournamentId);

  return (
    <MatchTooltip match={match}>
      <MatchCard match={match} teamA={teamA} teamB={teamB} compact={compact} onClick={onClick}>
        <ReactionBar
          counts={counts}
          currentReaction={currentReaction}
          onReact={submitReaction}
        />
        {showPredictions && !match.isBye && teamA && teamB && (
          <AggregatePredictionCounts
            matchId={match.id}
            teamA={teamA}
            teamB={teamB}
          />
        )}
      </MatchCard>
    </MatchTooltip>
  );
}
