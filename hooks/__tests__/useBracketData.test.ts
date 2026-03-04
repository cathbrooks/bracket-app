import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBracketData } from '../useBracketData';

vi.mock('../useRealtimeBracket', () => ({
  useRealtimeBracket: vi.fn(() => ({
    matches: [],
    connectionState: 'connected',
    isConnected: true,
    error: null,
    refetch: vi.fn(),
  })),
}));

describe('useBracketData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in loading state', () => {
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useBracketData({ joinCode: 'ABC123' }));
    expect(result.current.isLoading).toBe(true);
  });

  it('fetches data by join code', async () => {
    const mockData = {
      data: {
        tournament: { id: 't1', name: 'Test', teams: [], matches: [] },
      },
    };
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(() => useBracketData({ joinCode: 'ABC123' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tournament).toBeDefined();
    expect(result.current.tournament?.id).toBe('t1');
  });

  it('fetches data by tournament ID', async () => {
    const mockData = {
      data: {
        tournament: { id: 't2', name: 'Test2', teams: [], matches: [] },
      },
    };
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(() => useBracketData({ tournamentId: 't2' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tournament?.id).toBe('t2');
  });

  it('handles fetch errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    } as Response);

    const { result } = renderHook(() => useBracketData({ joinCode: 'BAD' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Not found');
    expect(result.current.tournament).toBeNull();
  });

  it('handles network errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network fail'));

    const { result } = renderHook(() => useBracketData({ joinCode: 'BAD' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Network fail');
  });
});
