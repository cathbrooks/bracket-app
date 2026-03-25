import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReactions } from '../useReactions';

vi.mock('../useRealtimeReactions', () => ({
  useRealtimeReactions: vi.fn(() => ({
    reactionCounts: { fire: 0, trophy: 0, shocked: 0, sad: 0, clap: 0 },
    isConnected: true,
    connectionState: 'connected',
    error: null,
  })),
}));

describe('useReactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with zero counts and no current reaction', () => {
    const { result } = renderHook(() => useReactions('m1', 't1'));
    expect(result.current.currentReaction).toBeNull();
    expect(result.current.counts.fire).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('submits a reaction successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);

    const { result } = renderHook(() => useReactions('m1', 't1'));

    await act(async () => {
      await result.current.submitReaction('fire');
    });

    expect(result.current.currentReaction).toBe('fire');
  });

  it('clears reaction on failed submission', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response);

    const { result } = renderHook(() => useReactions('m1', 't1'));

    await act(async () => {
      await result.current.submitReaction('fire');
    });

    expect(result.current.currentReaction).toBeNull();
  });

  it('handles network errors gracefully', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useReactions('m1', 't1'));

    await act(async () => {
      await result.current.submitReaction('trophy');
    });

    expect(result.current.currentReaction).toBeNull();
  });
});
