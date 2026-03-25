import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactionBar } from '../ReactionBar';
import type { ReactionCounts } from '@/lib/types/tournament.types';

const zeroCounts: ReactionCounts = {
  fire: 0, trophy: 0, shocked: 0, sad: 0, clap: 0,
};

describe('ReactionBar', () => {
  it('renders all emoji buttons', () => {
    render(
      <ReactionBar counts={zeroCounts} currentReaction={null} onReact={vi.fn()} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('calls onReact when button clicked', () => {
    const onReact = vi.fn();
    render(
      <ReactionBar counts={zeroCounts} currentReaction={null} onReact={onReact} />
    );
    fireEvent.click(screen.getByLabelText('React with fire'));
    expect(onReact).toHaveBeenCalledWith('fire');
  });

  it('shows count when > 0', () => {
    const counts = { ...zeroCounts, fire: 5 };
    render(
      <ReactionBar counts={counts} currentReaction={null} onReact={vi.fn()} />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('marks selected reaction with aria-pressed', () => {
    render(
      <ReactionBar counts={zeroCounts} currentReaction="trophy" onReact={vi.fn()} />
    );
    expect(screen.getByLabelText('React with trophy')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('React with fire')).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <ReactionBar counts={zeroCounts} currentReaction={null} onReact={vi.fn()} disabled />
    );
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
