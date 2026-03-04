'use client';

import { useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const timing = getMatchTimingDetails(match);
  const state = getMatchDisplayState(match);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onTouchStart={() => setIsVisible((v) => !v)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2',
            'rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
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
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}
