import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatApiError } from '../format-api-error';
import { AppError, ValidationError } from '../custom-errors';

describe('formatApiError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('formats ValidationError with fields', () => {
    const err = new ValidationError('Bad input', { name: 'required' });
    const result = formatApiError(err);
    expect(result.error).toBe('Bad input');
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.fields).toEqual({ name: 'required' });
  });

  it('omits empty fields object', () => {
    const err = new ValidationError('Bad input');
    const result = formatApiError(err);
    expect(result.fields).toBeUndefined();
  });

  it('formats generic AppError', () => {
    const err = new AppError('Forbidden', 403, 'FORBIDDEN');
    const result = formatApiError(err);
    expect(result.error).toBe('Forbidden');
    expect(result.code).toBe('FORBIDDEN');
    expect(result.fields).toBeUndefined();
  });

  it('returns internal error message in development for generic errors', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const err = new Error('DB connection failed');
    const result = formatApiError(err);
    expect(result.error).toBe('DB connection failed');
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('hides internal details in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const result = formatApiError(new Error('secret'));
    expect(result.error).toBe('Internal server error');
  });

  it('handles non-Error objects', () => {
    const result = formatApiError('string error');
    expect(result.error).toBe('Internal server error');
    expect(result.code).toBe('INTERNAL_ERROR');
  });
});
