'use client';

import { useMemo } from 'react';
import { SpectatorMatchCard } from './SpectatorMatchCard';
import { BracketConnectors } from './BracketConnectors';
import {
  groupByRound,
  groupByBracketCategory,
  calculateMatchPositions,
  MATCH_WIDTH,
  SPECTATOR_MATCH_HEIGHT,
  ROUND_GAP,
} from '@/lib/utils/bracket-layout';
import type { Match, Team, Tournament } from '@/lib/types/tournament.types';

interface BracketTreeViewProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onMatchClick?: (match: Match) => void;
  showPredictions?: boolean;
}

export function BracketTreeView({ tournament, matches, teams, onMatchClick, showPredictions }: BracketTreeViewProps) {
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
      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.category ?? 'main'}>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {cat.label}
            </h3>
            <BracketSection
              tournamentId={tournament.id}
              rounds={cat.rounds}
              teamMap={teamMap}
              onMatchClick={onMatchClick}
              matches={cat.rounds.flatMap((r) => r.matches)}
              showPredictions={showPredictions}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <BracketSection
      tournamentId={tournament.id}
      rounds={singleRounds}
      teamMap={teamMap}
      onMatchClick={onMatchClick}
      matches={matches}
      showPredictions={showPredictions}
    />
  );
}

function BracketSection({
  tournamentId,
  rounds,
  teamMap,
  onMatchClick,
  matches,
  showPredictions,
}: {
  tournamentId: string;
  rounds: ReturnType<typeof groupByRound>;
  teamMap: Map<string, Team>;
  onMatchClick?: (match: Match) => void;
  matches: Match[];
  showPredictions?: boolean;
}) {
  const positions = useMemo(() => calculateMatchPositions(rounds, SPECTATOR_MATCH_HEIGHT), [rounds]);

  const totalWidth = rounds.length * (MATCH_WIDTH + ROUND_GAP) - ROUND_GAP;
  const firstRoundCount = rounds[0]?.matches.length ?? 1;
  const totalHeight = firstRoundCount * (SPECTATOR_MATCH_HEIGHT + 16) - 16;

  return (
    <div className="overflow-x-auto overflow-y-clip pt-7 pb-4">
      <div className="relative" style={{ width: totalWidth, minHeight: totalHeight }}>
        <BracketConnectors matches={matches} positions={positions} />

        {rounds.map((round) => (
          <div key={round.round}>
            <div
              className="absolute -top-6 text-xs font-medium text-muted-foreground"
              style={{ left: positions.get(round.matches[0]?.id ?? '')?.x ?? 0 }}
            >
              {round.name}
            </div>
            {round.matches.map((match) => {
              const pos = positions.get(match.id);
              if (!pos) return null;
              return (
                <div
                  key={match.id}
                  className="absolute"
                  style={{ left: pos.x, top: pos.y, width: pos.width }}
                >
                  <SpectatorMatchCard
                    tournamentId={tournamentId}
                    match={match}
                    teamA={match.teamAId ? teamMap.get(match.teamAId) : null}
                    teamB={match.teamBId ? teamMap.get(match.teamBId) : null}
                    compact
                    showPredictions={showPredictions}
                    onClick={onMatchClick ? () => onMatchClick(match) : undefined}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
