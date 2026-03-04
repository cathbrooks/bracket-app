import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStopwatch } from '../useStopwatch';

describe('useStopwatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with zeroed state', () => {
    const { result } = renderHook(() => useStopwatch());
    expect(result.current.centiseconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.lapTimes).toEqual([]);
    expect(result.current.finalTime).toBeNull();
  });

  it('starts and tracks time', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.centiseconds).toBeGreaterThanOrEqual(90);
  });

  it('stops and records final time', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(500));
    act(() => result.current.stop());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.finalTime).toBeGreaterThan(0);
  });

  it('records lap times', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(500));
    act(() => result.current.lap());

    expect(result.current.lapTimes).toHaveLength(1);
    expect(result.current.lapTimes[0]).toBeGreaterThan(0);
  });

  it('resets all state', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(500));
    act(() => result.current.stop());
    act(() => result.current.reset());

    expect(result.current.centiseconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.lapTimes).toEqual([]);
    expect(result.current.finalTime).toBeNull();
  });

  it('does nothing on double start', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => result.current.start());
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);
  });

  it('does nothing on stop when not running', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => result.current.stop());
    expect(result.current.finalTime).toBeNull();
  });

  it('does nothing on lap when not running', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => result.current.lap());
    expect(result.current.lapTimes).toEqual([]);
  });
});
