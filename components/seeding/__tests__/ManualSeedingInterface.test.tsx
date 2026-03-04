import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualSeedingInterface } from '../ManualSeedingInterface';
import type { Team } from '@/lib/types/tournament.types';

const teams: Team[] = [
  { id: 'a', tournamentId: 't1', name: 'Alpha', seed: null, timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '' },
  { id: 'b', tournamentId: 't1', name: 'Beta', seed: null, timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '' },
];

describe('ManualSeedingInterface', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders team names and seed inputs', () => {
    render(
      <ManualSeedingInterface
        tournamentId="t1"
        teams={teams}
        participantType="teams"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText('Manual Seeding')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows confirm button', () => {
    render(
      <ManualSeedingInterface
        tournamentId="t1"
        teams={teams}
        participantType="teams"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText('Confirm Seeds')).toBeInTheDocument();
  });

  it('allows entering seed values', () => {
    render(
      <ManualSeedingInterface
        tournamentId="t1"
        teams={teams}
        participantType="teams"
        onComplete={vi.fn()}
      />
    );
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBe(2);
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
  });

  it('submits seeds and calls onComplete', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    } as Response);

    const onComplete = vi.fn();
    render(
      <ManualSeedingInterface
        tournamentId="t1"
        teams={teams}
        participantType="teams"
        onComplete={onComplete}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.click(screen.getByText('Confirm Seeds'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('shows error on failed submission', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Seeds invalid' }),
    } as Response);

    render(
      <ManualSeedingInterface
        tournamentId="t1"
        teams={teams}
        participantType="teams"
        onComplete={vi.fn()}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.click(screen.getByText('Confirm Seeds'));

    await waitFor(() => {
      expect(screen.getByText('Seeds invalid')).toBeInTheDocument();
    });
  });

  it('uses player terminology for player type', () => {
    render(
      <ManualSeedingInterface
        tournamentId="t1"
        teams={teams}
        participantType="players"
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/player/i)).toBeInTheDocument();
  });
});
