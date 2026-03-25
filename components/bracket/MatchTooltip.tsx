'use client';

import { useState, useRef } from 'react';
import { getMatchTimingDetails } from '@/lib/utils/match-timing';
import { getMatchDisplayState, getMatchStateLabel } from '@/lib/utils/match-state';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Match } from '@/lib/types/tournament.types';

interface MatchTooltipProps {
  match: Match;
  children: React.ReactNode;
}

export function MatchTooltip({ match, children }: MatchTooltipProps) {
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    placement: 'above' | 'below';
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timing = getMatchTimingDetails(match);
  const state = getMatchDisplayState(match);

  function showTooltip() {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const estimatedTooltipHeight = 80;
    const placement: 'above' | 'below' =
      rect.top - estimatedTooltipHeight < 8 ? 'below' : 'above';
    setTooltipPos({
      top: placement === 'above' ? rect.top - 8 : rect.bottom + 8,
      left: rect.left + rect.width / 2,
      placement,
    });
  }

  function hideTooltip() {
    setTooltipPos(null);
  }

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={() => (tooltipPos ? hideTooltip() : showTooltip())}
    >
      {children}
      {tooltipPos && (
        <div
          className={cn(
            'fixed z-50 -translate-x-1/2',
            tooltipPos.placement === 'above' ? '-translate-y-full' : 'translate-y-0',
            'rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
          role="tooltip"
        >
          <div className="flex items-center gap-2">
            <Badge
              variant={state === 'in-progress' ? 'default' : 'outline'}
              className="h-4 px-1.5 text-[10px]"
            >
              {getMatchStateLabel(state)}
            </Badge>
          </div>
          <p className="mt-1 font-medium">{timing.primary}</p>
          {timing.secondary && (
            <p className="text-muted-foreground">{timing.secondary}</p>
          )}
          {tooltipPos.placement === 'above' ? (
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-popover" />
          ) : (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-popover" />
          )}
        </div>
      )}
    </div>
  );
}
