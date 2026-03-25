'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Wand2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  groupByRound,
  groupByBracketCategory,
  calculateMatchPositions,
  MATCH_WIDTH,
  PREDICTION_MATCH_HEIGHT,
  ROUND_GAP,
} from '@/lib/utils/bracket-layout';
import { BracketConnectors } from '@/components/bracket/BracketConnectors';
import type { Match, Team, Tournament } from '@/lib/types/tournament.types';

const MOBILE_BREAKPOINT = 768;

interface BracketPredictionFormProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  onSubmitted: () => void;
}

export interface PredictionState {
  picks: Record<string, string>;
  /** matchIds that were filled in by cascade (not by an explicit user click) */
  autofilled: Set<string>;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('bracket-session-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('bracket-session-id', id);
  }
  return id;
}

export function BracketPredictionForm({
  tournament,
  matches,
  teams,
  onSubmitted,
}: BracketPredictionFormProps) {
  const [predState, setPredState] = useState<PredictionState>({
    picks: {},
    autofilled: new Set(),
  });
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const playableMatches = useMemo(() => matches.filter((m) => !m.isBye), [matches]);
  const matchMap = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  /**
   * For every match record which matches feed into it (via winnerNextMatchId OR
   * loserNextMatchId), sorted by matchNumber so index 0 → teamA slot, 1 → teamB slot.
   */
  const feederMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const match of matches) {
      if (match.winnerNextMatchId) {
        const arr = map.get(match.winnerNextMatchId) ?? [];
        arr.push(match.id);
        map.set(match.winnerNextMatchId, arr);
      }
      if (match.loserNextMatchId) {
        const arr = map.get(match.loserNextMatchId) ?? [];
        arr.push(match.id);
        map.set(match.loserNextMatchId, arr);
      }
    }
    map.forEach((arr, key) => {
      map.set(
        key,
        [...arr].sort(
          (a, b) =>
            (matchMap.get(a)?.matchNumber ?? 0) - (matchMap.get(b)?.matchNumber ?? 0)
        )
      );
    });
    return map;
  }, [matches, matchMap]);

  /**
   * Compute predicted participants for every match.
   * Seeds from actual DB data (bye winners already present), then propagates
   * the winner forward (winnerNextMatchId) and the loser into losers bracket
   * (loserNextMatchId) based on current picks.
   */
  const predictedParticipants = useMemo(() => {
    const result = new Map<string, { teamAId: string | null; teamBId: string | null }>();
    for (const match of matches) {
      result.set(match.id, { teamAId: match.teamAId, teamBId: match.teamBId });
    }

    const sorted = [...playableMatches].sort(
      (a, b) => a.round - b.round || a.matchNumber - b.matchNumber
    );

    for (const match of sorted) {
      const winner = predState.picks[match.id];
      if (!winner) continue;

      // Propagate winner forward
      if (match.winnerNextMatchId) {
        const nextId = match.winnerNextMatchId;
        const current = result.get(nextId) ?? { teamAId: null, teamBId: null };
        const feeders = feederMap.get(nextId) ?? [];
        const idx = feeders.indexOf(match.id);
        if (idx === 0 && !current.teamAId) {
          result.set(nextId, { ...current, teamAId: winner });
        } else if (idx === 1 && !current.teamBId) {
          result.set(nextId, { ...current, teamBId: winner });
        }
      }

      // Propagate loser into losers bracket (double-elim).
      // If the destination LB match is a bye, keep walking through the bye chain
      // so the loser lands in the first real LB match that needs a participant.
      if (match.loserNextMatchId) {
        const predicted = result.get(match.id);
        const loser =
          winner === predicted?.teamAId ? predicted?.teamBId : predicted?.teamAId;

        if (loser) {
          let currentLBId: string | null = match.loserNextMatchId;
          let feederId: string = match.id;

          while (currentLBId) {
            const lbMatch = matchMap.get(currentLBId);
            const current = result.get(currentLBId) ?? { teamAId: null, teamBId: null };
            const feeders = feederMap.get(currentLBId) ?? [];
            const idx = feeders.indexOf(feederId);

            if (idx === 0 && !current.teamAId) {
              result.set(currentLBId, { ...current, teamAId: loser });
            } else if (idx === 1 && !current.teamBId) {
              result.set(currentLBId, { ...current, teamBId: loser });
            } else if (!current.teamAId) {
              result.set(currentLBId, { ...current, teamAId: loser });
            } else if (!current.teamBId) {
              result.set(currentLBId, { ...current, teamBId: loser });
            }

            // Walk through consecutive bye matches so the loser reaches the next real match
            if (lbMatch?.isBye && lbMatch.winnerNextMatchId) {
              feederId = currentLBId;
              currentLBId = lbMatch.winnerNextMatchId;
            } else {
              break;
            }
          }
        }
      }
    }

    return result;
  }, [matches, playableMatches, predState.picks, feederMap, matchMap]);

  const isDoubleElim = tournament.format === 'double-elimination';

  // Layout uses ALL matches (including byes) so the tree positions match the real bracket
  const categories = useMemo(
    () => (isDoubleElim ? groupByBracketCategory(matches) : null),
    [isDoubleElim, matches]
  );
  const singleRounds = useMemo(
    () => (!isDoubleElim ? groupByRound(matches) : []),
    [isDoubleElim, matches]
  );

  const totalRequired = playableMatches.length;

  /**
   * Count only picks where the stored team ID is actually one of the
   * predicted participants for that match. Stale picks (team no longer
   * in the predicted path) don't count toward completion.
   */
  const validPickCount = useMemo(() => {
    return playableMatches.filter((m) => {
      const pick = predState.picks[m.id];
      if (!pick) return false;
      const pp = predictedParticipants.get(m.id);
      return pp?.teamAId === pick || pp?.teamBId === pick;
    }).length;
  }, [playableMatches, predState.picks, predictedParticipants]);

  const filledCount = validPickCount;
  const isComplete = validPickCount === totalRequired;

  function handlePick(matchId: string, teamId: string) {
    setPredState((prev) => {
      const oldTeamId = prev.picks[matchId];
      let newPicks = { ...prev.picks, [matchId]: teamId };

      // When replacing an existing pick, cascade-clear any downstream picks
      // that stored the old team's ID via the winner path. Those picks are
      // now stale because the old team no longer propagates through this match.
      if (oldTeamId && oldTeamId !== teamId) {
        const queue: Array<{ nextMatchId: string; staleId: string }> = [];
        const changed = matchMap.get(matchId);
        if (changed?.winnerNextMatchId) {
          queue.push({ nextMatchId: changed.winnerNextMatchId, staleId: oldTeamId });
        }
        while (queue.length > 0) {
          const { nextMatchId, staleId } = queue.shift()!;
          if (newPicks[nextMatchId] !== staleId) continue;
          const { [nextMatchId]: _removed, ...rest } = newPicks;
          newPicks = rest;
          const next = matchMap.get(nextMatchId);
          if (next?.winnerNextMatchId) {
            queue.push({ nextMatchId: next.winnerNextMatchId, staleId });
          }
        }
      }

      return { picks: newPicks, autofilled: prev.autofilled };
    });
  }

  async function handleSubmit() {
    if (!isComplete) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Safety net: only submit picks where the chosen team is actually a
      // predicted participant in that match. This catches any stale picks
      // that the cascade-clear in handlePick may not have reached (e.g.
      // double-elim loser paths, or picks made out of round order).
      const cleanPicks: Record<string, string> = {};
      for (const [mid, tid] of Object.entries(predState.picks)) {
        const pp = predictedParticipants.get(mid);
        if (pp?.teamAId === tid || pp?.teamBId === tid) {
          cleanPicks[mid] = tid;
        }
      }

      const res = await fetch(`/api/tournaments/${tournament.id}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          predictions: cleanPicks,
          sessionId: getSessionId(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to submit predictions');
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Shared props for sections
  const sectionProps = {
    predState,
    predictedParticipants,
    teamMap,
    onPick: handlePick,
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Bracket Predictions</h2>
        <p className="text-xs text-muted-foreground">
          Pick the winner for every match.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isComplete ? 'default' : 'secondary'} className="text-xs">
          {filledCount}/{totalRequired}
        </Badge>
        {filledCount > 0 && !isComplete && (
          <span className="text-xs text-muted-foreground">picks made</span>
        )}
      </div>

      <FormItem>
        <FormLabel className="text-xs">Display Name <span className="text-destructive">*</span></FormLabel>
        <Input
          placeholder="Your name on the leaderboard"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          required
          className="h-8 text-sm"
        />
      </FormItem>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
      )}

      {/* Bracket — mirrors BracketView's desktop/mobile split */}
      {isMobile === null ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : isMobile ? (
        /* ── Mobile list view ── */
        <div>
          {isDoubleElim && categories ? (
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat.category ?? 'main'}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.label}
                  </h3>
                  <PredictionRoundsList rounds={cat.rounds} {...sectionProps} />
                </div>
              ))}
            </div>
          ) : (
            <PredictionRoundsList rounds={singleRounds} {...sectionProps} />
          )}
        </div>
      ) : (
        /* ── Desktop tree view ── */
        <div>
          {isDoubleElim && categories ? (
            <div className="space-y-8">
              {categories.map((cat) => (
                <div key={cat.category ?? 'main'}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.label}
                  </h3>
                  <PredictionBracketSection
                    rounds={cat.rounds}
                    allMatchesInSection={cat.rounds.flatMap((r) => r.matches)}
                    {...sectionProps}
                  />
                </div>
              ))}
            </div>
          ) : (
            <PredictionBracketSection
              rounds={singleRounds}
              allMatchesInSection={matches}
              {...sectionProps}
            />
          )}
        </div>
      )}

      {isComplete && !displayName.trim() && (
        <p className="text-xs text-destructive">A display name is required to submit.</p>
      )}
      <Button
        onClick={handleSubmit}
        disabled={!isComplete || !displayName.trim()}
        loading={isSubmitting}
        className="w-full"
      >
        Submit Predictions
      </Button>
    </div>
  );
}

// ── Shared section props ──────────────────────────────────────────────

export interface SectionProps {
  predState: PredictionState;
  predictedParticipants: Map<string, { teamAId: string | null; teamBId: string | null }>;
  teamMap: Map<string, Team>;
  onPick?: (matchId: string, teamId: string) => void;
  /** Per-match correctness for the read-only submitted view */
  matchMeta?: Map<string, { isCorrect: boolean | null }>;
}

// ── Desktop: tree view with connectors (mirrors BracketSection) ───────

export function PredictionBracketSection({
  rounds,
  allMatchesInSection,
  predState,
  predictedParticipants,
  teamMap,
  onPick,
  matchMeta,
}: SectionProps & {
  rounds: ReturnType<typeof groupByRound>;
  allMatchesInSection: Match[];
}) {
  const positions = useMemo(() => calculateMatchPositions(rounds, PREDICTION_MATCH_HEIGHT), [rounds]);
  const totalWidth = rounds.length * (MATCH_WIDTH + ROUND_GAP) - ROUND_GAP;
  const firstRoundCount = rounds[0]?.matches.length ?? 1;
  const totalHeight = firstRoundCount * (PREDICTION_MATCH_HEIGHT + 16) - 16;

  return (
    <div className="overflow-x-auto overflow-y-clip pt-7 pb-4">
      <div className="relative" style={{ width: totalWidth, minHeight: totalHeight }}>
        <BracketConnectors matches={allMatchesInSection} positions={positions} />

        {rounds.map((round) => (
          <div key={round.round}>
            <div
              className="absolute -top-6 text-xs font-medium text-muted-foreground"
              style={{ left: positions.get(round.matches[0]?.id ?? '')?.x ?? 0 }}
            >
              {round.name}
            </div>
            {round.matches.map((match) => {
              const pos = positions.get(match.id);
              if (!pos) return null;
              const predicted = predictedParticipants.get(match.id);
              const teamA = predicted?.teamAId ? teamMap.get(predicted.teamAId) : null;
              const teamB = predicted?.teamBId ? teamMap.get(predicted.teamBId) : null;
              return (
                <div
                  key={match.id}
                  className="absolute"
                  style={{ left: pos.x, top: pos.y, width: pos.width }}
                >
                  <PredictionMatchCard
                    match={match}
                    teamA={teamA ?? null}
                    teamB={teamB ?? null}
                    picked={predState.picks[match.id]}
                    isAuto={predState.autofilled.has(match.id)}
                    isCorrect={matchMeta?.get(match.id)?.isCorrect}
                    onPick={onPick}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mobile: list view (mirrors RoundsList) ────────────────────────────

export function PredictionRoundsList({
  rounds,
  predState,
  predictedParticipants,
  teamMap,
  onPick,
  matchMeta,
}: SectionProps & { rounds: ReturnType<typeof groupByRound> }) {
  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <div key={round.round}>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {round.name}
          </h4>
          <div className="space-y-2">
            {round.matches.map((match) => {
              const predicted = predictedParticipants.get(match.id);
              const teamA = predicted?.teamAId ? teamMap.get(predicted.teamAId) : null;
              const teamB = predicted?.teamBId ? teamMap.get(predicted.teamBId) : null;
              return (
                <PredictionMatchCard
                  key={match.id}
                  match={match}
                  teamA={teamA ?? null}
                  teamB={teamB ?? null}
                  picked={predState.picks[match.id]}
                  isAuto={predState.autofilled.has(match.id)}
                  isCorrect={matchMeta?.get(match.id)?.isCorrect}
                  onPick={onPick}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Match card (mirrors MatchCard styling, interactive for non-byes) ──

function PredictionMatchCard({
  match,
  teamA,
  teamB,
  picked,
  isAuto,
  isCorrect,
  onPick,
}: {
  match: Match;
  teamA: Team | null;
  teamB: Team | null;
  picked: string | undefined;
  isAuto: boolean;
  isCorrect?: boolean | null;
  onPick?: (matchId: string, teamId: string) => void;
}) {
  const isBye = match.isBye;
  const pickedA = picked === teamA?.id;
  const pickedB = picked === teamB?.id;
  const hasPick = !!picked;
  const readonly = !onPick;

  return (
    <div
      className={cn(
        'rounded-lg border transition-shadow bg-card',
        isBye
          ? 'bg-muted/30 border-dashed border-border'
          : isCorrect === true
            ? 'border-green-500/40 bg-green-500/5'
            : isCorrect === false
              ? 'border-red-500/40 bg-red-500/5'
              : hasPick
                ? 'border-border'
                : 'border-dashed border-border/60',
        'p-2'
      )}
    >
      {/* Header row: match number + badges */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">M{match.matchNumber}</span>
        <div className="flex items-center gap-1">
          {isBye && (
            <span className="rounded-sm border border-border px-1 py-0.5 text-[10px] text-muted-foreground">
              Bye
            </span>
          )}
          {!isBye && isAuto && hasPick && (
            <span className="flex items-center gap-0.5 text-[10px] text-blue-500/60">
              <Wand2 className="h-2.5 w-2.5" />
              auto
            </span>
          )}
          {isCorrect != null && (
            <span className={cn(
              'flex items-center gap-0.5 text-[10px]',
              isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
            )}>
              {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {isCorrect ? 'Correct' : 'Wrong'}
            </span>
          )}
        </div>
      </div>

      {/* Team rows */}
      <div className="space-y-0.5">
        <PredictionTeamRow
          team={teamA}
          isPicked={!isBye && pickedA}
          isLoser={!isBye && hasPick && !pickedA}
          isAuto={isAuto && pickedA}
          isByeWinner={isBye && match.winnerTeamId === teamA?.id}
          isBye={isBye}
          disabled={isBye || !teamA || readonly}
          onClick={() => !isBye && teamA && onPick?.(match.id, teamA.id)}
        />
        <div className="border-t border-border/50" />
        <PredictionTeamRow
          team={teamB}
          isPicked={!isBye && pickedB}
          isLoser={!isBye && hasPick && !pickedB}
          isAuto={isAuto && pickedB}
          isByeWinner={isBye && match.winnerTeamId === teamB?.id}
          isBye={isBye}
          disabled={isBye || !teamB || readonly}
          onClick={() => !isBye && teamB && onPick?.(match.id, teamB.id)}
        />
      </div>
    </div>
  );
}

// ── Team row ──────────────────────────────────────────────────────────

function PredictionTeamRow({
  team,
  isPicked,
  isLoser,
  isAuto,
  isByeWinner,
  isBye,
  disabled,
  onClick,
}: {
  team: Team | null | undefined;
  isPicked: boolean;
  isLoser: boolean;
  isAuto: boolean;
  isByeWinner: boolean;
  isBye: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const label = team?.name ?? (isBye ? 'bye' : 'TBD');

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-1.5 rounded px-2 py-2 text-left transition-colors min-h-[40px]',
        isPicked && !isAuto && 'bg-blue-500/15 text-blue-700 dark:text-blue-400 font-semibold',
        isPicked && isAuto && 'bg-blue-500/8 text-blue-600/70 dark:text-blue-400/70 font-medium',
        isLoser && 'text-muted-foreground/50 line-through',
        isByeWinner && 'text-muted-foreground italic',
        !isPicked && !isLoser && !isByeWinner && !disabled && 'hover:bg-muted/60 text-foreground',
        disabled && !isByeWinner && 'opacity-40 cursor-not-allowed text-muted-foreground',
        disabled && 'cursor-default'
      )}
    >
      {team?.seed != null && (
        <span className="w-4 shrink-0 text-[10px] text-muted-foreground">{team.seed}</span>
      )}
      <span className="flex-1 truncate text-sm">{label}</span>
      {isPicked && team && (
        <span className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">W</span>
      )}
    </button>
  );
}
