'use client';

import { useCallback, useState } from 'react';
import { captureException } from '@/lib/monitoring/sentry';

interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

/**
 * Hook for consistent client-side error handling.
 * Captures errors to Sentry and exposes error state for UI display.
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown) => {
    captureException(err);

    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === 'string') {
      setError(err);
    } else {
      setError('An unexpected error occurred');
    }
  }, []);

  return { error, setError, clearError, handleError };
}
