-- Adds reverse_match_winner RPC to undo a completed match result.
-- This is the structural inverse of advance_match_winner (migration 011).
-- It removes the winner/loser from their next-match slots, reverses any
-- auto-completed bye match, and resets the target match back to in-progress.

CREATE OR REPLACE FUNCTION reverse_match_winner(
    p_match_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_match              RECORD;
    v_winner_team_id     UUID;
    v_loser_team_id      UUID;
    v_lb_match           RECORD;
    v_winner_next_state  TEXT;
    v_lb_is_bye          BOOLEAN;
    v_lb_state           TEXT;
    v_lb_winner_next_id  UUID;
    v_bye_downstream_state TEXT;
BEGIN
    -- Lock and fetch the match
    SELECT * INTO v_match
    FROM matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found: %', p_match_id;
    END IF;

    IF v_match.state <> 'completed' THEN
        RAISE EXCEPTION 'Match % is not completed (current state: %)', p_match_id, v_match.state;
    END IF;

    IF v_match.is_bye THEN
        RAISE EXCEPTION 'Cannot undo a bye match';
    END IF;

    IF v_match.winner_team_id IS NULL THEN
        RAISE EXCEPTION 'Match % has no recorded winner', p_match_id;
    END IF;

    v_winner_team_id := v_match.winner_team_id;
    v_loser_team_id  := CASE
                          WHEN v_match.team_a_id = v_winner_team_id THEN v_match.team_b_id
                          ELSE v_match.team_a_id
                        END;

    -- ── Guard: winner_next must not be completed ──────────────────────────
    IF v_match.winner_next_match_id IS NOT NULL THEN
        SELECT state INTO v_winner_next_state
        FROM matches WHERE id = v_match.winner_next_match_id;

        IF v_winner_next_state = 'completed' THEN
            RAISE EXCEPTION 'Cannot undo: the winner has already played their next match';
        END IF;
    END IF;

    -- ── Guard: loser_next must not be completed (accounting for auto-bye) ─
    IF v_match.loser_next_match_id IS NOT NULL THEN
        SELECT is_bye, state, winner_next_match_id
          INTO v_lb_is_bye, v_lb_state, v_lb_winner_next_id
        FROM matches WHERE id = v_match.loser_next_match_id;

        IF NOT v_lb_is_bye AND v_lb_state = 'completed' THEN
            RAISE EXCEPTION 'Cannot undo: the loser has already played their next match';
        END IF;

        -- If it was an auto-completed bye, check if the bye's downstream match is completed
        IF v_lb_is_bye AND v_lb_winner_next_id IS NOT NULL THEN
            SELECT state INTO v_bye_downstream_state
            FROM matches WHERE id = v_lb_winner_next_id;

            IF v_bye_downstream_state = 'completed' THEN
                RAISE EXCEPTION 'Cannot undo: the loser has already played their next match (through a bye)';
            END IF;
        END IF;
    END IF;

    -- ── Step 1: Reverse the auto-completed LB bye (if applicable) ─────────
    -- Must be done before touching loser_next so we can still read v_lb_match.winner_next_match_id.
    IF v_match.loser_next_match_id IS NOT NULL AND v_lb_is_bye THEN
        SELECT * INTO v_lb_match FROM matches WHERE id = v_match.loser_next_match_id;

        -- Remove loser from the bye's downstream match slot
        IF v_lb_match.winner_next_match_id IS NOT NULL THEN
            UPDATE matches
            SET team_a_id = CASE WHEN team_a_id = v_loser_team_id THEN NULL ELSE team_a_id END,
                team_b_id = CASE WHEN team_b_id = v_loser_team_id THEN NULL ELSE team_b_id END
            WHERE id = v_lb_match.winner_next_match_id;
        END IF;

        -- Reset the bye match itself back to pending with no participants
        UPDATE matches
        SET winner_team_id = NULL,
            state          = 'pending',
            completed_at   = NULL,
            team_a_id      = NULL,
            team_b_id      = NULL
        WHERE id = v_match.loser_next_match_id;

    -- ── Step 2: Remove loser from loser_next (non-bye case) ───────────────
    ELSIF v_match.loser_next_match_id IS NOT NULL AND v_loser_team_id IS NOT NULL THEN
        UPDATE matches
        SET team_a_id = CASE WHEN team_a_id = v_loser_team_id THEN NULL ELSE team_a_id END,
            team_b_id = CASE WHEN team_b_id = v_loser_team_id THEN NULL ELSE team_b_id END
        WHERE id = v_match.loser_next_match_id;
    END IF;

    -- ── Step 3: Remove winner from winner_next ────────────────────────────
    IF v_match.winner_next_match_id IS NOT NULL THEN
        UPDATE matches
        SET team_a_id = CASE WHEN team_a_id = v_winner_team_id THEN NULL ELSE team_a_id END,
            team_b_id = CASE WHEN team_b_id = v_winner_team_id THEN NULL ELSE team_b_id END
        WHERE id = v_match.winner_next_match_id;
    END IF;

    -- ── Step 4: Reset the match itself back to in-progress ────────────────
    -- Use 'in-progress' (not 'pending') since both team slots are still filled;
    -- the match is ready to be re-decided immediately.
    UPDATE matches
    SET winner_team_id = NULL,
        state          = 'in-progress',
        completed_at   = NULL
    WHERE id = p_match_id;

    RETURN jsonb_build_object(
        'match_id',           p_match_id,
        'reverted_winner_id', v_winner_team_id,
        'reverted_loser_id',  v_loser_team_id
    );
END;
$$;
