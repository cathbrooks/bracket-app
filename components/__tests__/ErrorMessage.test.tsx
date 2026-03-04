import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders with default props', () => {
    render(<ErrorMessage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<ErrorMessage title="Oops" message="Custom message" />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('shows retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage onRetry={onRetry} />);
    const btn = screen.getByText('Try Again');
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows dismiss button when onDismiss provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage onDismiss={onDismiss} />);
    const btn = screen.getByText('Dismiss');
    fireEvent.click(btn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('hides buttons when no callbacks provided', () => {
    render(<ErrorMessage />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
  });
});
