import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard } from '../AuthGuard';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

describe('AuthGuard', () => {
  const mockUnsub = vi.fn();
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: mockUnsub } },
      })),
    },
  };

  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(mockSupabase as never);
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    mockSupabase.auth.getUser.mockImplementation(() => new Promise(() => {}));
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );
    await waitFor(() => expect(screen.getByText('Protected')).toBeInTheDocument());
  });

  it('does not show children when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );
    await waitFor(() => {
      expect(screen.queryByText('Protected')).not.toBeInTheDocument();
    });
  });
});
