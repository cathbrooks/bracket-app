# Work Orders 5, 6, 7: Implementation Documentation

## Table of Contents

- [Work Order 5: Shared TypeScript Types & Utilities](#work-order-5-shared-typescript-types--utilities)
- [Work Order 6: Error Handling & Monitoring](#work-order-6-error-handling--monitoring)
- [Work Order 7: Real-Time Subscriptions Infrastructure](#work-order-7-real-time-subscriptions-infrastructure)
- [Dependencies Added](#dependencies-added)
- [File Tree](#file-tree)

---

## Work Order 5: Shared TypeScript Types & Utilities

### Purpose

Establish type-safe contracts for all domain entities, API requests/responses, database operations, validation schemas, and shared utility functions. These types and utilities are consumed across the entire frontend and backend codebase to ensure consistency.

---

### `lib/database.types.ts` — Generated Database Types

Hand-crafted TypeScript types matching the Supabase PostgreSQL schema (mirrors what `supabase gen types typescript` produces). Covers all six tables:

| Table | Description |
|-------|-------------|
| `tournaments` | Tournament configuration, state, and ownership |
| `teams` | Team names, seeds, and time-trial results |
| `matches` | Bracket matches with round/position, team slots, and progression links |
| `reactions` | Spectator emoji reactions per match |
| `bracket_predictions` | Spectator bracket predictions with scoring |
| `prediction_scores` | Per-match prediction accuracy tracking |

Each table has three type variants:

- **`Row`** — The full row shape returned by SELECT queries
- **`Insert`** — Fields accepted for INSERT (required fields mandatory, auto-generated fields optional)
- **`Update`** — All fields optional for partial UPDATE operations

Also exports the `advance_match_winner` RPC function signature and convenience generics:

```typescript
Tables<'tournaments'>       // → TournamentRow
TablesInsert<'tournaments'>  // → TournamentInsert
TablesUpdate<'tournaments'>  // → TournamentUpdate
```

**Modified files:** `lib/supabase/client.ts` and `lib/supabase/server.ts` were updated to import and use `Database` instead of the placeholder `type Database = any`.

---

### `lib/types/tournament.types.ts` — Domain Entity Types

Clean camelCase interfaces separated from the snake_case database representation:

**Core entities:**
- `Tournament` — Full tournament with all config fields
- `Team` — Team with seed and time-trial data
- `Match` — Bracket match with progression links
- `Reaction` — Single emoji reaction record
- `BracketPrediction` — Spectator prediction submission
- `PredictionScore` — Per-match prediction result

**Input types for creation/update:**
- `CreateTournamentInput` — Fields needed to create a tournament
- `UpdateTournamentInput` — Optional fields for partial tournament update
- `CreateTeamInput` — Fields needed to create a team
- `UpdateTeamInput` — Optional fields for partial team update

**Query result types (with joined data):**
- `MatchWithTeams` — Match with resolved team A, team B, and winner objects
- `TournamentWithTeams` — Tournament with its teams array
- `TournamentWithBracket` — Tournament with both teams and matches arrays

**Other types:**
- `ReactionCounts` — Record mapping each emoji type to its count
- `LeaderboardEntry` — Ranked prediction entry with display name and score
- `MatchAdvancementResult` — Return shape of the `advance_match_winner` RPC
- `DurationEstimate` — Calculated duration with formatted string

**Converter functions:**
- `toTournament(row)` — Converts a snake_case `TournamentRow` to a camelCase `Tournament`
- `toTeam(row)` — Converts `TeamRow` → `Team`
- `toMatch(row)` — Converts `MatchRow` → `Match`

---

### `lib/types/api.types.ts` — API Request/Response Types

Type-safe contracts for every API endpoint:

**Generic wrappers:**
- `ApiSuccessResponse<T>` — `{ data: T, error: null }`
- `ApiErrorResponse` — `{ data: null, error: { message, code?, fields? } }`
- `ApiResponse<T>` — Union of success and error
- `PaginatedResponse<T>` — Standard pagination envelope

**Endpoint types (request → response):**

| Endpoint | Request Type | Response Type |
|----------|-------------|---------------|
| Create tournament | `CreateTournamentRequest` | `CreateTournamentResponse` |
| Update tournament | `UpdateTournamentRequest` | `UpdateTournamentResponse` |
| Get tournament | — | `GetTournamentResponse` |
| List tournaments | — | `ListTournamentsResponse` |
| Create team | `CreateTeamRequest` | `CreateTeamResponse` |
| Bulk create teams | `BulkCreateTeamsRequest` | `BulkCreateTeamsResponse` |
| Record match result | `RecordMatchResultRequest` | `RecordMatchResultResponse` |
| Update seeds | `UpdateSeedsRequest` | `UpdateSeedsResponse` |
| Record time trial | `RecordTimeTrialRequest` | `RecordTimeTrialResponse` |
| Join tournament | `JoinTournamentRequest` | `JoinTournamentResponse` |
| Submit reaction | `SubmitReactionRequest` | `SubmitReactionResponse` |
| Submit prediction | `SubmitPredictionRequest` | `SubmitPredictionResponse` |
| Calculate duration | `CalculateDurationRequest` | `CalculateDurationResponse` |

---

### `lib/schemas/tournament.schema.ts` — Tournament Validation Schemas

Zod schemas for tournament configuration, designed to be shared between frontend forms and backend API validation:

| Schema | Fields | Key Rules |
|--------|--------|-----------|
| `basicInfoSchema` | name, gameType | 3–100 char name, 1–50 char game type |
| `formatSelectionSchema` | format | Must be `single-elimination` or `double-elimination` |
| `teamConfigSchema` | teamCount, seedingMode | 2–32 teams, `manual` or `time-trial` seeding |
| `timingConfigSchema` | timePerMatchMinutes, stationCount | 1–480 min/match, 1–16 stations |
| `tournamentConfigSchema` | All above merged | Combined schema for full tournament creation |

Each schema exports its inferred TypeScript type (e.g., `TournamentConfigFormData`).

---

### `lib/schemas/seeding.schema.ts` — Seeding Validation Schemas

| Schema | Purpose |
|--------|---------|
| `manualSeedSchema` | Single team seed assignment (teamId + seed number) |
| `manualSeedListSchema` | Array of seeds with uniqueness constraint |
| `timeTrialTimeSchema` | Time trial result recording (teamId + timeSeconds) |
| `leaderboardSchema` | Seeding leaderboard with team names, seeds, and optional times |

---

### `lib/utils/format.ts` — Formatting Utilities

| Function | Input → Output Example |
|----------|----------------------|
| `formatTime(centiseconds)` | `12345` → `"02:03.45"` |
| `formatDuration(minutes)` | `150` → `"2h 30m"` |
| `formatDate(timestamp)` | ISO string → `"Mar 3, 2026"` |
| `formatDateTime(timestamp)` | ISO string → `"Mar 3, 2026, 2:30 PM"` |
| `formatRelativeTime(timestamp)` | ISO string → `"2h ago"` or `"just now"` |
| `formatTournamentState(state)` | `"in-progress"` → `"In Progress"` |

---

### `lib/utils/validation.ts` — Validation Utilities

| Function | Purpose |
|----------|---------|
| `isPowerOfTwo(n)` | Check if a number is a power of two (bracket sizing) |
| `nextPowerOfTwo(n)` | Find the next power of two >= n |
| `calculateByes(teamCount)` | How many byes needed to fill the bracket |
| `isValidJoinCode(code)` | Validates alphanumeric join code format |
| `sanitizeTeamName(name)` | Trims, collapses whitespace, enforces max length |
| `generateJoinCode(length)` | Generates random alphanumeric code (excludes ambiguous chars like 0/O/1/I) |
| `isValidUuid(value)` | Validates UUID v4 format |

---

### `lib/utils/calculation.ts` — Duration & Match Calculation

| Function | Purpose |
|----------|---------|
| `calculateMatchCount(format, teamCount)` | Single elim: N−1 matches. Double elim: 2(N−1)+1 matches |
| `calculateRounds(format, teamCount)` | Number of rounds in the bracket |
| `calculateWaves(matchCount, stationCount)` | Concurrent match waves given station count |
| `calculateDuration(config)` | Full duration estimate returning `DurationEstimate` with `totalMinutes`, `waves`, `matchCount`, and `formattedDuration` |

---

## Work Order 6: Error Handling & Monitoring

### Purpose

Establish consistent error handling patterns across API routes, React components, and real-time subscriptions. Integrate Sentry for production error tracking with graceful fallback in development.

---

### `lib/monitoring/sentry.ts` — Sentry Integration

- **`initSentry()`** — Initializes Sentry SDK with DSN from `NEXT_PUBLIC_SENTRY_DSN` env var. Only enabled in production. Configures tracing and replay sample rates. Idempotent (safe to call multiple times).
- **`captureException(error, context?)`** — Reports an error to Sentry with optional extra context. Falls back to `console.error` in development.
- **`captureMessage(message, level?, context?)`** — Reports an informational message to Sentry. Falls back to `console.log` in development.
- **`setUser(user)`** — Sets the Sentry user context for associating errors with specific organizers.

Sentry is optional — if `NEXT_PUBLIC_SENTRY_DSN` is not set, all calls are no-ops (with dev console fallbacks). A placeholder was added to `.env`.

---

### `lib/errors/custom-errors.ts` — Custom Error Classes

All extend the base `AppError` class which carries `statusCode` and `code`:

| Error Class | HTTP Status | Code | Usage |
|-------------|-------------|------|-------|
| `ValidationError` | 400 | `VALIDATION_ERROR` | Invalid input with optional field-level errors |
| `NotFoundError` | 404 | `NOT_FOUND` | Resource not found (auto-generates message from resource name) |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| `ForbiddenError` | 403 | `FORBIDDEN` | Authenticated but insufficient permissions |
| `ConflictError` | 409 | `CONFLICT` | Duplicate resource or state conflict |

Usage example:
```typescript
throw new ValidationError('Invalid tournament config', {
  name: 'Name is too short',
  teamCount: 'Must be between 2 and 32',
});

throw new NotFoundError('Tournament', 'abc-123');
// → "Tournament with ID "abc-123" not found" (404)
```

---

### `lib/errors/format-api-error.ts` — Error Response Formatting

`formatApiError(error)` converts any error into a consistent API response body:

```typescript
{
  error: string;       // Human-readable message
  code?: string;       // Machine-readable error code
  fields?: Record<string, string>;  // Field-level validation errors
}
```

- `ValidationError` → includes `fields` map
- Other `AppError` subclasses → includes `code`
- Unknown errors in production → generic "Internal server error" (no leak)
- Unknown errors in development → actual error message for debugging

---

### `lib/errors/api-error-handler.ts` — API Route Error Handling

Two approaches for API routes:

**1. Wrapper pattern (recommended):**
```typescript
export const GET = withErrorHandler(async (request) => {
  const data = await fetchData();
  return NextResponse.json({ data });
});
```

**2. Standalone handler:**
```typescript
try {
  // ...
} catch (error) {
  return handleApiError(error);
}
```

Both:
- Map `AppError` subclasses to their HTTP status codes
- Default to 500 for unknown errors
- Report 5xx errors to Sentry (skips 4xx — those are expected)
- Return formatted error responses via `formatApiError()`

---

### `app/error.tsx` — App-Level Error Boundary

Next.js error boundary that catches unhandled errors in the app:

- Reports the error to Sentry via `captureException()`
- Shows a user-friendly "Something went wrong" page
- In development, displays the error message and stack trace in a scrollable `<pre>` block
- Provides "Try Again" (calls Next.js `reset()`) and "Go Home" buttons

---

### `components/ErrorBoundary.tsx` — Reusable Component Error Boundary

React class component for wrapping specific component subtrees:

```tsx
<ErrorBoundary>
  <BracketViewer tournamentId={id} />
</ErrorBoundary>

<ErrorBoundary fallback={<CustomFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

- Catches render errors in children, logs to Sentry
- Shows `ErrorMessage` component as default fallback, or a custom `fallback` prop
- Provides a "reset" mechanism to retry rendering
- In development, shows the actual error message; in production, shows a generic message
- Supports an `onError` callback for custom handling

---

### `components/ErrorMessage.tsx` — Error Alert Component

A styled alert component for displaying errors anywhere in the UI:

```tsx
<ErrorMessage
  title="Failed to load matches"
  message="Network connection lost. Please check your internet."
  onRetry={() => refetch()}
  onDismiss={() => clearError()}
/>
```

- Alert icon from lucide-react
- Destructive color scheme with subtle background
- Optional "Try Again" and "Dismiss" action buttons
- Accessible: uses `role="alert"` for screen readers

---

### `hooks/useErrorHandler.ts` — Client-Side Error Hook

```typescript
const { error, setError, clearError, handleError } = useErrorHandler();
```

- **`error`** — Current error message string (or null)
- **`setError(msg)`** — Set error manually
- **`clearError()`** — Clear the error state
- **`handleError(error)`** — Processes any error: captures to Sentry, extracts message, and updates state

Designed for use in Client Components that need to display error feedback from async operations.

---

## Work Order 7: Real-Time Subscriptions Infrastructure

### Purpose

Provide reusable React hooks that wrap Supabase Realtime subscriptions for live bracket updates, match results, reactions, and leaderboard changes. All hooks manage WebSocket connections, handle reconnection, and apply efficient delta updates.

---

### `lib/realtime/config.ts` — Configuration Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `RECONNECT_DELAY_MS` | 1000 | Base delay before first reconnect attempt |
| `MAX_RECONNECT_ATTEMPTS` | 10 | Maximum retries before giving up |
| `RECONNECT_BACKOFF_FACTOR` | 2 | Exponential multiplier per attempt |
| `MAX_RECONNECT_DELAY_MS` | 30000 | Cap on reconnect delay (30 seconds) |
| `HEARTBEAT_INTERVAL_MS` | 30000 | Heartbeat check interval |

Also exports the `ConnectionState` type: `'connecting' | 'connected' | 'disconnected' | 'reconnecting'`.

---

### `lib/realtime/connection.ts` — Connection Utilities

| Function | Purpose |
|----------|---------|
| `createRealtimeChannel(supabase, name, callbacks?)` | Creates a Supabase Realtime channel with connection state tracking |
| `subscribeToChanges(channel, options, callback)` | Subscribes to Postgres INSERT/UPDATE/DELETE on a specific table with optional filter |
| `getReconnectDelay(attempt)` | Calculates exponential backoff delay with random jitter to prevent thundering herd |

Reconnect delay progression example: 1s → 2s → 4s → 8s → 16s → 30s (capped).

---

### `lib/realtime/delta-updates.ts` — Efficient State Updates

Instead of refetching all data on every change, these functions apply surgical updates to existing state arrays:

**Match updates:**
| Function | Behavior |
|----------|----------|
| `applyMatchInsert(state, newMatch)` | Appends match (or updates if ID already exists) |
| `applyMatchUpdate(state, updatedMatch)` | Replaces the match with matching ID |
| `applyMatchDelete(state, matchId)` | Removes the match with matching ID |

**Reaction updates:**
| Function | Behavior |
|----------|----------|
| `applyReactionChange(counts, reaction, eventType)` | Increments/decrements the count for the reaction's emoji type |

**Prediction updates:**
| Function | Behavior |
|----------|----------|
| `applyPredictionUpdate(state, updated)` | Updates existing prediction or appends new one |
| `sortLeaderboard(predictions)` | Sorts by total_points desc, then correct_count desc |

---

### Realtime Hooks

All four hooks follow the same architecture:

1. **Initial fetch** — Load current data from Supabase on mount
2. **Subscribe** — Open a Realtime channel filtered to the specific entity
3. **Delta updates** — Apply changes to React state without full refetch
4. **Reconnection** — Exponential backoff on channel errors (up to 10 attempts)
5. **Cleanup** — Remove the channel on unmount

All hooks return:
- The data (matches, tournament, reactionCounts, or leaderboard)
- `isConnected` boolean
- `connectionState` for detailed status
- `error` string or null
- `refetch()` to manually reload data (where applicable)

---

### `hooks/useRealtimeBracket.ts`

```typescript
const { matches, isConnected, connectionState, error, refetch } =
  useRealtimeBracket(tournamentId);
```

Subscribes to all INSERT/UPDATE/DELETE on the `matches` table filtered by `tournament_id`. Applies delta updates for each event type. Returns sorted matches by round and match number.

---

### `hooks/useRealtimeTournament.ts`

```typescript
const { tournament, isConnected, connectionState, error, refetch } =
  useRealtimeTournament(tournamentId);
```

Subscribes to UPDATE events on a single tournament record. Replaces the tournament state on each update (e.g., state changes from "seeding" to "in-progress").

---

### `hooks/useRealtimeReactions.ts`

```typescript
const { reactionCounts, isConnected, connectionState, error } =
  useRealtimeReactions(matchId);
```

Subscribes to all changes on the `reactions` table filtered by `match_id`. Fetches initial counts by aggregating all reactions, then applies incremental count changes. Returns a `ReactionCounts` object mapping each emoji type to its count:

```typescript
{ fire: 12, heart: 5, trophy: 3, shocked: 8, sad: 1, clap: 15 }
```

---

### `hooks/useRealtimeLeaderboard.ts`

```typescript
const { leaderboard, isConnected, connectionState, error } =
  useRealtimeLeaderboard(tournamentId);
```

Subscribes to INSERT/UPDATE on `bracket_predictions` filtered by `tournament_id`. Maintains sorted leaderboard with rank assignments. Returns `LeaderboardEntry[]` with `rank`, `displayName`, `totalPoints`, and `correctCount`.

---

### `components/ConnectionStatus.tsx`

Visual indicator for real-time connection health:

```tsx
<ConnectionStatus state={connectionState} />
```

| State | Icon | Label | Color |
|-------|------|-------|-------|
| `connected` | Wifi | "Live" | Green |
| `connecting` | Spinner | "Connecting..." | Yellow |
| `reconnecting` | Spinner | "Reconnecting..." | Yellow |
| `disconnected` | WifiOff | "Offline" | Red |

Accessible via `role="status"` and `aria-label`.

---

## Dependencies Added

| Package | Version | Work Order | Purpose |
|---------|---------|------------|---------|
| `zod` | 4.3.6 | WO5 | Schema validation with TypeScript inference |
| `react-hook-form` | latest | WO5 | Form state management (installed with WO4, used by schemas) |
| `@hookform/resolvers` | latest | WO5 | Connects Zod to React Hook Form |
| `@sentry/nextjs` | latest | WO6 | Error tracking and performance monitoring |

---

## Modified Files

| File | Change |
|------|--------|
| `lib/supabase/client.ts` | Replaced `type Database = any` with import from `database.types.ts` |
| `lib/supabase/server.ts` | Replaced `type Database = any` with import from `database.types.ts` |
| `.env` | Added `NEXT_PUBLIC_SENTRY_DSN` placeholder |

---

## File Tree

```
bracket-app/
├── app/
│   └── error.tsx                          ← WO6: App-level error boundary
├── components/
│   ├── ConnectionStatus.tsx               ← WO7: Realtime connection indicator
│   ├── ErrorBoundary.tsx                  ← WO6: Reusable error boundary
│   └── ErrorMessage.tsx                   ← WO6: Error alert component
├── hooks/
│   ├── useErrorHandler.ts                 ← WO6: Client error state hook
│   ├── useRealtimeBracket.ts              ← WO7: Live match updates
│   ├── useRealtimeLeaderboard.ts          ← WO7: Live prediction leaderboard
│   ├── useRealtimeReactions.ts            ← WO7: Live reaction counts
│   └── useRealtimeTournament.ts           ← WO7: Live tournament state
├── lib/
│   ├── database.types.ts                  ← WO5: Full database type definitions
│   ├── errors/
│   │   ├── api-error-handler.ts           ← WO6: API route error wrapper
│   │   ├── custom-errors.ts              ← WO6: Domain error classes
│   │   └── format-api-error.ts           ← WO6: Error response formatting
│   ├── monitoring/
│   │   └── sentry.ts                     ← WO6: Sentry integration
│   ├── realtime/
│   │   ├── config.ts                     ← WO7: Reconnection constants
│   │   ├── connection.ts                 ← WO7: Channel & subscription helpers
│   │   └── delta-updates.ts             ← WO7: Efficient state update functions
│   ├── schemas/
│   │   ├── seeding.schema.ts             ← WO5: Seeding Zod schemas
│   │   └── tournament.schema.ts          ← WO5: Tournament Zod schemas
│   ├── supabase/
│   │   ├── client.ts                     ← MODIFIED: Uses Database type
│   │   └── server.ts                     ← MODIFIED: Uses Database type
│   ├── types/
│   │   ├── api.types.ts                  ← WO5: API request/response types
│   │   └── tournament.types.ts           ← WO5: Domain entity types
│   └── utils/
│       ├── calculation.ts                ← WO5: Duration & match calculations
│       ├── format.ts                     ← WO5: Formatting utilities
│       └── validation.ts                ← WO5: Validation helpers
└── .env                                  ← MODIFIED: Added Sentry DSN placeholder
```
