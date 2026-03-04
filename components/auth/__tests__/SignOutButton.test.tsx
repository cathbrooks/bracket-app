import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignOutButton } from '../SignOutButton';
import { signOut } from '@/lib/auth/client';

vi.mock('@/lib/auth/client', () => ({
  signOut: vi.fn(async () => ({ data: undefined, error: null })),
}));

describe('SignOutButton', () => {
  it('renders sign out button', () => {
    render(<SignOutButton />);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls signOut on click', async () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByText('Sign Out'));
    expect(signOut).toHaveBeenCalled();
  });
});
