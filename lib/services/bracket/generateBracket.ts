import { createClient } from '@/lib/supabase/server';
import type { Team, Match } from '@/lib/types/tournament.types';
import { toMatch } from '@/lib/types/tournament.types';
import type { TournamentFormat } from '@/lib/constants';
import type { Tables, TablesInsert } from '@/lib/database.types';
import { nextPowerOfTwo } from '@/lib/utils/validation';
import { ValidationError } from '@/lib/errors/custom-errors';

/**
 * Standard bracket seeding order.
 * For size 8: [1, 8, 4, 5, 2, 7, 3, 6]
 * This ensures top seeds are placed far apart.
 */
function generateSeedOrder(bracketSize: number): number[] {
  let seeds = [1, 2];
  const rounds = Math.log2(bracketSize);
  for (let i = 1; i < rounds; i++) {
    const out: number[] = [];
    const sum = Math.pow(2, i + 1) + 1;
    for (const s of seeds) {
      out.push(s);
      out.push(sum - s);
    }
    seeds = out;
  }
  return seeds;
}

interface MatchNode {
  id: string;
  round: number;
  matchNumber: number;
  bracketCategory: 'winners' | 'losers' | 'grand-finals';
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  winnerNextId: string | null;
  loserNextId: string | null;
  isBye: boolean;
  state: 'pending' | 'completed';
}

export async function generateBracket(
  tournamentId: string,
  format: TournamentFormat,
  teams: Team[]
): Promise<Match[]> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
    .limit(1);

  if (existing && existing.length > 0) {
    const { data: allMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true });
    return ((allMatches ?? []) as unknown as Tables<'matches'>[]).map(toMatch);
  }

  if (teams.length < 2) {
    throw new ValidationError('At least 2 teams are required to generate a bracket');
  }

  const sorted = [...teams].sort((a, b) => {
    if (a.seed !== null && b.seed !== null) return a.seed - b.seed;
    if (a.seed !== null) return -1;
    if (b.seed !== null) return 1;
    return 0;
  });

  let nextSeed =
    Math.max(0, ...sorted.filter((t) => t.seed !== null).map((t) => t.seed!)) + 1;
  for (const t of sorted) {
    if (t.seed === null) {
      t.seed = nextSeed++;
    }
  }

  const seedToTeam = new Map<number, Team>();
  for (const t of sorted) seedToTeam.set(t.seed!, t);

  const bracketSize = nextPowerOfTwo(teams.length);
  const seedOrder = generateSeedOrder(bracketSize);
  const winnersRounds = Math.log2(bracketSize);

  const nodes: MatchNode[] = [];
  let globalMatchNum = 0;

  function uid() {
    return crypto.randomUUID();
  }

  // ---------- Winners bracket ----------
  const winnersGrid: string[][] = [];

  for (let r = 1; r <= winnersRounds; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r);
    const ids: string[] = [];
    for (let m = 0; m < matchesInRound; m++) {
      ids.push(uid());
    }
    winnersGrid.push(ids);
  }

  // Round 1: pair teams using seed order
  for (let m = 0; m < winnersGrid[0].length; m++) {
    const seedA = seedOrder[m * 2];
    const seedB = seedOrder[m * 2 + 1];
    const teamA = seedToTeam.get(seedA) ?? null;
    const teamB = seedToTeam.get(seedB) ?? null;

    const isBye = !teamA || !teamB;
    const winner = isBye ? (teamA ?? teamB) : null;

    const nextRoundMatch = winnersGrid[1]?.[Math.floor(m / 2)] ?? null;

    globalMatchNum++;
    nodes.push({
      id: winnersGrid[0][m],
      round: 1,
      matchNumber: globalMatchNum,
      bracketCategory: 'winners',
      teamAId: teamA?.id ?? null,
      teamBId: teamB?.id ?? null,
      winnerTeamId: winner?.id ?? null,
      winnerNextId: nextRoundMatch,
      loserNextId: null,
      isBye,
      state: isBye ? 'completed' : 'pending',
    });
  }

  // Winners rounds 2+
  for (let r = 2; r <= winnersRounds; r++) {
    const roundIdx = r - 1;
    for (let m = 0; m < winnersGrid[roundIdx].length; m++) {
      const nextRoundMatch = winnersGrid[roundIdx + 1]?.[Math.floor(m / 2)] ?? null;
      globalMatchNum++;
      nodes.push({
        id: winnersGrid[roundIdx][m],
        round: r,
        matchNumber: globalMatchNum,
        bracketCategory: 'winners',
        teamAId: null,
        teamBId: null,
        winnerTeamId: null,
        winnerNextId: nextRoundMatch,
        loserNextId: null,
        isBye: false,
        state: 'pending',
      });
    }
  }

  // Advance bye winners into round 2
  for (const node of nodes) {
    if (node.isBye && node.winnerTeamId && node.winnerNextId) {
      const nextNode = nodes.find((n) => n.id === node.winnerNextId);
      if (nextNode) {
        if (!nextNode.teamAId) nextNode.teamAId = node.winnerTeamId;
        else if (!nextNode.teamBId) nextNode.teamBId = node.winnerTeamId;
      }
    }
  }

  // ---------- Double elimination additions ----------
  if (format === 'double-elimination') {
    const losersGrid: string[][] = [];
    const losersRoundCount = 2 * (winnersRounds - 1);

    // Build losers bracket structure
    // Odd losers rounds: play among themselves
    // Even losers rounds: absorb a loser dropping from winners
    let teamsInLosers = winnersGrid[0].length; // starts with WR1 losers count

    for (let lr = 1; lr <= losersRoundCount; lr++) {
      let matchesInRound: number;
      if (lr === 1) {
        matchesInRound = Math.floor(teamsInLosers / 2);
      } else if (lr % 2 === 0) {
        // Even round: survivors play incoming losers from winners bracket
        matchesInRound = losersGrid[losersGrid.length - 1].length;
      } else {
        // Odd round: halve
        matchesInRound = Math.max(1, Math.floor(losersGrid[losersGrid.length - 1].length / 2));
      }
      const ids: string[] = [];
      for (let m = 0; m < matchesInRound; m++) ids.push(uid());
      losersGrid.push(ids);
    }

    // Create losers bracket match nodes
    for (let lr = 0; lr < losersGrid.length; lr++) {
      const losersRound = lr + 1;
      for (let m = 0; m < losersGrid[lr].length; m++) {
        const nextLosersMatch = losersGrid[lr + 1]?.[
          losersRound % 2 === 1 ? m : Math.floor(m / 2)
        ] ?? null;
        globalMatchNum++;
        nodes.push({
          id: losersGrid[lr][m],
          round: winnersRounds + losersRound,
          matchNumber: globalMatchNum,
          bracketCategory: 'losers',
          teamAId: null,
          teamBId: null,
          winnerTeamId: null,
          winnerNextId: nextLosersMatch,
          loserNextId: null,
          isBye: false,
          state: 'pending',
        });
      }
    }

    // Link losers from winners rounds into losers bracket (even rounds absorb)
    for (let wr = 0; wr < winnersGrid.length; wr++) {
      const losersTarget = wr === 0 ? 0 : 2 * wr - 1;
      if (losersTarget < losersGrid.length) {
        for (let m = 0; m < winnersGrid[wr].length; m++) {
          const wNode = nodes.find((n) => n.id === winnersGrid[wr][m]);
          const targetMatchIdx = wr === 0 ? Math.floor(m / 2) : m;
          if (wNode && targetMatchIdx < losersGrid[losersTarget].length) {
            wNode.loserNextId = losersGrid[losersTarget][targetMatchIdx];
          }
        }
      }
    }

    // Grand finals
    const gfId = uid();
    const winnersChampMatch = winnersGrid[winnersGrid.length - 1][0];
    const losersChampMatch = losersGrid[losersGrid.length - 1]?.[0];

    const wChampNode = nodes.find((n) => n.id === winnersChampMatch);
    if (wChampNode) wChampNode.winnerNextId = gfId;

    const lChampNode = losersChampMatch
      ? nodes.find((n) => n.id === losersChampMatch)
      : null;
    if (lChampNode) lChampNode.winnerNextId = gfId;

    globalMatchNum++;
    nodes.push({
      id: gfId,
      round: winnersRounds + losersRoundCount + 1,
      matchNumber: globalMatchNum,
      bracketCategory: 'grand-finals',
      teamAId: null,
      teamBId: null,
      winnerTeamId: null,
      winnerNextId: null,
      loserNextId: null,
      isBye: false,
      state: 'pending',
    });
  }

  // ---------- Persist to database ----------
  const inserts: TablesInsert<'matches'>[] = nodes.map((n) => ({
    id: n.id,
    tournament_id: tournamentId,
    round: n.round,
    match_number: n.matchNumber,
    bracket_category: n.bracketCategory,
    team_a_id: n.teamAId,
    team_b_id: n.teamBId,
    winner_team_id: n.winnerTeamId,
    winner_next_match_id: n.winnerNextId,
    loser_next_match_id: n.loserNextId,
    is_bye: n.isBye,
    state: n.state,
    completed_at: n.state === 'completed' ? new Date().toISOString() : null,
  }));

  const BATCH = 50;
  for (let i = 0; i < inserts.length; i += BATCH) {
    const batch = inserts.slice(i, i + BATCH);
    const { error } = await supabase.from('matches').insert(batch as never);
    if (error) throw new ValidationError(`Failed to create matches: ${error.message}`);
  }

  const { data: allMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true })
    .order('match_number', { ascending: true });

  return ((allMatches ?? []) as unknown as Tables<'matches'>[]).map(toMatch);
}
