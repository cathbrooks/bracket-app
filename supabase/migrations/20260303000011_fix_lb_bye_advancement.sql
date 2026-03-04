-- Update advance_match_winner to auto-complete losers-bracket bye matches.
-- When a WR1 loser is placed into a losers bracket match that is flagged isBye=true,
-- that match has only one participant (the other slot will never be filled because the
-- paired WR1 match was itself a bye). The RPC must complete it immediately and advance
-- the winner into the next losers bracket match.

CREATE OR REPLACE FUNCTION advance_match_winner(
    p_match_id       UUID,
    p_winner_team_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_match              RECORD;
    v_loser_team_id      UUID;
    v_winner_next        JSONB := NULL;
    v_loser_next         JSONB := NULL;
    v_updated_match      JSONB;
    v_lb_match           RECORD;
BEGIN
    -- Fetch and lock the match row
    SELECT * INTO v_match
    FROM matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found: %', p_match_id;
    END IF;

    IF v_match.state <> 'in-progress' THEN
        RAISE EXCEPTION 'Match % is not in-progress (current state: %)', p_match_id, v_match.state;
    END IF;

    -- Validate winner is one of the two teams
    IF p_winner_team_id IS DISTINCT FROM v_match.team_a_id
       AND p_winner_team_id IS DISTINCT FROM v_match.team_b_id THEN
        RAISE EXCEPTION 'Team % is not a participant in match %', p_winner_team_id, p_match_id;
    END IF;

    -- Determine the loser
    IF p_winner_team_id = v_match.team_a_id THEN
        v_loser_team_id := v_match.team_b_id;
    ELSE
        v_loser_team_id := v_match.team_a_id;
    END IF;

    -- Complete the current match
    UPDATE matches
    SET winner_team_id = p_winner_team_id,
        state          = 'completed',
        completed_at   = NOW()
    WHERE id = p_match_id;

    SELECT to_jsonb(m) INTO v_updated_match
    FROM matches m
    WHERE m.id = p_match_id;

    -- Advance winner to next match
    IF v_match.winner_next_match_id IS NOT NULL THEN
        UPDATE matches
        SET team_a_id = CASE WHEN team_a_id IS NULL THEN p_winner_team_id ELSE team_a_id END,
            team_b_id = CASE WHEN team_a_id IS NOT NULL AND team_b_id IS NULL THEN p_winner_team_id ELSE team_b_id END
        WHERE id = v_match.winner_next_match_id
          AND (team_a_id IS NULL OR team_b_id IS NULL);

        SELECT to_jsonb(m) INTO v_winner_next
        FROM matches m
        WHERE m.id = v_match.winner_next_match_id;
    END IF;

    -- Advance loser to next match (double-elimination losers bracket)
    IF v_match.loser_next_match_id IS NOT NULL AND v_loser_team_id IS NOT NULL THEN
        UPDATE matches
        SET team_a_id = CASE WHEN team_a_id IS NULL THEN v_loser_team_id ELSE team_a_id END,
            team_b_id = CASE WHEN team_a_id IS NOT NULL AND team_b_id IS NULL THEN v_loser_team_id ELSE team_b_id END
        WHERE id = v_match.loser_next_match_id
          AND (team_a_id IS NULL OR team_b_id IS NULL);

        -- If the target losers-bracket match is a bye (single-participant), auto-complete
        -- it so the loser advances without waiting for a second participant that won't arrive.
        SELECT * INTO v_lb_match FROM matches WHERE id = v_match.loser_next_match_id;

        IF v_lb_match.is_bye THEN
            UPDATE matches
            SET winner_team_id = v_loser_team_id,
                state          = 'completed',
                completed_at   = NOW()
            WHERE id = v_match.loser_next_match_id;

            -- Advance the bye winner into the next losers-bracket match
            IF v_lb_match.winner_next_match_id IS NOT NULL THEN
                UPDATE matches
                SET team_a_id = CASE WHEN team_a_id IS NULL THEN v_loser_team_id ELSE team_a_id END,
                    team_b_id = CASE WHEN team_a_id IS NOT NULL AND team_b_id IS NULL THEN v_loser_team_id ELSE team_b_id END
                WHERE id = v_lb_match.winner_next_match_id
                  AND (team_a_id IS NULL OR team_b_id IS NULL);
            END IF;
        END IF;

        SELECT to_jsonb(m) INTO v_loser_next
        FROM matches m
        WHERE m.id = v_match.loser_next_match_id;
    END IF;

    RETURN jsonb_build_object(
        'match',        v_updated_match,
        'winner_next',  v_winner_next,
        'loser_next',   v_loser_next
    );
END;
$$;
