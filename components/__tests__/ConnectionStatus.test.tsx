import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus', () => {
  it('renders "Live" for connected state', () => {
    render(<ConnectionStatus state="connected" />);
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Connection status: Live');
  });

  it('renders "Connecting..." for connecting state', () => {
    render(<ConnectionStatus state="connecting" />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders "Reconnecting..." for reconnecting state', () => {
    render(<ConnectionStatus state="reconnecting" />);
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('renders "Offline" for disconnected state', () => {
    render(<ConnectionStatus state="disconnected" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<ConnectionStatus state="connected" className="custom" />);
    expect(screen.getByRole('status').className).toContain('custom');
  });
});
