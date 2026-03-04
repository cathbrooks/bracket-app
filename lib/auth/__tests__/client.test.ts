import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, signOut, getSession, onAuthStateChange } from '../client';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

describe('auth client', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(mockSupabase as never);
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('returns user on success', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'u1' } },
        error: null,
      });
      const result = await signUp('a@b.com', 'pass1234');
      expect(result.data?.user?.id).toBe('u1');
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'fail' },
      });
      const result = await signUp('a@b.com', 'pass');
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('fail');
    });
  });

  describe('signIn', () => {
    it('returns user and session on success', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 'tok' } },
        error: null,
      });
      const result = await signIn('a@b.com', 'pass1234');
      expect(result.data?.user?.id).toBe('u1');
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'invalid' },
      });
      const result = await signIn('a@b.com', 'wrong');
      expect(result.error?.message).toBe('invalid');
    });
  });

  describe('signOut', () => {
    it('returns success', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      const result = await signOut();
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: { message: 'fail' } });
      const result = await signOut();
      expect(result.error?.message).toBe('fail');
    });
  });

  describe('getSession', () => {
    it('returns session', async () => {
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

  describe('onAuthStateChange', () => {
    it('subscribes to auth changes', () => {
      const unsub = vi.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsub } },
      });
      const sub = onAuthStateChange(vi.fn());
      expect(sub.unsubscribe).toBe(unsub);
    });
  });
});
