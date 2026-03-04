import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { toTournament } from '@/lib/types/tournament.types';
import { ROUTES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';
import type { Tables } from '@/lib/database.types';

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

export const metadata = {
  title: 'Dashboard | Bracket App',
  description: 'Manage your tournaments.',
};

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from('tournaments')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const tournaments = ((rows ?? []) as unknown as Tables<'tournaments'>[]).map(toTournament);

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Tournaments</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all of your brackets.
          </p>
        </div>
        <Link href={ROUTES.organizer.create}>
          <Button>Create Tournament</Button>
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium">No tournaments yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first tournament to get started.
            </p>
            <Link href={ROUTES.organizer.create} className="mt-4">
              <Button>Create Tournament</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <Link key={t.id} href={ROUTES.organizer.tournament(t.id)}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">{t.name}</CardTitle>
                    <Badge variant={STATE_VARIANTS[t.state] ?? 'secondary'}>
                      {STATE_LABELS[t.state] ?? t.state}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{t.gameType}</p>
                  <p>
                    {t.teamCount} teams &middot;{' '}
                    {t.format === 'double-elimination' ? 'Double Elim' : 'Single Elim'}
                  </p>
                  {t.estimatedDurationMinutes && (
                    <p>Est. {formatDuration(t.estimatedDurationMinutes)}</p>
                  )}
                  <p className="pt-1 font-mono text-xs tracking-wider">
                    Code: {t.joinCode}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
