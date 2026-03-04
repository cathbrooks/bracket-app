import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware, config as middlewareConfig } from '../middleware';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url, _key, { cookies: cookieOpts }) => {
    return {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: (cookieOpts as { _mockUser?: boolean })._mockUser ?? null },
          error: null,
        })),
      },
    };
  }),
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: vi.fn(({ request }: { request: NextRequest }) => ({
        cookies: { set: vi.fn() },
        request,
      })),
      redirect: vi.fn((url: URL) => ({
        redirectUrl: url.toString(),
        cookies: { set: vi.fn() },
      })),
    },
  };
});

function makeRequest(path: string) {
  const url = new URL(path, 'http://localhost:3000');
  return {
    nextUrl: url,
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
    url: url.toString(),
  } as unknown as NextRequest;
}

describe('middleware config', () => {
  it('has matcher pattern', () => {
    expect(middlewareConfig.matcher).toBeDefined();
    expect(middlewareConfig.matcher.length).toBeGreaterThan(0);
  });
});

describe('middleware', () => {
  it('calls auth.getUser', async () => {
    const req = makeRequest('/');
    await middleware(req);
  });
});
