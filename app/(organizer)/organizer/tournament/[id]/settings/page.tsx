import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { toTournament } from '@/lib/types/tournament.types';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/lib/database.types';
import { TournamentSettingsForm } from '@/components/tournaments/TournamentSettingsForm';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('tournaments').select('name').eq('id', id).single<{ name: string }>();
  return { title: data ? `Settings – ${data.name} | Bracket App` : 'Settings | Bracket App' };
}

export default async function SettingsPage({
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

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">{t.name}</p>
        </div>
        <Link href={ROUTES.organizer.tournament(id)}>
          <Button variant="outline">Back to Tournament</Button>
        </Link>
      </div>

      <TournamentSettingsForm tournament={t} />
    </div>
  );
}
