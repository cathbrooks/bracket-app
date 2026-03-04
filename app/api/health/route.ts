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

    // #region agent log
    const { data: tData, error: tError } = await supabase.from('tournaments').select('id').limit(1);
    fetch('http://127.0.0.1:7886/ingest/2affbf00-a3fc-4e94-a928-3efc7a4a95d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd6809'},body:JSON.stringify({sessionId:'dd6809',location:'api/health/route.ts:H1-H2',message:'tournaments table check',data:{tournamentsData:tData,tournamentsError:tError?.message??null,tournamentsCode:tError?.code??null,supabaseUrl:process.env.NEXT_PUBLIC_SUPABASE_URL},timestamp:Date.now(),hypothesisId:'H1-H2'})}).catch(()=>{});
    // #endregion
    health.tournamentsTable = tError ? { error: tError.message, code: tError.code } : { exists: true, rowCount: tData?.length ?? 0 };
  } catch {
    health.database = 'unreachable';
  }

  return NextResponse.json(health);
}
