import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { toTournament, toTeam, toMatch } from '@/lib/types/tournament.types';
import { ROUTES } from '@/lib/constants';
import { getParticipantLabels } from '@/lib/utils/terminology';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';
import type { Tables } from '@/lib/database.types';
import { TournamentActions } from '@/components/tournaments/TournamentActions';
import { QRCodeDisplay } from '@/components/organizer/QRCodeDisplay';

const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration',
  seeding: 'Seeding',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

const STATE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  registration: 'outline',
  seeding: 'outline',
  'in-progress': 'default',
  completed: 'secondary',
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('tournaments').select('name').eq('id', id).single();
  return { title: data ? `${data.name} | Bracket App` : 'Tournament | Bracket App' };
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  const t = toTournament(tournament as unknown as Tables<'tournaments'>);

  const { data: teamRows } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', id)
    .order('seed', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  const teams = ((teamRows ?? []) as unknown as Tables<'teams'>[]).map(toTeam);

  const { data: matchRows } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', id)
    .order('round', { ascending: true })
    .order('match_number', { ascending: true });

  const matches = ((matchRows ?? []) as unknown as Tables<'matches'>[]).map(toMatch);

  const completedMatches = matches.filter((m) => m.state === 'completed').length;
  const totalMatches = matches.filter((m) => !m.isBye).length;
  const seededTeams = teams.filter((tm) => tm.seed !== null).length;
  const labels = getParticipantLabels(t.participantType ?? 'teams');

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{t.name}</h1>
            <Badge variant={STATE_VARIANTS[t.state] ?? 'secondary'}>
              {STATE_LABELS[t.state] ?? t.state}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {t.gameType} &middot;{' '}
            {t.format === 'double-elimination' ? 'Double Elimination' : 'Single Elimination'}{' '}
            &middot; {t.teamCount} {labels.plural.toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.organizer.bracket(id)}>
            <Button variant="outline">View Bracket</Button>
          </Link>
          <Link href={ROUTES.organizer.seeding(id)}>
            <Button variant="outline">Seeding</Button>
          </Link>
          <Link href={ROUTES.organizer.settings(id)}>
            <Button variant="outline">Settings</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {labels.plural}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teams.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {seededTeams} of {teams.length} seeded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {completedMatches} / {totalMatches}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {t.estimatedDurationMinutes ? formatDuration(t.estimatedDurationMinutes) : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.stationCount ?? 1} station{(t.stationCount ?? 1) > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <QRCodeDisplay joinCode={t.joinCode} tournamentName={t.name} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{labels.plural}</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No {labels.plural.toLowerCase()} registered.</p>
            ) : (
              <div className="space-y-2">
                {teams.map((tm) => (
                  <div
                    key={tm.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{tm.name}</span>
                    <span className="text-muted-foreground">
                      {tm.seed ? `Seed #${tm.seed}` : 'Unseeded'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matches yet. Start the tournament to generate the bracket.
              </p>
            ) : (
              <div className="space-y-2">
                {matches.slice(0, 10).map((m) => {
                  const teamA = teams.find((tm) => tm.id === m.teamAId);
                  const teamB = teams.find((tm) => tm.id === m.teamBId);
                  const winner = teams.find((tm) => tm.id === m.winnerTeamId);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div>
                        <span className={m.winnerTeamId === m.teamAId ? 'font-bold' : ''}>
                          {teamA?.name ?? 'TBD'}
                        </span>
                        {' vs '}
                        <span className={m.winnerTeamId === m.teamBId ? 'font-bold' : ''}>
                          {teamB?.name ?? 'TBD'}
                        </span>
                      </div>
                      <Badge
                        variant={
                          m.state === 'completed'
                            ? 'secondary'
                            : m.state === 'in-progress'
                              ? 'default'
                              : 'outline'
                        }
                      >
                        {m.state === 'completed' && winner
                          ? `${winner.name} won`
                          : m.state}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <TournamentActions tournament={t} />
      </div>
    </div>
  );
}
