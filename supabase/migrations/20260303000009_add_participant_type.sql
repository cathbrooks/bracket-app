-- Add participant_type to tournaments (teams vs individual players)
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS participant_type TEXT NOT NULL DEFAULT 'teams'
  CHECK (participant_type IN ('teams', 'players'));

COMMENT ON COLUMN tournaments.participant_type IS 'Whether the bracket uses teams or individual players';
