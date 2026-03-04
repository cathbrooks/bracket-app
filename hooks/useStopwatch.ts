'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseStopwatchReturn {
  centiseconds: number;
  isRunning: boolean;
  lapTimes: number[];
  finalTime: number | null;
  start: () => void;
  stop: () => void;
  lap: () => void;
  reset: () => void;
}

/**
 * Custom hook for stopwatch state management.
 * Tracks time in centiseconds with start/stop/lap/reset controls.
 */
export function useStopwatch(): UseStopwatchReturn {
  const [centiseconds, setCentiseconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lapTimes, setLapTimes] = useState<number[]>([]);
  const [finalTime, setFinalTime] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setFinalTime(null);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setCentiseconds(accumulatedRef.current + Math.floor(elapsed / 10));
    }, 10);
  }, [isRunning]);

  const stop = useCallback(() => {
    if (!isRunning) return;
    clearTimer();
    const elapsed = Date.now() - startTimeRef.current;
    const total = accumulatedRef.current + Math.floor(elapsed / 10);
    accumulatedRef.current = total;
    setCentiseconds(total);
    setFinalTime(total);
    setIsRunning(false);
  }, [isRunning, clearTimer]);

  const lap = useCallback(() => {
    if (!isRunning) return;
    const elapsed = Date.now() - startTimeRef.current;
    const current = accumulatedRef.current + Math.floor(elapsed / 10);
    setLapTimes((prev) => [...prev, current]);
  }, [isRunning]);

  const reset = useCallback(() => {
    clearTimer();
    setCentiseconds(0);
    setIsRunning(false);
    setLapTimes([]);
    setFinalTime(null);
    accumulatedRef.current = 0;
    startTimeRef.current = 0;
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { centiseconds, isRunning, lapTimes, finalTime, start, stop, lap, reset };
}
