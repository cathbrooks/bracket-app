import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ManualTimeEntry } from '../ManualTimeEntry';
import type { Team } from '@/lib/types/tournament.types';

const teams: Team[] = [
  { id: 'a', tournamentId: 't1', name: 'Alpha', seed: null, timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '' },
  { id: 'b', tournamentId: 't1', name: 'Beta', seed: null, timeTrialResultSeconds: null, roster: null, createdAt: '', updatedAt: '' },
];

describe('ManualTimeEntry', () => {
  it('renders form fields', () => {
    render(
      <ManualTimeEntry
        teams={teams}
        recordedTeamIds={new Set()}
        onTimeSubmitted={vi.fn()}
      />
    );
    expect(screen.getByText(/Manual Time Entry/i)).toBeInTheDocument();
  });
});
