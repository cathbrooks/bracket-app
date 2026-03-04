'use client';

import { useState, useEffect } from 'react';
import { BracketTreeView } from './BracketTreeView';
import { MatchListView } from './MatchListView';
import type { Match, Team, Tournament } from '@/lib/types/tournament.types';

const MOBILE_BREAKPOINT = 768;

interface BracketViewProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onMatchClick?: (match: Match) => void;
}

export function BracketView({ tournament, matches, teams, onMatchClick }: BracketViewProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile === null) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center text-muted-foreground">
        No matches generated yet.
      </div>
    );
  }

  if (isMobile) {
    return (
      <MatchListView
        tournament={tournament}
        matches={matches}
        teams={teams}
        onMatchClick={onMatchClick}
      />
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
