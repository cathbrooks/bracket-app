-- Create bracket_predictions table
CREATE TABLE bracket_predictions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id   UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    session_id      TEXT        NOT NULL,
    display_name    TEXT        NOT NULL,
    predictions     JSONB       NOT NULL DEFAULT '{}',
    total_points    INTEGER     NOT NULL DEFAULT 0,
    correct_count   INTEGER     NOT NULL DEFAULT 0,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tournament_id, session_id)
);

-- Indexes
CREATE INDEX idx_bracket_predictions_tournament_id ON bracket_predictions(tournament_id);

-- Row Level Security
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create predictions"
    ON bracket_predictions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can read predictions"
    ON bracket_predictions FOR SELECT
    USING (true);

CREATE POLICY "Anyone can update their own prediction"
    ON bracket_predictions FOR UPDATE
    USING (true);
