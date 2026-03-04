import { describe, it, expect, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { withErrorHandler, handleApiError } from '../api-error-handler';
import { ValidationError, UnauthorizedError } from '../custom-errors';

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      body,
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

describe('withErrorHandler', () => {
  it('passes through successful responses', async () => {
    const handler = vi.fn(async () => NextResponse.json({ data: 'ok' }) as never);
    const wrapped = withErrorHandler(handler);
    const result = await wrapped();
    expect(handler).toHaveBeenCalled();
    expect(result.body).toEqual({ data: 'ok' });
  });

  it('catches ValidationError and returns 400', async () => {
    const handler = vi.fn(async () => {
      throw new ValidationError('bad');
    });
    const wrapped = withErrorHandler(handler as never);
    const result = await wrapped();
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('bad');
  });

  it('catches UnauthorizedError and returns 401', async () => {
    const handler = vi.fn(async () => {
      throw new UnauthorizedError();
    });
    const wrapped = withErrorHandler(handler as never);
    const result = await wrapped();
    expect(result.status).toBe(401);
  });

  it('catches unknown errors and returns 500', async () => {
    const handler = vi.fn(async () => {
      throw new Error('boom');
    });
    const wrapped = withErrorHandler(handler as never);
    const result = await wrapped();
    expect(result.status).toBe(500);
  });
});

describe('handleApiError', () => {
  it('returns formatted error response', () => {
    const result = handleApiError(new ValidationError('bad'));
    expect(result.status).toBe(400);
  });

  it('returns 500 for unknown errors', () => {
    const result = handleApiError(new Error('boom'));
    expect(result.status).toBe(500);
  });
});
