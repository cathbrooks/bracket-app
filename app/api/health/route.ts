import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const health: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('_health_check').select('*').limit(1);
    health.database = error ? 'degraded' : 'connected';

    const { data: tData, error: tError } = await supabase.from('tournaments').select('id').limit(1);
    health.tournamentsTable = tError ? { error: tError.message, code: tError.code } : { exists: true, rowCount: tData?.length ?? 0 };
  } catch {
    health.database = 'unreachable';
  }

  return NextResponse.json(health);
}
