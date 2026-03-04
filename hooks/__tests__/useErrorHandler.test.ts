import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { captureException } from '@/lib/monitoring/sentry';

describe('useErrorHandler', () => {
  it('initializes with null error', () => {
    const { result } = renderHook(() => useErrorHandler());
    expect(result.current.error).toBeNull();
  });

  it('setError updates the error state', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => result.current.setError('something failed'));
    expect(result.current.error).toBe('something failed');
  });

  it('clearError resets to null', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => result.current.setError('err'));
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('handleError extracts Error message', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => result.current.handleError(new Error('test error')));
    expect(result.current.error).toBe('test error');
    expect(captureException).toHaveBeenCalled();
  });

  it('handleError handles string errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => result.current.handleError('string error'));
    expect(result.current.error).toBe('string error');
  });

  it('handleError handles unknown errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    act(() => result.current.handleError(42));
    expect(result.current.error).toBe('An unexpected error occurred');
  });
});
