'use client';

import { BracketTreeView } from './BracketTreeView';
import type { Match, Team, Tournament } from '@/lib/types/tournament.types';

interface BracketViewProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onMatchClick?: (match: Match) => void;
}

export function BracketView({ tournament, matches, teams, onMatchClick }: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center text-muted-foreground">
        No matches generated yet.
      </div>
    );
  }

  return (
    <BracketTreeView
      tournament={tournament}
      matches={matches}
      teams={teams}
      onMatchClick={onMatchClick}
    />
  );
}
