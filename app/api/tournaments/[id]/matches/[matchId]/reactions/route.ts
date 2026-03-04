import { NextResponse, type NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/errors/api-error-handler';
import { ValidationError } from '@/lib/errors/custom-errors';
import { createClient } from '@/lib/supabase/server';
import { checkReactionRateLimit } from '@/lib/rate-limiting/reaction-limiter';
import { EMOJI_TYPES, type EmojiType } from '@/lib/constants';

type RouteContext = { params: Promise<{ id: string; matchId: string }> };

export const POST = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext
) => {
  const { id, matchId } = await context.params;
  const supabase = await createClient();

  const body = await request.json();
  const { emojiType, sessionId } = body as { emojiType: string; sessionId: string };

  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('Session ID is required');
  }

  if (!emojiType || !EMOJI_TYPES.includes(emojiType as EmojiType)) {
    throw new ValidationError(`Invalid emoji type. Must be one of: ${EMOJI_TYPES.join(', ')}`);
  }

  if (!checkReactionRateLimit(sessionId, matchId)) {
    throw new ValidationError('Please wait before reacting again');
  }

  const { data: match } = await supabase
    .from('matches')
    .select('id, state')
    .eq('id', matchId)
    .eq('tournament_id', id)
    .single();

  if (!match) {
    throw new ValidationError('Match not found');
  }

  const { error: upsertError } = await supabase
    .from('reactions')
    .upsert(
      {
        match_id: matchId,
        session_id: sessionId,
        emoji_type: emojiType,
      } as never,
      { onConflict: 'match_id,session_id' }
    );

  if (upsertError) {
    throw new ValidationError(upsertError.message);
  }

  const { data: reactions } = await supabase
    .from('reactions')
    .select('emoji_type')
    .eq('match_id', matchId);

  const counts: Record<string, number> = {};
  for (const type of EMOJI_TYPES) counts[type] = 0;
  for (const r of reactions ?? []) {
    const row = r as unknown as { emoji_type: string };
    if (row.emoji_type in counts) counts[row.emoji_type]++;
  }

  return NextResponse.json({
    data: { reactionCounts: counts },
    error: null,
  });
});
