import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TournamentActions } from '../TournamentActions';
import type { Tournament } from '@/lib/types/tournament.types';

function makeTournament(state: string): Tournament {
  return {
    id: 't1', name: 'Test', gameType: 'Chess', format: 'single-elimination',
    participantType: 'teams', teamCount: 4, stationCount: 1, timePerMatchMinutes: 10,
    seedingMode: 'manual', estimatedDurationMinutes: 30, rosterSize: null,
    joinCode: 'ABC123', state: state as Tournament['state'], ownerId: 'u1',
    createdAt: '2025-01-01', updatedAt: '2025-01-01',
  };
}

describe('TournamentActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows Start Tournament for draft state', () => {
    render(<TournamentActions tournament={makeTournament('draft')} />);
    expect(screen.getByText('Start Tournament')).toBeInTheDocument();
    expect(screen.getByText('Delete Tournament')).toBeInTheDocument();
  });

  it('shows no action button for in-progress', () => {
    render(<TournamentActions tournament={makeTournament('in-progress')} />);
    expect(screen.queryByText('Start Tournament')).not.toBeInTheDocument();
  });

  it('shows no action for completed', () => {
    render(<TournamentActions tournament={makeTournament('completed')} />);
    expect(screen.queryByText('Start Tournament')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Tournament')).not.toBeInTheDocument();
  });

  it('advances state on Start Tournament click', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { tournament: {} } }),
    } as Response);

    render(<TournamentActions tournament={makeTournament('draft')} />);
    fireEvent.click(screen.getByText('Start Tournament'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments/t1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  it('shows error on failed state advance', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Cannot start' }),
    } as Response);

    render(<TournamentActions tournament={makeTournament('draft')} />);
    fireEvent.click(screen.getByText('Start Tournament'));

    await waitFor(() => {
      expect(screen.getByText('Cannot start')).toBeInTheDocument();
    });
  });

  it('deletes tournament on confirm', async () => {
    vi.spyOn(global, 'confirm' as never).mockReturnValue(true);
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: null }),
    } as Response);

    render(<TournamentActions tournament={makeTournament('draft')} />);
    fireEvent.click(screen.getByText('Delete Tournament'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments/t1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
