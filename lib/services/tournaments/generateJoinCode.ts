import { createClient } from '@/lib/supabase/server';
import { generateJoinCode as generateCode } from '@/lib/utils/validation';

const MAX_RETRIES = 5;

/**
 * Generate a unique join code by checking against existing tournaments.
 * Excludes ambiguous characters (0/O, 1/l/I) and retries on collision.
 */
export async function generateUniqueJoinCode(): Promise<string> {
  const supabase = await createClient();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();

    const { data, error: jcError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('join_code', code)
      .limit(1);

    // #region agent log
    fetch('http://127.0.0.1:7886/ingest/2affbf00-a3fc-4e94-a928-3efc7a4a95d5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd6809'},body:JSON.stringify({sessionId:'dd6809',location:'generateJoinCode.ts:19',message:'join code uniqueness check',data:{attempt,code,hasData:!!data,dataLen:data?.length??null,errorMsg:jcError?.message??null,errorCode:jcError?.code??null},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (!data || data.length === 0) {
      return code;
    }
  }

  throw new Error('Failed to generate unique join code after maximum retries');
}
