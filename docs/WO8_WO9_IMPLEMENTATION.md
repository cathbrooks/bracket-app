# Work Orders 8 & 9: Tournament Creation

## Table of Contents

- [Work Order 8: Tournament Creation Wizard UI](#work-order-8-tournament-creation-wizard-ui)
- [Work Order 9: Tournament Creation Backend](#work-order-9-tournament-creation-backend)
- [Architecture Decisions](#architecture-decisions)
- [File Tree](#file-tree)

---

## Work Order 8: Tournament Creation Wizard UI

### Purpose

Build the multi-step tournament setup wizard that guides organizers through tournament configuration: basic info, format selection, team configuration, timing setup, and review. The wizard is the primary entry point for creating tournaments and is designed to complete in under 5 minutes with progressive validation and helpful defaults.

---

### `app/(organizer)/organizer/create/page.tsx` — Tournament Creation Page

Server Component at route `/organizer/create` (protected by the auth middleware). Renders a centered container with the page heading and the `TournamentSetupWizard` component. The `(organizer)` route group applies the organizer layout with the header nav.

---

### `components/tournaments/TournamentSetupWizard.tsx` — Wizard Orchestrator

The top-level `'use client'` component managing the entire creation flow:

- **State**: Tracks `currentStep` (0–4), a `WizardConfig` object accumulating all configuration, per-step validation status, submission state, and error display.
- **Configuration Object**: Maintains all fields across steps — name, gameType, format, grandFinalsReset, teamCount, teamNames array, stationCount, matchDurationMinutes, bufferTimeMinutes, and seedingMode.
- **Defaults**: 8 teams, single elimination, 1 station, 10-minute matches, 2-minute buffer, manual seeding.
- **Navigation**: `handleBack()` and `handleNext()` preserve entered data when moving between steps. The Next button is disabled when the current step's validation fails.
- **Submission**: `handleSubmit()` POSTs to `/api/tournaments` with the full configuration (combining match duration + buffer into `timePerMatchMinutes`). On success, redirects to `/organizer/tournament/{id}`.
- **Error Handling**: Submission errors are displayed in a destructive alert banner above the current step.

---

### `components/tournaments/StepIndicator.tsx` — Step Progress Bar

Visual progress indicator showing five labeled steps: Basic Info, Format, Teams, Timing, Review.

| Step State | Visual |
|------------|--------|
| Completed | Filled primary circle with checkmark icon |
| Current | Primary-bordered circle with step number |
| Upcoming | Muted-bordered circle with step number |

Connecting lines between steps change color based on completion. Step labels below each circle highlight the current step in the primary color.

---

### `components/tournaments/NavigationButtons.tsx` — Navigation Controls

Renders Back/Next/Submit buttons with contextual behavior:

- **Back**: Disabled on step 0 (first step).
- **Next**: Disabled when `isNextDisabled` is true (validation fails). Shows right arrow icon.
- **Submit**: Replaces Next on the final step. Shows loading spinner via the `loading` prop during submission.

---

### `components/tournaments/steps/BasicInfoStep.tsx` — Step 1: Basic Info

Captures tournament name and game type using React Hook Form with `zodResolver(basicInfoSchema)`:

- **Tournament Name**: Text input, 3–100 characters. Character count shown below the field. Inline validation error on blur.
- **Game Type**: Text input, 1–50 characters. Character count shown below the field.
- **Validation Mode**: `onChange` — validates as the user types, enabling/disabling the Next button in real time via `onValidChange` callback.
- **Data Persistence**: Calls `onChange` on every keystroke to update the parent wizard's config. Values survive navigation between steps.

---

### `components/tournaments/steps/FormatSelectionStep.tsx` — Step 2: Format

Two large selectable cards for format choice:

| Option | Icon | Description |
|--------|------|-------------|
| Single Elimination | Trophy | One loss and you're out. Fast-paced and straightforward. |
| Double Elimination | Swords | Teams must lose twice. More forgiving, takes roughly twice as long. |

- **Selection**: Cards use radio-button semantics with visual highlighting (primary border, background tint, colored icon).
- **Grand Finals Reset**: Conditionally shown when double elimination is selected. Toggle switch with description text. Defaults to enabled.
- **Validation**: Step is valid when a format is selected (always true after first click).

---

### `components/tournaments/steps/TeamConfigurationStep.tsx` — Step 3: Teams

- **Team Count**: Numeric input, range 2–32. Validation prevents values outside this range. Shows a specific message at 32+ explaining the platform limit.
- **Bye Notice**: When the team count is not a power of two, an info banner explains that the bracket will expand to the next power of two and how many teams receive first-round byes.
- **Team Names**: Dynamic array of text inputs matching the team count. Inputs regenerate when count changes while preserving existing names. Each input has a 50-character max and a "Team N" placeholder.
- **Duplicate Warning**: A yellow warning banner appears when duplicate names are detected (case-insensitive). Duplicates are permitted — the warning is non-blocking per the requirements.
- **Default Names**: Empty fields are filled with "Team 1", "Team 2", etc. on submission.

---

### `components/tournaments/steps/TimingConfigurationStep.tsx` — Step 4: Timing

- **Timing Tips**: Blue info banner with guidance — typical match 10–15 minutes, buffer 2–5 minutes, more stations = shorter tournament.
- **Match Duration**: Numeric input, 1–180 minutes per match.
- **Buffer Time**: Numeric input, 0–60 minutes between matches.
- **Station Count**: Numeric input, 1–16 stations.
- **Station Warning**: When station count exceeds half the team count, a yellow warning explains the maximum useful station count.
- **Validation**: All three fields must be within their ranges. Errors shown inline.

---

### `components/tournaments/steps/ReviewStep.tsx` — Step 5: Review

Displays a full summary of the configuration before submission:

- **Duration Estimate**: Prominent banner with clock icon showing the calculated tournament duration (e.g., "2h 30m"), match count, and wave count. Uses `calculateDuration()` from `lib/utils/calculation.ts`.
- **Summary Cards**: Four cards in a 2-column grid:

| Card | Fields Shown |
|------|-------------|
| Basic Info | Tournament name, game type |
| Format | Bracket type, Grand Finals Reset status (double elim only) |
| Teams | Team count, bracket size with byes, team name badges |
| Timing | Match duration, buffer time, station count |

- **Edit Buttons**: Each card has a pencil icon "Edit" button that navigates back to the corresponding step without losing data.

---

## Work Order 9: Tournament Creation Backend

### Purpose

Implement backend API endpoints for tournament CRUD operations including creation, retrieval, update, and deletion. Provides the server-side logic for tournament management including duration calculation, join code generation, team record creation, and RLS-enforced data access.

---

### `lib/services/tournaments/generateJoinCode.ts` — Join Code Generator

`generateUniqueJoinCode()` creates 6-character alphanumeric codes for spectator access:

- Uses `generateJoinCode()` from `lib/utils/validation.ts` which excludes ambiguous characters (0/O, 1/l/I) to avoid confusion.
- Checks uniqueness by querying the `tournaments` table for collisions.
- Retries up to 5 times on collision. Throws if all attempts fail.
- Returns an uppercase code like `"A3KT7V"`.

---

### `lib/services/tournaments/calculateDuration.ts` — Server-Side Duration Calculator

`calculateTournamentDuration(config)` mirrors the client-side `calculateDuration()` logic for persisting `estimated_duration_minutes` to the database:

| Parameter | Type | Default |
|-----------|------|---------|
| `format` | `TournamentFormat` | required |
| `teamCount` | `number` | required |
| `timePerMatchMinutes` | `number` | required |
| `stationCount` | `number` | 1 |

Returns a `DurationEstimate` with `totalMinutes`, `waves`, `matchCount`, and `formattedDuration`.

---

### `lib/services/tournaments/createTournament.ts` — Tournament Creation Service

`createTournament(userId, params)` orchestrates the full creation flow:

1. **Join Code**: Calls `generateUniqueJoinCode()` to get a unique spectator access code.
2. **Duration**: If `timePerMatchMinutes` is provided, calculates the estimated duration.
3. **Tournament Insert**: Inserts a tournament row in `draft` state with all configuration fields and the authenticated user as `owner_id`.
4. **Team Creation**: Creates team records for all teams. Uses provided `teamNames` where available, falling back to "Team 1", "Team 2", etc. for empty entries.
5. **Rollback**: If team creation fails, deletes the tournament row to avoid orphans.
6. **Returns**: `{ tournament: Tournament, teams: Team[] }` with domain-mapped objects.

---

### `lib/services/tournaments/updateTournament.ts` — Tournament Update Service

`updateTournament(userId, tournamentId, params)` handles partial updates with authorization:

1. **Ownership**: Calls `validateTournamentOwnership()` — throws `ForbiddenError` if the user doesn't own the tournament.
2. **Draft State**: Calls `validateDraftState()` — throws `ForbiddenError` if the tournament is not in draft state (unless transitioning state).
3. **Duration Recalculation**: When any timing-related field changes (format, teamCount, timePerMatchMinutes, stationCount), automatically recalculates and persists the new `estimated_duration_minutes`.
4. **Partial Update**: Only sends changed fields to the database. Returns the updated `Tournament` domain object.

---

### `lib/validation/tournament.validation.ts` — Authorization Helpers

| Function | Purpose | Throws |
|----------|---------|--------|
| `validateTournamentOwnership(userId, tournamentId)` | Fetches tournament, verifies `owner_id` matches | `NotFoundError`, `ForbiddenError` |
| `validateDraftState(tournament)` | Checks `state === 'draft'` | `ForbiddenError` |
| `validateTeamCount(count)` | Checks count is 2–32 | `ForbiddenError` |

These helpers are reused across all tournament API routes and services.

---

### `app/api/tournaments/route.ts` — `POST /api/tournaments`

Creates a new tournament with teams.

**Request Body** (validated with `tournamentConfigSchema` extended with optional `teamNames`):

```typescript
{
  name: string;           // 3–100 chars
  gameType: string;       // 1–50 chars
  format: "single-elimination" | "double-elimination";
  teamCount: number;      // 2–32
  stationCount?: number;  // 1–16, default 1
  timePerMatchMinutes?: number;  // 1–480
  seedingMode?: "manual" | "time-trial";
  teamNames?: string[];   // Optional array of team names
}
```

**Response** (201):
```typescript
{
  data: { tournament: Tournament, teams: Team[] },
  error: null
}
```

**Error Handling**: Auth required. Zod validation errors return 400 with field-level messages. All errors use `withErrorHandler` wrapper.

---

### `app/api/tournaments/[id]/route.ts` — Tournament CRUD

**`GET /api/tournaments/:id`**

Returns tournament with joined teams and matches. Auth required.

```typescript
{
  data: {
    tournament: {
      ...Tournament,
      teams: Team[],      // Ordered by created_at
      matches: Match[]    // Ordered by round, match_number
    }
  },
  error: null
}
```

**`PATCH /api/tournaments/:id`**

Updates tournament configuration. Auth required. Validates ownership and draft state. Accepts partial `UpdateTournamentInput`. Recalculates duration when timing fields change.

**`DELETE /api/tournaments/:id`**

Deletes a draft tournament and all related records (matches → teams → tournament). Auth required. Validates ownership and draft state.

---

### `app/api/tournaments/[id]/teams/route.ts` — `GET /api/tournaments/:id/teams`

Returns teams for a tournament, ordered by seed (nulls last) then `created_at`. Auth required. Validates tournament exists.

```typescript
{
  data: { teams: Team[] },
  error: null
}
```

---

## Architecture Decisions

### Wizard State Management

The wizard uses React `useState` with a single `WizardConfig` object rather than a form library for the top-level state. Each step component internally uses React Hook Form (with Zod) for field-level validation, then reports validity and values upward via callbacks. This allows:

- Independent per-step validation without coupling steps together
- Preserved data when navigating between steps (config object persists in parent)
- Simple submission logic (one object to serialize)

### Service Layer Pattern

Backend logic is organized into service functions (`createTournament`, `updateTournament`, etc.) separate from API routes. This provides:

- Reusable business logic (services can be called from Server Actions or other services)
- Testable units (services can be unit tested without HTTP)
- Thin API routes that only handle request parsing, auth, and response formatting

### Duration Calculation Consistency

The duration calculator exists in two locations:

| Location | Purpose |
|----------|---------|
| `lib/utils/calculation.ts` | Client-side — used in the ReviewStep for instant feedback |
| `lib/services/tournaments/calculateDuration.ts` | Server-side — used when persisting to the database |

Both use the same underlying `calculateMatchCount` and `calculateWaves` functions, ensuring the estimate shown in the wizard matches what's stored.

### Join Code Uniqueness

Join codes use a retry-based uniqueness check rather than a database unique constraint approach. With 6 characters from a 31-character alphabet (excluding ambiguous chars), there are ~887 million possible codes — collision probability is negligible for the expected tournament volume.

---

## File Tree

```
bracket-app/
├── app/
│   ├── (organizer)/
│   │   └── organizer/
│   │       └── create/
│   │           └── page.tsx                        ← WO8: Tournament creation page
│   └── api/
│       └── tournaments/
│           ├── route.ts                            ← WO9: POST /api/tournaments
│           └── [id]/
│               ├── route.ts                        ← WO9: GET/PATCH/DELETE
│               └── teams/
│                   └── route.ts                    ← WO9: GET teams
├── components/
│   └── tournaments/
│       ├── TournamentSetupWizard.tsx               ← WO8: Wizard orchestrator
│       ├── StepIndicator.tsx                       ← WO8: Step progress bar
│       ├── NavigationButtons.tsx                   ← WO8: Back/Next/Submit controls
│       └── steps/
│           ├── BasicInfoStep.tsx                   ← WO8: Name & game type
│           ├── FormatSelectionStep.tsx             ← WO8: Format selection + GFR toggle
│           ├── TeamConfigurationStep.tsx           ← WO8: Team count & names
│           ├── TimingConfigurationStep.tsx         ← WO8: Stations & timing
│           └── ReviewStep.tsx                      ← WO8: Configuration summary
└── lib/
    ├── services/
    │   └── tournaments/
    │       ├── calculateDuration.ts                ← WO9: Server-side duration calc
    │       ├── createTournament.ts                 ← WO9: Tournament creation service
    │       ├── generateJoinCode.ts                 ← WO9: Unique join code generator
    │       └── updateTournament.ts                 ← WO9: Tournament update service
    └── validation/
        └── tournament.validation.ts                ← WO9: Ownership & state validation
```
