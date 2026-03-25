import type { Match } from '@/lib/types/tournament.types';
import type { BracketCategory } from '@/lib/constants';

export interface RoundGroup {
  round: number;
  name: string;
  matches: Match[];
}

export interface CategoryGroup {
  category: BracketCategory | null;
  label: string;
  rounds: RoundGroup[];
}

export function groupByRound(matches: Match[]): RoundGroup[] {
  const roundMap = new Map<number, Match[]>();

  for (const match of matches) {
    const existing = roundMap.get(match.round) ?? [];
    existing.push(match);
    roundMap.set(match.round, existing);
  }

  const totalRounds = Math.max(...Array.from(roundMap.keys()), 0);

  return Array.from(roundMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, roundMatches]) => ({
      round,
      name: getRoundName(round, totalRounds, roundMatches.length),
      matches: roundMatches.sort((a, b) => a.matchNumber - b.matchNumber),
    }));
}

export function groupByBracketCategory(matches: Match[]): CategoryGroup[] {
  const categoryMap = new Map<BracketCategory | null, Match[]>();

  for (const match of matches) {
    const cat = match.bracketCategory;
    const existing = categoryMap.get(cat) ?? [];
    existing.push(match);
    categoryMap.set(cat, existing);
  }

  const order: (BracketCategory | null)[] = ['winners', 'losers', 'grand-finals', null];
  const labels: Record<string, string> = {
    winners: 'Winners Bracket',
    losers: 'Losers Bracket',
    'grand-finals': 'Grand Finals',
  };

  return order
    .filter((cat) => categoryMap.has(cat))
    .map((cat) => ({
      category: cat,
      label: cat ? labels[cat] : 'Bracket',
      rounds: groupByRound(categoryMap.get(cat) ?? []),
    }));
}

export function getRoundName(
  round: number,
  totalRounds: number,
  matchCount: number
): string {
  if (round === totalRounds) return 'Finals';
  if (round === totalRounds - 1 && matchCount <= 2) return 'Semifinals';
  if (round === totalRounds - 2 && matchCount <= 4) return 'Quarterfinals';
  return `Round ${round}`;
}

export interface MatchPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MATCH_WIDTH = 220;
const MATCH_HEIGHT = 72;
const PREDICTION_MATCH_HEIGHT = 128;
const SPECTATOR_MATCH_HEIGHT = 260;
const ROUND_GAP = 60;
const MATCH_VERTICAL_GAP = 16;

export function calculateMatchPositions(
  rounds: RoundGroup[],
  matchHeight: number = MATCH_HEIGHT,
): Map<string, MatchPosition> {
  const positions = new Map<string, MatchPosition>();

  for (let roundIdx = 0; roundIdx < rounds.length; roundIdx++) {
    const round = rounds[roundIdx];
    const x = roundIdx * (MATCH_WIDTH + ROUND_GAP);

    const firstRoundCount = rounds[0]?.matches.length ?? 1;
    const totalHeight = firstRoundCount * (matchHeight + MATCH_VERTICAL_GAP) - MATCH_VERTICAL_GAP;
    const spacing = totalHeight / Math.max(round.matches.length, 1);

    for (let matchIdx = 0; matchIdx < round.matches.length; matchIdx++) {
      const match = round.matches[matchIdx];
      const y = spacing * matchIdx + (spacing - matchHeight) / 2;
      positions.set(match.id, { x, y, width: MATCH_WIDTH, height: matchHeight });
    }
  }

  return positions;
}

export { MATCH_WIDTH, MATCH_HEIGHT, PREDICTION_MATCH_HEIGHT, SPECTATOR_MATCH_HEIGHT, ROUND_GAP };
