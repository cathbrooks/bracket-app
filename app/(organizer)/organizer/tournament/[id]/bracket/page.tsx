import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { toTournament, toTeam, toMatch } from '@/lib/types/tournament.types';
import { ROUTES } from '@/lib/constants';
import { getParticipantLabels } from '@/lib/utils/terminology';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Tables } from '@/lib/database.types';
import { BracketView } from '@/components/tournaments/BracketView';
import { generateBracket } from '@/lib/services/bracket/generateBracket';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('tournaments').select('name').eq('id', id).single<{ name: string }>();
  return { title: data ? `Bracket – ${data.name} | Bracket App` : 'Bracket | Bracket App' };
}

export default async function BracketPage({
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

  if (error || !tournament) notFound();

  const t = toTournament(tournament as unknown as Tables<'tournaments'>);

  const [{ data: teamRows }, { data: matchRows }] = await Promise.all([
    supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', id)
      .order('seed', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', id)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true }),
  ]);

  const teams = ((teamRows ?? []) as unknown as Tables<'teams'>[]).map(toTeam);
  let matches = ((matchRows ?? []) as unknown as Tables<'matches'>[]).map(toMatch);

  const labels = getParticipantLabels(t.participantType ?? 'teams');

  // Auto-generate bracket if no matches exist and we have enough teams
  if (matches.length === 0 && teams.length >= 2) {
    try {
      matches = await generateBracket(id, t.format, teams);
    } catch {
      // If generation fails, we'll show the empty state below
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bracket</h1>
          <p className="text-muted-foreground">{t.name}</p>
        </div>
        <Link href={ROUTES.organizer.tournament(id)}>
          <Button variant="outline">Back to Tournament</Button>
        </Link>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium">Not enough {labels.plural.toLowerCase()}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You need at least 2 {labels.plural.toLowerCase()} to generate a bracket. Add {labels.plural.toLowerCase()} first.
            </p>
            <Link href={ROUTES.organizer.tournament(id)} className="mt-4">
              <Button>Back to Tournament</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <BracketView tournament={t} teams={teams} matches={matches} isOrganizer />
      )}
    </div>
  );
}
