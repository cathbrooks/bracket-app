import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamList } from '../TeamList';

describe('TeamList', () => {
  it('renders correct number of team inputs', () => {
    render(<TeamList teamNames={['A', 'B', 'C']} onChange={vi.fn()} />);
    expect(screen.getByText('Team Names (3 teams)')).toBeInTheDocument();
  });

  it('shows duplicate warning when names repeat', () => {
    render(<TeamList teamNames={['Alpha', 'Alpha']} onChange={vi.fn()} />);
    expect(screen.getByText(/Duplicate names detected/)).toBeInTheDocument();
  });

  it('does not show duplicate warning for unique names', () => {
    render(<TeamList teamNames={['Alpha', 'Beta']} onChange={vi.fn()} />);
    expect(screen.queryByText(/Duplicate names detected/)).not.toBeInTheDocument();
  });
});
