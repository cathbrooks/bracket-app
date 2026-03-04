-- Create teams table
CREATE TABLE teams (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id               UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name                        TEXT        NOT NULL CHECK (char_length(name) <= 50),
    seed                        INTEGER,
    time_trial_result_seconds   NUMERIC,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tournament_id, name)
);

-- Indexes
CREATE INDEX idx_teams_tournament_id ON teams(tournament_id);

-- Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament owners can manage teams"
    ON teams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = teams.tournament_id
              AND tournaments.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tournaments
            WHERE tournaments.id = teams.tournament_id
              AND tournaments.owner_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can read teams"
    ON teams FOR SELECT
    USING (true);
