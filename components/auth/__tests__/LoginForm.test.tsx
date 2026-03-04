import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { signIn } from '@/lib/auth/client';

vi.mock('@/lib/auth/client', () => ({
  signIn: vi.fn(),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockResolvedValue({ data: null, error: null } as never);
  });

  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginForm />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('has email and password labels', () => {
    render(<LoginForm />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('submits form and calls signIn', async () => {
    vi.mocked(signIn).mockResolvedValue({
      data: { user: { id: 'u1' }, session: {} },
      error: null,
    } as never);

    render(<LoginForm />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('a@b.com', 'password123');
    });
  });

  it('shows server error on failed sign in', async () => {
    vi.mocked(signIn).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    } as never);

    render(<LoginForm />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
