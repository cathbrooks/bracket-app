/**
 * Format centiseconds into MM:SS.ss display string.
 * Example: 12345 → "02:03.45"
 */
export function formatTime(centiseconds: number): string {
  const totalSeconds = Math.floor(centiseconds / 100);
  const cs = centiseconds % 100;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Format a duration in minutes into a human-readable string.
 * Example: 150 → "2h 30m", 45 → "45m", 0 → "0m"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format an ISO timestamp into a locale-appropriate date string.
 */
export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO timestamp into a locale-appropriate date+time string.
 */
export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format an ISO timestamp into a relative time string (e.g. "2 hours ago").
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatDate(timestamp);
}

/**
 * Format a tournament state into a display-friendly label.
 */
export function formatTournamentState(state: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    registration: 'Registration',
    seeding: 'Seeding',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };
  return labels[state] ?? state;
}
