const COOLDOWN_MS = 2000;
const CLEANUP_INTERVAL_MS = 60_000;

const lastReaction = new Map<string, number>();

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of lastReaction) {
      if (now - timestamp > COOLDOWN_MS * 10) {
        lastReaction.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Check if a reaction is allowed (2-second cooldown per session per match).
 * Returns true if allowed, false if rate-limited.
 */
export function checkReactionRateLimit(sessionId: string, matchId: string): boolean {
  ensureCleanup();
  const key = `${sessionId}:${matchId}`;
  const lastTime = lastReaction.get(key);
  const now = Date.now();

  if (lastTime && now - lastTime < COOLDOWN_MS) {
    return false;
  }

  lastReaction.set(key, now);
  return true;
}
