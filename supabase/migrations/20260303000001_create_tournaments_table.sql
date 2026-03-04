-- Create tournaments table
CREATE TABLE tournaments (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
    game_type                   TEXT        NOT NULL CHECK (char_length(game_type) <= 50),
    format                      TEXT        NOT NULL CHECK (format IN ('single-elimination', 'double-elimination')),
    team_count                  INTEGER     NOT NULL CHECK (team_count BETWEEN 2 AND 32),
    station_count               INTEGER     DEFAULT 1,
    time_per_match_minutes      INTEGER,
    seeding_mode                TEXT        NOT NULL DEFAULT 'manual' CHECK (seeding_mode IN ('manual', 'time-trial')),
    estimated_duration_minutes  INTEGER,
    join_code                   TEXT        NOT NULL CHECK (char_length(join_code) BETWEEN 6 AND 8),
    state                       TEXT        NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'registration', 'seeding', 'in-progress', 'completed')),
    owner_id                    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX unq_tournaments_join_code ON tournaments(join_code);
CREATE INDEX idx_tournaments_owner_id ON tournaments(owner_id);
CREATE INDEX idx_tournaments_state ON tournaments(state);

-- Row Level Security
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their tournaments"
    ON tournaments FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can read tournaments with valid join code"
    ON tournaments FOR SELECT
    USING (true);
