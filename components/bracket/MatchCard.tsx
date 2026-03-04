'use client';

import { cn } from '@/lib/utils';
import { getMatchDisplayState, getMatchStateStyles, getMatchStateLabel } from '@/lib/utils/match-state';
import { Badge } from '@/components/ui/badge';
import type { Match, Team } from '@/lib/types/tournament.types';

interface MatchCardProps {
  match: Match;
  teamA?: Team | null;
  teamB?: Team | null;
  compact?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function MatchCard({ match, teamA, teamB, compact = false, onClick, children }: MatchCardProps) {
  const displayState = getMatchDisplayState(match);
  const styles = getMatchStateStyles(displayState);
  const isWinnerA = match.winnerTeamId === match.teamAId && match.winnerTeamId !== null;
  const isWinnerB = match.winnerTeamId === match.teamBId && match.winnerTeamId !== null;

  return (
    <div
      className={cn(
        'rounded-lg border transition-shadow',
        styles.card,
        styles.border,
        onClick && 'cursor-pointer hover:shadow-md',
        compact ? 'p-2' : 'p-3'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          M{match.matchNumber}
        </span>
        {displayState === 'in-progress' && (
          <Badge variant="default" className="h-4 px-1.5 text-[10px]">
            {getMatchStateLabel(displayState)}
          </Badge>
        )}
        {displayState === 'bye' && (
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            Bye
          </Badge>
        )}
      </div>

      <div className={cn('mt-1 space-y-0.5', compact ? 'text-xs' : 'text-sm')}>
        <TeamRow
          name={teamA?.name ?? (match.teamAId ? '...' : 'TBD')}
          isWinner={isWinnerA}
          isLoser={!isWinnerA && match.state === 'completed' && match.winnerTeamId !== null}
          seed={teamA?.seed}
          styles={styles}
        />
        <div className="border-t border-border/50" />
        <TeamRow
          name={teamB?.name ?? (match.teamBId ? '...' : 'TBD')}
          isWinner={isWinnerB}
          isLoser={!isWinnerB && match.state === 'completed' && match.winnerTeamId !== null}
          seed={teamB?.seed}
          styles={styles}
        />
      </div>

      {children}
    </div>
  );
}

function TeamRow({
  name,
  isWinner,
  isLoser,
  seed,
  styles,
}: {
  name: string;
  isWinner: boolean;
  isLoser: boolean;
  seed?: number | null;
  styles: ReturnType<typeof getMatchStateStyles>;
}) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 py-0.5',
      isWinner && styles.winnerText,
      isLoser && styles.loserText,
      !isWinner && !isLoser && 'text-foreground'
    )}>
      {seed && (
        <span className="w-4 text-[10px] text-muted-foreground">{seed}</span>
      )}
      <span className="flex-1 truncate">{name}</span>
      {isWinner && (
        <span className="text-xs text-green-600 dark:text-green-400" aria-label="Winner">W</span>
      )}
    </div>
  );
}
