import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession, getUser, requireAuth } from '../server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server');
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('auth server', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
    vi.clearAllMocks();
  });

  describe('getSession', () => {
    it('returns session when available', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'tok' } },
      });
      const session = await getSession();
      expect(session?.access_token).toBe('tok');
    });

    it('returns null when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });
      expect(await getSession()).toBeNull();
    });
  });

  describe('getUser', () => {
    it('returns user when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
      });
      const user = await getUser();
      expect(user?.id).toBe('u1');
    });

    it('returns null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      expect(await getUser()).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('returns user when authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'u1' } },
      });
      const user = await requireAuth();
      expect(user.id).toBe('u1');
    });

    it('redirects to login when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });
      await requireAuth();
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });
});
