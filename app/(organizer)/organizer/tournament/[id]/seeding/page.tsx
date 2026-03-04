import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { toTournament, toTeam } from '@/lib/types/tournament.types';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tables } from '@/lib/database.types';
import { SeedingManager } from '@/components/tournaments/SeedingManager';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('tournaments').select('name').eq('id', id).single();
  return { title: data ? `Seeding – ${data.name} | Bracket App` : 'Seeding | Bracket App' };
}

export default async function SeedingPage({
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

  const { data: teamRows } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', id)
    .order('seed', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  const teams = ((teamRows ?? []) as unknown as Tables<'teams'>[]).map(toTeam);

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seeding</h1>
          <p className="text-muted-foreground">
            {t.name} &middot; {t.seedingMode === 'time-trial' ? 'Time Trial' : 'Manual'} mode
          </p>
        </div>
        <Link href={ROUTES.organizer.tournament(id)}>
          <Button variant="outline">Back to Tournament</Button>
        </Link>
      </div>

      <SeedingManager tournament={t} initialTeams={teams} />
    </div>
  );
}
