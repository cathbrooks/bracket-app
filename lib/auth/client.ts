import { createClient } from '@/lib/supabase/client';
import type { AuthError, Session, User } from '@supabase/supabase-js';

type AuthResult<T = void> = { data: T; error: null } | { data: null; error: AuthError };

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult<{ user: User | null }>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { data: null, error };
  return { data: { user: data.user }, error: null };
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { data: null, error };
  return { data: { user: data.user, session: data.session }, error: null };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) return { data: null, error };
  return { data: undefined, error: null };
}

export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const supabase = createClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
