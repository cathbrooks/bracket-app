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

    if (!data || data.length === 0) {
      return code;
    }
  }

  throw new Error('Failed to generate unique join code after maximum retries');
}
