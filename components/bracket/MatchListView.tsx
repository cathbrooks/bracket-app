'use client';

import { useMemo } from 'react';
import { SpectatorMatchCard } from './SpectatorMatchCard';
import { groupByRound, groupByBracketCategory } from '@/lib/utils/bracket-layout';
import type { Match, Team, Tournament } from '@/lib/types/tournament.types';

interface MatchListViewProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onMatchClick?: (match: Match) => void;
}

export function MatchListView({ tournament, matches, teams, onMatchClick }: MatchListViewProps) {
  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const isDoubleElim = tournament.format === 'double-elimination';
  const categories = useMemo(
    () => isDoubleElim ? groupByBracketCategory(matches) : null,
    [matches, isDoubleElim]
  );

  const singleRounds = useMemo(
    () => (!isDoubleElim ? groupByRound(matches) : []),
    [matches, isDoubleElim]
  );

  if (isDoubleElim && categories) {
    return (
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.category ?? 'main'}>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {cat.label}
            </h3>
            <RoundsList tournamentId={tournament.id} rounds={cat.rounds} teamMap={teamMap} onMatchClick={onMatchClick} />
          </div>
        ))}
      </div>
    );
  }

  return <RoundsList tournamentId={tournament.id} rounds={singleRounds} teamMap={teamMap} onMatchClick={onMatchClick} />;
}

function RoundsList({
  tournamentId,
  rounds,
  teamMap,
  onMatchClick,
}: {
  tournamentId: string;
  rounds: ReturnType<typeof groupByRound>;
  teamMap: Map<string, Team>;
  onMatchClick?: (match: Match) => void;
}) {
  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <div key={round.round}>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {round.name}
          </h4>
          <div className="space-y-2">
            {round.matches.map((match) => (
              <SpectatorMatchCard
                key={match.id}
                tournamentId={tournamentId}
                match={match}
                teamA={match.teamAId ? teamMap.get(match.teamAId) : null}
                teamB={match.teamBId ? teamMap.get(match.teamBId) : null}
                onClick={onMatchClick ? () => onMatchClick(match) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
