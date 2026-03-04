'use client';

import { useState, useCallback } from 'react';
import { useRealtimeReactions } from './useRealtimeReactions';
import type { EmojiType } from '@/lib/constants';
import type { ReactionCounts } from '@/lib/types/tournament.types';

interface UseReactionsReturn {
  counts: ReactionCounts;
  currentReaction: EmojiType | null;
  submitReaction: (emoji: EmojiType) => Promise<void>;
  isLoading: boolean;
  connectionState: string;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('bracket-session-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('bracket-session-id', id);
  }
  return id;
}

export function useReactions(matchId: string, tournamentId: string): UseReactionsReturn {
  const { reactionCounts, connectionState } = useRealtimeReactions(matchId);
  const [currentReaction, setCurrentReaction] = useState<EmojiType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitReaction = useCallback(async (emoji: EmojiType) => {
    setIsLoading(true);
    try {
      const sessionId = getSessionId();

      setCurrentReaction(emoji);

      const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emojiType: emoji, sessionId }),
      });

      if (!res.ok) {
        setCurrentReaction(null);
      }
    } catch {
      setCurrentReaction(null);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, tournamentId]);

  return {
    counts: reactionCounts,
    currentReaction,
    submitReaction,
    isLoading,
    connectionState,
  };
}
