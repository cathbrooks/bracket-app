'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { groupByRound, groupByBracketCategory } from '@/lib/utils/bracket-layout';
import type { Match, Team, Tournament } from '@/lib/types/tournament.types';
import {
  PredictionBracketSection,
  PredictionRoundsList,
} from '@/components/predictions/BracketPredictionForm';

const MOBILE_BREAKPOINT = 768;

interface SubmittedPredictionsProps {
  tournament: Tournament;
  matches: Match[];
  teams: Team[];
  sessionId: string;
}

export function SubmittedPredictions({
  tournament,
  matches,
  teams,
  sessionId,
}: SubmittedPredictionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const matchMap = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);
  const playableMatches = useMemo(() => matches.filter((m) => !m.isBye), [matches]);

  const isDoubleElim = tournament.format === 'double-elimination';

  const categories = useMemo(
    () => (isDoubleElim ? groupByBracketCategory(matches) : null),
    [isDoubleElim, matches],
  );
  const singleRounds = useMemo(
    () => (!isDoubleElim ? groupByRound(matches) : []),
    [isDoubleElim, matches],
  );

  /**
   * Build feeder map: for each match, which matches feed into it (sorted by matchNumber).
   * Identical logic to BracketPredictionForm.
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
            (matchMap.get(a)?.matchNumber ?? 0) - (matchMap.get(b)?.matchNumber ?? 0),
        ),
      );
    });
    return map;
  }, [matches, matchMap]);

  /**
   * Propagate picks forward so later-round match cards show the predicted teams —
   * identical logic to BracketPredictionForm.
   */
  const predictedParticipants = useMemo(() => {
    const picks = predictions ?? {};
    const result = new Map<string, { teamAId: string | null; teamBId: string | null }>();
    for (const match of matches) {
      result.set(match.id, { teamAId: match.teamAId, teamBId: match.teamBId });
    }

    const sorted = [...playableMatches].sort(
      (a, b) => a.round - b.round || a.matchNumber - b.matchNumber,
    );

    for (const match of sorted) {
      const winner = picks[match.id];
      if (!winner) continue;

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
  }, [matches, playableMatches, predictions, feederMap, matchMap]);

  /** Per-match correctness based on actual results */
  const matchMeta = useMemo(() => {
    if (!predictions) return new Map<string, { isCorrect: boolean | null }>();
    const map = new Map<string, { isCorrect: boolean | null }>();
    for (const match of playableMatches) {
      const pick = predictions[match.id];
      if (!pick) continue;
      const actualWinner = match.winnerTeamId;
      const isCorrect = actualWinner ? pick === actualWinner : null;
      map.set(match.id, { isCorrect });
    }
    return map;
  }, [predictions, playableMatches]);

  useEffect(() => {
    if (!isOpen || predictions) return;
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/tournaments/${tournament.id}/predictions/leaderboard`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const entries = json.data?.leaderboard ?? [];
        const mine = entries.find(
          (e: { sessionId: string }) => e.sessionId === sessionId,
        );
        if (!cancelled && mine?.predictions) {
          setPredictions(mine.predictions);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, predictions, tournament.id, sessionId]);

  const predState = useMemo(
    () => ({ picks: predictions ?? {}, autofilled: new Set<string>() }),
    [predictions],
  );

  const sectionProps = {
    predState,
    predictedParticipants,
    teamMap,
    matchMeta,
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? (
          <>
            <EyeOff className="h-3.5 w-3.5" /> Hide submitted bracket
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" /> View submitted bracket
          </>
        )}
      </Button>

      {isOpen && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Your Predictions</h3>

          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!isLoading && !predictions && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Could not load your predictions.
            </p>
          )}

          {!isLoading && predictions && isMobile === null && (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!isLoading && predictions && isMobile !== null && (
            <>
              {isMobile ? (
                /* ── Mobile list view ── */
                <>
                  {isDoubleElim && categories ? (
                    <div className="space-y-6">
                      {categories.map((cat) => (
                        <div key={cat.category ?? 'main'}>
                          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            {cat.label}
                          </h4>
                          <PredictionRoundsList rounds={cat.rounds} {...sectionProps} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <PredictionRoundsList rounds={singleRounds} {...sectionProps} />
                  )}
                </>
              ) : (
                /* ── Desktop tree view ── */
                <>
                  {isDoubleElim && categories ? (
                    <div className="space-y-8">
                      {categories.map((cat) => (
                        <div key={cat.category ?? 'main'}>
                          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            {cat.label}
                          </h4>
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
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
