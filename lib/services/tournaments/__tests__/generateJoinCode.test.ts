import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => {
  const mock = {
    from: vi.fn(() => mock),
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
  };
  return { createClient: vi.fn(async () => mock) };
});

describe('generateUniqueJoinCode', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('generates a unique join code', async () => {
    const { generateUniqueJoinCode } = await import('../generateJoinCode');
    const code = await generateUniqueJoinCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });
});
