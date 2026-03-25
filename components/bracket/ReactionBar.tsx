'use client';

import { cn } from '@/lib/utils';
import { EMOJI_TYPES, type EmojiType } from '@/lib/constants';
import type { ReactionCounts } from '@/lib/types/tournament.types';

const EMOJI_DISPLAY: Record<EmojiType, string> = {
  fire: '🔥',
  shocked: '😱',
  sad: '😢',
  clap: '👏',
};

interface ReactionBarProps {
  counts: ReactionCounts;
  currentReaction: EmojiType | null;
  onReact: (emoji: EmojiType) => void;
  disabled?: boolean;
}

export function ReactionBar({ counts, currentReaction, onReact, disabled = false }: ReactionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 pt-2">
      {EMOJI_TYPES.map((emoji) => {
        const isSelected = currentReaction === emoji;
        const count = counts[emoji] ?? 0;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            disabled={disabled}
            className={cn(
              'flex min-h-[32px] items-center gap-1 rounded-full border px-2 py-1 text-sm transition-colors',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent hover:border-border hover:bg-muted',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={`React with ${emoji}`}
            aria-pressed={isSelected}
          >
            <span className="text-base leading-none">{EMOJI_DISPLAY[emoji]}</span>
            {count > 0 && (
              <span className="tabular-nums text-xs text-muted-foreground">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
