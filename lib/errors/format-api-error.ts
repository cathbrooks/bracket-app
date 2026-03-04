import { AppError, ValidationError } from './custom-errors';

export interface FormattedApiError {
  error: string;
  code?: string;
  fields?: Record<string, string>;
}

/**
 * Format an error into a consistent API error response body.
 * Sanitizes messages in production to avoid leaking internals.
 */
export function formatApiError(error: unknown): FormattedApiError {
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      code: error.code,
      fields: Object.keys(error.fields).length > 0 ? error.fields : undefined,
    };
  }

  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
    };
  }

  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    return {
      error: error.message,
      code: 'INTERNAL_ERROR',
    };
  }

  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  };
}
