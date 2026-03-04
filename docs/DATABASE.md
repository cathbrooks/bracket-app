# Database Schema & Migrations

PostgreSQL schema managed via Supabase migrations in `supabase/migrations/`.

## Tables

### `tournaments`
Tournament configuration and metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | 3–100 chars |
| game_type | TEXT | Max 50 chars |
| format | TEXT | `single-elimination` or `double-elimination` |
| team_count | INTEGER | 2–32 |
| station_count | INTEGER | Default 1 |
| time_per_match_minutes | INTEGER | Optional |
| seeding_mode | TEXT | `manual` or `time-trial` |
| estimated_duration_minutes | INTEGER | Optional |
| join_code | TEXT | 6–8 chars, unique (spectator access) |
| state | TEXT | `draft`, `registration`, `seeding`, `in-progress`, `completed` |
| owner_id | UUID | References `auth.users(id)` CASCADE |
| created_at, updated_at | TIMESTAMPTZ | Auto-managed |

**Indexes:** `join_code` (unique), `owner_id`, `state`

### `teams`
Teams for a tournament.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tournament_id | UUID | References tournaments CASCADE |
| name | TEXT | Max 50 chars, unique per tournament |
| seed | INTEGER | Optional |
| time_trial_result_seconds | NUMERIC | For time-trial seeding |
| created_at, updated_at | TIMESTAMPTZ | Auto-managed |

**Indexes:** `tournament_id`

### `matches`
Bracket matches and results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tournament_id | UUID | References tournaments CASCADE |
| round | INTEGER | Bracket round |
| match_number | INTEGER | Order within round |
| bracket_category | TEXT | `winners`, `losers`, `grand-finals` |
| team_a_id, team_b_id | UUID | References teams SET NULL |
| winner_team_id | UUID | References teams SET NULL |
| winner_next_match_id | UUID | Self-reference, next match for winner |
| loser_next_match_id | UUID | Self-reference, losers bracket (double elim) |
| is_bye | BOOLEAN | Default false |
| state | TEXT | `pending`, `in-progress`, `completed`, `skipped` |
| started_at, completed_at | TIMESTAMPTZ | Optional |
| created_at, updated_at | TIMESTAMPTZ | Auto-managed |

**Indexes:** `tournament_id`, `(tournament_id, round)`, `team_a_id`, `team_b_id`, `winner_next_match_id`, `loser_next_match_id`

### `reactions`
Spectator emoji reactions per match.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| match_id | UUID | References matches CASCADE |
| session_id | TEXT | Anonymous spectator ID |
| emoji_type | TEXT | `fire`, `heart`, `trophy`, `shocked`, `sad`, `clap` |
| created_at, updated_at | TIMESTAMPTZ | Auto-managed |

**Constraints:** Unique `(match_id, session_id)`

### `bracket_predictions`
Spectator bracket predictions (pre-tournament).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tournament_id | UUID | References tournaments CASCADE |
| session_id | TEXT | Anonymous spectator ID |
| display_name | TEXT | Optional display name |
| predictions | JSONB | Bracket prediction map |
| total_points, correct_count | INTEGER | Scoring |
| submitted_at, updated_at | TIMESTAMPTZ | Auto-managed |

**Constraints:** Unique `(tournament_id, session_id)`

### `prediction_scores`
Per-match prediction results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bracket_prediction_id | UUID | References bracket_predictions CASCADE |
| match_id | UUID | References matches CASCADE |
| predicted_winner_team_id | UUID | Optional |
| actual_winner_team_id | UUID | Optional |
| points_earned | INTEGER | Default 0 |
| created_at, updated_at | TIMESTAMPTZ | Auto-managed |

## Row Level Security (RLS)

- **Tournaments:** Owners have full CRUD; anyone can SELECT (spectators filter by join code in app).
- **Teams, Matches:** Policies tied to tournament ownership for organizers; read access for spectators.
- **Reactions, Bracket Predictions:** Open insert/update for anonymous spectators; read for aggregates.

## Triggers

All tables use a `set_updated_at()` trigger on `BEFORE UPDATE` to keep `updated_at` current.

## RPC Functions

### `advance_match_winner(match_id UUID, winner_team_id UUID) RETURNS JSONB`

Atomically:

1. Validates match exists and is `in-progress`
2. Validates winner is one of `team_a_id` or `team_b_id`
3. Sets match `winner_team_id`, `state = 'completed'`, `completed_at`
4. Advances winner into `winner_next_match_id` (fills team_a_id or team_b_id)
5. Advances loser into `loser_next_match_id` (double elimination)

Returns JSONB with the updated match and any modified next matches.

**Usage:** Call via Supabase client: `supabase.rpc('advance_match_winner', { match_id, winner_team_id })`

## Running Migrations

```bash
# Local (Supabase CLI)
supabase db reset

# Link to hosted project
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## Type Generation

Generate TypeScript types from the schema:

```bash
npm run gen:types
```

Output: `lib/database.types.ts`
