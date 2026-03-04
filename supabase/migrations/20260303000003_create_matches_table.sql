-- Create matches table
CREATE TABLE matches (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id         UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round                 INTEGER     NOT NULL,
    match_number          INTEGER     NOT NULL,
    bracket_category      TEXT        DEFAULT 'winners' CHECK (bracket_category IN ('winners', 'losers', 'grand-finals')),
    team_a_id             UUID        REFERENCES teams(id) ON DELETE SET NULL,
    team_b_id             UUID        REFERENCES teams(id) ON DELETE SET NULL,
    winner_team_id        UUID        REFERENCES teams(id) ON DELETE SET NULL,
    winner_next_match_id  UUID        REFERENCES matches(id) ON DELETE SET NULL,
    loser_next_match_id   UUID        REFERENCES matches(id) ON DELETE SET NULL,
    is_bye                BOOLEAN     NOT NULL DEFAULT false,
    state                 TEXT        NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'in-progress', 'completed', 'skipped')),
    started_at            TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_tournament_round ON matches(tournament_id, round);
CREATE INDEX idx_matches_team_a ON matches(team_a_id);
CREATE INDEX idx_matches_team_b ON matches(team_b_id);
CREATE INDEX idx_matches_winner_next ON matches(winner_next_match_id);
CREATE INDEX idx_matches_loser_next ON matches(loser_next_match_id);

-- Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament owners can manage matches"
    ON matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = matches.tournament_id
              AND tournaments.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = matches.tournament_id
              AND tournaments.owner_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can read matches"
    ON matches FOR SELECT
    USING (true);
