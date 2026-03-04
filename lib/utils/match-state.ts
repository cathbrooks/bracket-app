import type { Match } from '@/lib/types/tournament.types';
import type { MatchState } from '@/lib/constants';

export type MatchDisplayState = 'pending' | 'in-progress' | 'completed' | 'bye';

export function getMatchDisplayState(match: Match): MatchDisplayState {
  if (match.isBye) return 'bye';
  return match.state as MatchDisplayState;
}

interface MatchStateStyles {
  card: string;
  border: string;
  winnerText: string;
  loserText: string;
  label: string;
}

const STATE_STYLES: Record<MatchDisplayState, MatchStateStyles> = {
  pending: {
    card: 'bg-card',
    border: 'border-border',
    winnerText: 'text-foreground',
    loserText: 'text-foreground',
    label: 'Upcoming',
  },
  'in-progress': {
    card: 'bg-card ring-2 ring-primary/30',
    border: 'border-primary',
    winnerText: 'text-foreground',
    loserText: 'text-foreground',
    label: 'In Progress',
  },
  completed: {
    card: 'bg-card',
    border: 'border-border',
    winnerText: 'text-foreground font-semibold',
    loserText: 'text-muted-foreground/50 line-through',
    label: 'Completed',
  },
  bye: {
    card: 'bg-muted/30',
    border: 'border-dashed border-border',
    winnerText: 'text-muted-foreground italic',
    loserText: 'text-muted-foreground/30',
    label: 'Bye',
  },
};

export function getMatchStateStyles(state: MatchDisplayState): MatchStateStyles {
  return STATE_STYLES[state];
}

export function getMatchStateLabel(state: MatchState | MatchDisplayState): string {
  const labels: Record<string, string> = {
    pending: 'Upcoming',
    'in-progress': 'Live',
    completed: 'Completed',
    skipped: 'Skipped',
    bye: 'Bye',
  };
  return labels[state] ?? state;
}
