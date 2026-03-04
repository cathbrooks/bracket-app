-- Add optional roster size to tournaments and player roster JSONB to teams
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS roster_size INTEGER DEFAULT NULL;

COMMENT ON COLUMN tournaments.roster_size IS 'Number of players per team (null = no roster tracking)';

ALTER TABLE teams
ADD COLUMN IF NOT EXISTS roster JSONB DEFAULT NULL;

COMMENT ON COLUMN teams.roster IS 'Array of player name strings e.g. ["Alice", "Bob"]';
