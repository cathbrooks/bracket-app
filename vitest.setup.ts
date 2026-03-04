import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(() => ({ data: null, error: null })),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    rpc: vi.fn(() => ({ data: null, error: null })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: null }, error: null })),
      getSession: vi.fn(() => ({ data: { session: null }, error: null })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  };
  return { createClient: vi.fn(() => mockSupabase) };
});

vi.mock('@/lib/supabase/server', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(() => ({ data: null, error: null })),
    order: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    rpc: vi.fn(() => ({ data: null, error: null })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: null }, error: null })),
      getSession: vi.fn(() => ({ data: { session: null }, error: null })),
    },
  };
  return { createClient: vi.fn(async () => mockSupabase) };
});

vi.mock('@/lib/monitoring/sentry', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => '00000000-0000-0000-0000-000000000000',
    getRandomValues: (arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 4294967296);
      return arr;
    },
  },
});

if (typeof globalThis.sessionStorage === 'undefined') {
  const store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    },
  });
}
