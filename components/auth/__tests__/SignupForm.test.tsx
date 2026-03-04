import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '../SignupForm';
import { signUp } from '@/lib/auth/client';

vi.mock('@/lib/auth/client', () => ({
  signUp: vi.fn(),
}));

describe('SignupForm', () => {
  beforeEach(() => {
    vi.mocked(signUp).mockResolvedValue({ data: null, error: null } as never);
  });

  it('renders all form fields', () => {
    render(<SignupForm />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });

  it('renders Create Account button', () => {
    render(<SignupForm />);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('submits form and calls signUp', async () => {
    vi.mocked(signUp).mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    } as never);

    render(<SignupForm />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Create a password'), 'Password1');
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'Password1');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('test@test.com', 'Password1');
    });
  });

  it('shows success message after signup', async () => {
    vi.mocked(signUp).mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    } as never);

    render(<SignupForm />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Create a password'), 'Password1');
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'Password1');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
  });

  it('shows server error on failure', async () => {
    vi.mocked(signUp).mockResolvedValue({
      data: null,
      error: { message: 'Email taken' },
    } as never);

    render(<SignupForm />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Create a password'), 'Password1');
    await user.type(screen.getByPlaceholderText('Confirm your password'), 'Password1');
    await user.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Email taken')).toBeInTheDocument();
    });
  });
});
