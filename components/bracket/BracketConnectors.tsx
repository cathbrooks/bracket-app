'use client';

import type { Match } from '@/lib/types/tournament.types';
import type { MatchPosition } from '@/lib/utils/bracket-layout';

interface BracketConnectorsProps {
  matches: Match[];
  positions: Map<string, MatchPosition>;
}

export function BracketConnectors({ matches, positions }: BracketConnectorsProps) {
  const lines: { key: string; d: string }[] = [];

  for (const match of matches) {
    if (!match.winnerNextMatchId) continue;
    const from = positions.get(match.id);
    const to = positions.get(match.winnerNextMatchId);
    if (!from || !to) continue;

    const fromX = from.x + from.width;
    const fromY = from.y + from.height / 2;
    const toX = to.x;
    const toY = to.y + to.height / 2;
    const midX = (fromX + toX) / 2;

    lines.push({
      key: `${match.id}-w`,
      d: `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`,
    });
  }

  if (lines.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ overflow: 'visible' }}
    >
      {lines.map((line) => (
        <path
          key={line.key}
          d={line.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-border"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
