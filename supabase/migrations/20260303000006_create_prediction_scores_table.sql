-- Create prediction_scores table
CREATE TABLE prediction_scores (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    bracket_prediction_id       UUID        NOT NULL REFERENCES bracket_predictions(id) ON DELETE CASCADE,
    match_id                    UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    predicted_winner_team_id    UUID        REFERENCES teams(id) ON DELETE SET NULL,
    actual_winner_team_id       UUID        REFERENCES teams(id) ON DELETE SET NULL,
    points_earned               INTEGER     NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prediction_scores_prediction ON prediction_scores(bracket_prediction_id);
CREATE INDEX idx_prediction_scores_match ON prediction_scores(match_id);

-- Row Level Security
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prediction scores"
    ON prediction_scores FOR SELECT
    USING (true);
