import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../custom-errors';

describe('AppError', () => {
  it('sets message, statusCode and code', () => {
    const err = new AppError('test', 500, 'TEST');
    expect(err.message).toBe('test');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('TEST');
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
  });
});

describe('ValidationError', () => {
  it('has 400 status and VALIDATION_ERROR code', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.fields).toEqual({});
  });

  it('stores field errors', () => {
    const err = new ValidationError('bad', { name: 'too short' });
    expect(err.fields.name).toBe('too short');
  });
});

describe('NotFoundError', () => {
  it('has 404 status with resource and id', () => {
    const err = new NotFoundError('Tournament', '123');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('Tournament');
    expect(err.message).toContain('123');
  });

  it('works without id', () => {
    const err = new NotFoundError('Team');
    expect(err.message).toBe('Team not found');
  });
});

describe('UnauthorizedError', () => {
  it('has 401 status with default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication required');
  });

  it('accepts custom message', () => {
    const err = new UnauthorizedError('Custom msg');
    expect(err.message).toBe('Custom msg');
  });
});

describe('ForbiddenError', () => {
  it('has 403 status', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ConflictError', () => {
  it('has 409 status', () => {
    const err = new ConflictError('Already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Already exists');
  });
});
