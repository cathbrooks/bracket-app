import type { Match } from '@/lib/types/tournament.types';
import { formatRelativeTime } from './format';

export function getMatchTimingText(match: Match): string {
  if (match.isBye) return 'Automatic advancement';

  switch (match.state) {
    case 'completed':
      return match.completedAt
        ? `Completed ${formatRelativeTime(match.completedAt)}`
        : 'Completed';
    case 'in-progress':
      return match.startedAt
        ? `Started ${formatRelativeTime(match.startedAt)}`
        : 'In progress';
    case 'pending': {
      if (!match.teamAId && !match.teamBId) return 'Waiting for teams';
      if (!match.teamAId || !match.teamBId) return 'Waiting for opponent';
      return 'Ready to play';
    }
    default:
      return '';
  }
}

export function getMatchTimingDetails(match: Match): {
  primary: string;
  secondary?: string;
} {
  if (match.isBye) {
    return { primary: 'Bye — automatic advancement' };
  }

  switch (match.state) {
    case 'completed':
      return {
        primary: match.completedAt
          ? `Completed ${formatRelativeTime(match.completedAt)}`
          : 'Completed',
        secondary: match.startedAt
          ? `Started ${formatRelativeTime(match.startedAt)}`
          : undefined,
      };
    case 'in-progress':
      return {
        primary: match.startedAt
          ? `Started ${formatRelativeTime(match.startedAt)}`
          : 'In progress',
      };
    case 'pending':
      if (!match.teamAId || !match.teamBId) {
        return { primary: 'Waiting for previous matches' };
      }
      return { primary: 'Ready to play' };
    default:
      return { primary: match.state };
  }
}
