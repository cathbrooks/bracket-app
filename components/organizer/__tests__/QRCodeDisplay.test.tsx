import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => <svg data-testid="qr-code" />,
}));

import { QRCodeDisplay } from '../QRCodeDisplay';

describe('QRCodeDisplay', () => {
  it('renders join code', () => {
    render(<QRCodeDisplay joinCode="ABC123" tournamentName="Test" />);
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('renders QR code', () => {
    render(<QRCodeDisplay joinCode="ABC123" tournamentName="Test" />);
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<QRCodeDisplay joinCode="ABC123" tournamentName="Test" />);
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });
});
