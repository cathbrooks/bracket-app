import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TournamentSettingsForm } from '../TournamentSettingsForm';
import type { Tournament } from '@/lib/types/tournament.types';

function makeTournament(state: string = 'draft'): Tournament {
  return {
    id: 't1', name: 'Test', gameType: 'Chess', format: 'single-elimination',
    participantType: 'teams', teamCount: 4, stationCount: 2, timePerMatchMinutes: 10,
    seedingMode: 'manual', estimatedDurationMinutes: 30, rosterSize: null,
    joinCode: 'ABC123', state: state as Tournament['state'], ownerId: 'u1',
    createdAt: '2025-01-01', updatedAt: '2025-01-01',
  };
}

describe('TournamentSettingsForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders form fields', () => {
    render(<TournamentSettingsForm tournament={makeTournament()} />);
    expect(screen.getByText('Tournament Settings')).toBeInTheDocument();
    expect(screen.getByText('Tournament Name')).toBeInTheDocument();
    expect(screen.getByText('Game Type')).toBeInTheDocument();
    expect(screen.getByText('Stations')).toBeInTheDocument();
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
  });

  it('shows read-only notice for non-draft tournaments', () => {
    render(<TournamentSettingsForm tournament={makeTournament('in-progress')} />);
    expect(screen.getByText(/Some settings can only be changed/)).toBeInTheDocument();
  });

  it('populates with tournament values', () => {
    render(<TournamentSettingsForm tournament={makeTournament()} />);
    const nameInput = screen.getByLabelText('Tournament Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Test');
  });

  it('saves settings on submit', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { tournament: {} } }),
    } as Response);

    render(<TournamentSettingsForm tournament={makeTournament()} />);
    const nameInput = screen.getByLabelText('Tournament Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tournaments/t1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  it('shows no changes message when nothing changed', async () => {
    render(<TournamentSettingsForm tournament={makeTournament()} />);
    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(screen.getByText('No changes to save.')).toBeInTheDocument();
    });
  });

  it('shows error on failed save', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Save failed' }),
    } as Response);

    render(<TournamentSettingsForm tournament={makeTournament()} />);
    fireEvent.change(screen.getByLabelText('Tournament Name'), { target: { value: 'X' } });
    fireEvent.click(screen.getByText('Save Settings'));

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});
