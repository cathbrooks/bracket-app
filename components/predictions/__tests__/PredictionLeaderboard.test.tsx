import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PredictionLeaderboard } from '../PredictionLeaderboard';
import { PredictionDataContext } from '@/contexts/PredictionDataContext';
import type { LeaderboardEntry } from '@/contexts/PredictionDataContext';

function renderWithLeaderboard(
  leaderboard: LeaderboardEntry[],
  sessionId?: string,
  isLoading = false
) {
  return render(
    <PredictionDataContext.Provider
      value={{ leaderboard, isLoading, matchCounts: new Map() }}
    >
      <PredictionLeaderboard currentSessionId={sessionId} />
    </PredictionDataContext.Provider>
  );
}

describe('PredictionLeaderboard', () => {
  it('shows leaderboard entries', () => {
    renderWithLeaderboard(
      [{ rank: 1, displayName: 'Alice', totalPoints: 10, correctCount: 3, accuracy: 75, sessionId: 's1', predictions: {} }],
      's2'
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('handles empty leaderboard', () => {
    renderWithLeaderboard([]);
    expect(screen.getByText(/No predictions submitted yet/i)).toBeInTheDocument();
  });
});
