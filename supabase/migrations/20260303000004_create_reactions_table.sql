-- Create reactions table
CREATE TABLE reactions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id      UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    session_id    TEXT        NOT NULL,
    emoji_type    TEXT        NOT NULL CHECK (emoji_type IN ('fire', 'heart', 'trophy', 'shocked', 'sad', 'clap')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (match_id, session_id)
);

-- Indexes
CREATE INDEX idx_reactions_match_id ON reactions(match_id);

-- Row Level Security
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create reactions"
    ON reactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update their own reaction"
    ON reactions FOR UPDATE
    USING (true);

CREATE POLICY "Anyone can read reactions"
    ON reactions FOR SELECT
    USING (true);
