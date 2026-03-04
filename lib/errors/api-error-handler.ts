import { NextResponse } from 'next/server';
import { captureException } from '@/lib/monitoring/sentry';
import { AppError } from './custom-errors';
import { formatApiError } from './format-api-error';

/**
 * Wrap an API route handler with consistent error handling.
 * Catches errors, logs to Sentry, and returns formatted responses.
 *
 * Usage:
 * ```ts
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchData();
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withErrorHandler<
  T extends (...args: never[]) => Promise<NextResponse>,
>(handler: T): T {
  const wrapped = async (...args: Parameters<T>): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const statusCode =
        error instanceof AppError ? error.statusCode : 500;

      if (statusCode >= 500) {
        captureException(error, {
          handler: handler.name || 'anonymous',
        });
      }

      return NextResponse.json(formatApiError(error), { status: statusCode });
    }
  };

  return wrapped as T;
}

/**
 * Convenience: handle an error and return a NextResponse.
 * For use inside route handlers that don't use the wrapper.
 */
export function handleApiError(error: unknown): NextResponse {
  const statusCode =
    error instanceof AppError ? error.statusCode : 500;

  if (statusCode >= 500) {
    captureException(error);
  }

  return NextResponse.json(formatApiError(error), { status: statusCode });
}
