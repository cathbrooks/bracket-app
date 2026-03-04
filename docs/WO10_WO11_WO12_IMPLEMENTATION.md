# Work Orders 10, 11, 12: Team Management, Seeding & Time Trials

## Table of Contents

- [Work Order 10: Team Management](#work-order-10-team-management)
- [Work Order 11: Seeding Workflows & Manual Seeding](#work-order-11-seeding-workflows--manual-seeding)
- [Work Order 12: Time Trial System](#work-order-12-time-trial-system)
- [Architecture Decisions](#architecture-decisions)
- [File Tree](#file-tree)

---

## Work Order 10: Team Management

### Purpose

Implement team name entry, validation, and default name generation logic across frontend and backend. Ensures teams are properly created with tournaments, names are validated for length constraints, duplicates are handled gracefully (non-blocking warnings), and default naming conventions are applied when names are omitted.

---

### `lib/utils/team-names.ts` — Team Name Utilities

| Function | Signature | Purpose |
|----------|-----------|---------|
| `generateDefaultTeamNames(count)` | `(number) → string[]` | Returns `["Team 1", "Team 2", ...]` for the given count |
| `sanitizeTeamName(name)` | `(string) → string` | Trims whitespace, collapses internal spaces, enforces 50-char max |
| `findDuplicateIndices(names)` | `(string[]) → number[]` | Returns sorted indices of all duplicate entries (case-insensitive) |
| `findDuplicateNames(names)` | `(string[]) → string[]` | Returns deduplicated array of duplicate name strings |
| `applyDefaultNames(names, count)` | `(string[], number) → string[]` | Fills empty entries with "Team N" defaults, preserving user-provided names |

Duplicate detection is case-insensitive: "Team Alpha" and "team alpha" are treated as duplicates.

---

### `lib/validation/team-names.validation.ts` — Team Name Schemas

| Schema | Rules |
|--------|-------|
| `teamNameSchema` | String, max 50 characters, auto-trimmed via `.transform()` |
| `teamNamesArraySchema` | Array of `teamNameSchema`, minimum 2 entries |

These schemas are used for server-side validation of team name arrays during tournament creation and team updates.

---

### `components/tournaments/TeamNameInput.tsx` — Reusable Team Name Input

A single team name input field with validation feedback:

- **Character Count**: Displays `N/50` below the input aligned right.
- **Duplicate Warning**: When `isDuplicate` is true, the input border turns yellow and an `AlertTriangle` icon appears inside the input. A "Duplicate name" label appears below.
- **Error Display**: When `error` is provided, the border turns destructive red and the error message appears below.
- **Placeholder**: Shows "Team N" based on the `index` prop.

Props: `index`, `value`, `onChange`, `isDuplicate?`, `error?`.

---

### `components/tournaments/TeamList.tsx` — Dynamic Team Name List

Renders an array of `TeamNameInput` components with list-level duplicate detection:

- **Duplicate Detection**: Calls `findDuplicateIndices()` on the full names array. Passes `isDuplicate` to each affected `TeamNameInput`.
- **Warning Banner**: When any duplicates exist, shows a yellow alert with "Duplicate names detected. You can still proceed, but consider using unique names."
- **Layout**: Two-column grid on larger screens, single column on mobile.
- **Header**: Shows team count and "Leave blank for default names" hint.

---

### `lib/services/teams/createTeams.ts` — Team Creation Service

`createTeams(tournamentId, teamNames, count)` creates team records for a tournament:

1. Calls `applyDefaultNames()` to fill empty entries with "Team N" defaults.
2. Calls `sanitizeTeamName()` on each name (trim, collapse whitespace, enforce max length).
3. Bulk-inserts all team records in a single Supabase `.insert()` call.
4. **Entry Order Preservation**: Teams are inserted in array order, which determines `created_at` ordering used for random seeding tie-breaking.
5. Returns the created `Team[]` domain objects.

---

## Work Order 11: Seeding Workflows & Manual Seeding

### Purpose

Implement the seeding workflow router and manual seeding interface including mode-based routing, cryptographic random shuffle, and manual seed assignment UI with uniqueness validation. Provides the Random and Manual seeding modes used after tournament creation.

---

### `lib/services/seeding/shuffleTeams.ts` — Random Shuffle Service

`shuffleTeams(teams)` implements a Fisher-Yates shuffle using `crypto.getRandomValues()` for cryptographically unbiased randomness:

- Uses `Uint32Array` for random number generation (avoids `Math.random()` bias).
- Returns a new array without modifying the original.
- Each team appears exactly once in the output.

Used for Random seeding mode where bracket placement should be unbiased.

---

### `lib/services/seeding/assignManualSeeds.ts` — Manual Seed Assignment Service

`assignManualSeeds(tournamentId, assignments)` persists manual seed values with full validation:

**Validation checks (in order):**

1. Fetches all existing teams for the tournament.
2. Verifies the number of assignments matches the team count.
3. Verifies every `teamId` in the assignments exists in the tournament.
4. Verifies all seed numbers are unique.
5. Verifies seeds are sequential from 1 to N (no gaps or out-of-range values).

**On validation failure**: Throws `ValidationError` with a descriptive message.

**On success**: Updates each team's `seed` column individually and returns the sorted `Team[]` (sorted by seed ascending).

---

### `app/api/tournaments/[id]/seeds/route.ts` — `PATCH /api/tournaments/:id/seeds`

Manual seed assignment endpoint.

**Prerequisites**: Auth required. Tournament must be owned by the user, in draft state, and configured for manual seeding mode.

**Request Body** (validated with `manualSeedListSchema` from `seeding.schema.ts`):

```typescript
{
  seeds: [
    { teamId: "uuid-1", seed: 1 },
    { teamId: "uuid-2", seed: 2 },
    // ... one entry per team
  ]
}
```

**Validation**: Zod schema enforces UUID format for team IDs, integer seeds >= 1, minimum 2 entries, and seed uniqueness.

**Response**:
```typescript
{
  data: { teams: Team[] },  // Sorted by seed
  error: null
}
```

---

### `components/seeding/SeedingWorkflow.tsx` — Seeding Mode Router

`'use client'` component that loads the tournament and routes to the appropriate seeding interface:

1. **Data Fetch**: Loads tournament and teams from `GET /api/tournaments/:id` on mount.
2. **Loading State**: Shows a centered spinner while fetching.
3. **Error State**: Shows destructive alert if the fetch fails.
4. **Routing Logic**:

| `seedingMode` | Component Rendered |
|---------------|--------------------|
| `"time-trial"` | `TimeTrialInterface` |
| `"manual"` | `ManualSeedingInterface` |

Props: `tournamentId`, `onComplete` callback (called when seeding is finished).

---

### `components/seeding/ManualSeedingInterface.tsx` — Manual Seeding UI

Full manual seed assignment interface with real-time validation:

- **Team List**: Displays all teams with their names and a numeric seed input (1 to N).
- **Seed Inputs**: Each input is a small centered number field. Valid entries show a green checkmark. Duplicate seeds show a red alert icon.
- **Real-Time Validation**:
  - Duplicate seeds are highlighted and listed in an error message.
  - Missing seeds prompt "All teams must have a seed assigned."
  - The Confirm button is disabled until all seeds are unique, sequential, and complete.
- **Submission**: Calls `PATCH /api/tournaments/:id/seeds` with the full seed array. On success, calls `onComplete`.
- **Error Display**: API errors shown in a destructive alert banner.

---

## Work Order 12: Time Trial System

### Purpose

Implement the comprehensive Time Trial seeding system including multi-station stopwatches with centisecond precision, manual time entry for fallback recording, leaderboard generation with automatic seed assignment, and tie resolution using team entry order.

---

### `hooks/useStopwatch.ts` — Stopwatch Hook

`useStopwatch()` provides reusable stopwatch logic for any component:

**Return value:**

| Property | Type | Description |
|----------|------|-------------|
| `centiseconds` | `number` | Current elapsed time in centiseconds |
| `isRunning` | `boolean` | Whether the stopwatch is currently ticking |
| `lapTimes` | `number[]` | Array of recorded lap times (centiseconds) |
| `finalTime` | `number \| null` | Time when stopped (null while running or before start) |
| `start()` | `function` | Begin timing from current position |
| `stop()` | `function` | Halt timing, set `finalTime` |
| `lap()` | `function` | Record current time without stopping |
| `reset()` | `function` | Clear all state to zero |

**Implementation details:**
- Uses `Date.now()` for elapsed time calculation (avoids setInterval drift).
- 10ms interval for UI updates (centisecond precision display).
- Maintains an `accumulatedRef` for pause/resume accuracy.
- Cleans up the interval on unmount via `useEffect` return.

---

### `components/seeding/Stopwatch.tsx` — Station Stopwatch

Per-station stopwatch card with Apple-style timing controls:

**States and controls:**

| Stopwatch State | Available Actions |
|----------------|-------------------|
| Idle (not started) | **Start** button |
| Running | **Stop** button (destructive), **Lap** button |
| Stopped with time | **Assign** button (triggers `onTimeRecorded`), **Reset** button |

- **Display**: Large monospaced MM:SS.ss time display using `formatTime()`.
- **Lap Times**: When laps are recorded, a bordered section below shows each lap time with its number.
- **Station Label**: Card header shows "Station N".
- **Disabled State**: When `disabled` is true (e.g., during team assignment), the Start button is disabled.

Props: `stationNumber`, `onTimeRecorded(centiseconds)`, `disabled?`.

---

### `components/seeding/ManualTimeEntry.tsx` — Fallback Time Entry

Form for manually entering times from external timers or correcting mistakes:

- **Team Selector**: Dropdown listing unrecorded teams first, then recorded teams with "(replace time)" suffix for editing.
- **Time Inputs**: Three separate numeric fields for minutes (0+), seconds (0–59), and centiseconds (0–99).
- **Validation**: Seconds must be 0–59, centiseconds must be 0–99, total time must be greater than zero. Errors shown inline.
- **Conversion**: Converts minutes/seconds/centiseconds to total centiseconds on submit.
- **Reset**: Clears all fields after successful submission.

Props: `teams`, `recordedTeamIds` (Set), `onTimeSubmitted(teamId, centiseconds)`.

---

### `components/seeding/TimeTrialLeaderboard.tsx` — Leaderboard Display

Ranked results table shown after all times are recorded:

- **Columns**: Rank, Team Name, Time (MM:SS.ss), Assigned Seed.
- **Medal Colors**: Rank 1 (gold), Rank 2 (silver), Rank 3 (bronze) use colored text.
- **Tie Indicator**: Teams with identical times show an "outline" Badge labeled "Tied".
- **Actions**: "Edit Times" button returns to the timing phase. "Confirm Seeds" button finalizes.
- **Loading State**: Confirm button shows spinner during submission.

Props: `entries[]`, `onConfirm()`, `onEdit()`, `isSubmitting?`.

---

### `components/seeding/TimeTrialInterface.tsx` — Time Trial Orchestrator

The main `'use client'` component managing the full time trial workflow across two phases:

**Phase 1: Timing**

1. **Stopwatch Grid**: Renders one `Stopwatch` component per station in a responsive grid (1/2/3 columns).
2. **Team Assignment Flow**: When a stopwatch's Assign button is clicked, a highlighted card appears showing the recorded time and buttons for each unrecorded team. Selecting a team calls `PATCH /api/tournaments/:id/teams/:teamId/time` to persist the result.
3. **Manual Entry**: `ManualTimeEntry` form below the stopwatch grid for entering times from external timers.
4. **Progress Badge**: Shows "N/M recorded" count. Turns green with a checkmark when all teams have times.
5. **Recorded Times Summary**: Card showing all recorded times sorted by fastest, with team names and formatted times.
6. **Generate Leaderboard**: Button enabled only when all teams have recorded times. Calls `POST /api/tournaments/:id/leaderboard`.

**Phase 2: Leaderboard**

Renders `TimeTrialLeaderboard` with the generated results. "Edit Times" returns to Phase 1. "Confirm Seeds" calls `onComplete`.

---

### `app/api/tournaments/[id]/teams/[teamId]/time/route.ts` — `PATCH /api/tournaments/:id/teams/:teamId/time`

Records a time trial result for a single team.

**Prerequisites**: Auth required. Tournament must be owned by the user, in draft state, and configured for time-trial seeding mode. Team must exist in the tournament.

**Request Body**:
```typescript
{
  timeSeconds: number  // Positive, max 86400 (24 hours)
}
```

Validated with `timeTrialTimeSchema` from `seeding.schema.ts`.

**Response**:
```typescript
{
  data: { team: Team },  // Updated team with time_trial_result_seconds
  error: null
}
```

Supports overwriting — calling again for the same team replaces the previous time.

---

### `app/api/tournaments/[id]/leaderboard/route.ts` — `POST /api/tournaments/:id/leaderboard`

Generates the leaderboard from all recorded time trial results and assigns seeds.

**Prerequisites**: Auth required. Tournament must be owned by the user, in draft state, and configured for time-trial seeding mode.

**Validation**: All teams must have a recorded `time_trial_result_seconds`. If any team is missing a time, returns an error listing the team names.

**Response**:
```typescript
{
  data: {
    leaderboard: [
      {
        teamId: string,
        name: string,
        seed: number,            // 1 = fastest
        timeCentiseconds: number,
        isTied: boolean          // true if another team has the same time
      }
    ]
  },
  error: null
}
```

**Side effect**: Updates the `seed` column on every team record in the database.

---

### `lib/services/seeding/generateLeaderboard.ts` — Leaderboard Generation Service

`generateLeaderboard(tournamentId)` handles the full leaderboard computation:

1. **Fetch**: Queries all teams for the tournament ordered by `created_at` (entry order).
2. **Validate**: Checks every team has a `time_trial_result_seconds`. Throws `ValidationError` listing missing teams if any are found.
3. **Sort**: Primary sort by `time_trial_result_seconds` ascending (fastest first). Tie-breaking by `created_at` ascending (earlier entered team gets better seed).
4. **Seed Assignment**: Assigns sequential seeds 1 through N.
5. **Tie Detection**: Marks entries as `isTied: true` when another team shares the same time.
6. **Persist**: Updates every team's `seed` column in the database.
7. **Returns**: Sorted `LeaderboardEntry[]` with team info, assigned seed, time in centiseconds, and tie flag.

---

## Architecture Decisions

### Team Name Handling Strategy

Team names use a **permissive** approach: duplicates generate warnings but never block progression. This matches real-world tournament scenarios where teams might intentionally share names (e.g., "Team A" in different pools). The `sanitizeTeamName()` function normalizes whitespace but doesn't enforce uniqueness.

### Seeding Mode Routing

The `SeedingWorkflow` component acts as a thin router rather than a complex state machine. It fetches the tournament once, checks `seedingMode`, and delegates to the appropriate child component. Each seeding interface (`ManualSeedingInterface`, `TimeTrialInterface`) is self-contained with its own API calls and validation.

### Stopwatch Precision

The stopwatch hook uses `Date.now()` difference for elapsed time rather than counting intervals. This avoids timer drift that accumulates with `setInterval` — a 10ms interval might fire at 12ms or 15ms, but `Date.now()` always gives the true elapsed time. The 10ms interval only controls UI refresh rate.

### Time Trial Two-Phase Design

The time trial interface uses a clear two-phase approach (Timing → Leaderboard) rather than showing the leaderboard incrementally. This prevents confusion from partial rankings and ensures all times are recorded before seeds are assigned. The "Edit Times" button on the leaderboard allows returning to Phase 1 if corrections are needed.

### Tie Resolution

Tied times are resolved deterministically using `created_at` (team entry order). The team entered first during tournament creation receives the better seed. This is documented visually with "Tied" badges on the leaderboard so organizers understand why seeds differ for identical times.

### Centisecond Storage

Times are stored in the database as `time_trial_result_seconds` (a `NUMERIC` column) in seconds, but the frontend works in centiseconds for display precision. Conversion happens at the API boundary: centiseconds ÷ 100 on write, seconds × 100 on read.

---

## File Tree

```
bracket-app/
├── app/
│   └── api/
│       └── tournaments/
│           └── [id]/
│               ├── seeds/
│               │   └── route.ts                        ← WO11: PATCH seed assignments
│               ├── leaderboard/
│               │   └── route.ts                        ← WO12: POST generate leaderboard
│               └── teams/
│                   └── [teamId]/
│                       └── time/
│                           └── route.ts                ← WO12: PATCH record time
├── components/
│   ├── seeding/
│   │   ├── SeedingWorkflow.tsx                         ← WO11: Seeding mode router
│   │   ├── ManualSeedingInterface.tsx                  ← WO11: Manual seed assignment UI
│   │   ├── Stopwatch.tsx                               ← WO12: Per-station stopwatch
│   │   ├── ManualTimeEntry.tsx                         ← WO12: Fallback time entry form
│   │   ├── TimeTrialLeaderboard.tsx                    ← WO12: Ranked results display
│   │   └── TimeTrialInterface.tsx                      ← WO12: Time trial orchestrator
│   └── tournaments/
│       ├── TeamNameInput.tsx                           ← WO10: Reusable name input
│       └── TeamList.tsx                                ← WO10: Dynamic team name list
├── hooks/
│   └── useStopwatch.ts                                ← WO12: Stopwatch state hook
└── lib/
    ├── services/
    │   ├── seeding/
    │   │   ├── assignManualSeeds.ts                    ← WO11: Manual seed service
    │   │   ├── generateLeaderboard.ts                  ← WO12: Leaderboard generation
    │   │   └── shuffleTeams.ts                         ← WO11: Crypto random shuffle
    │   └── teams/
    │       └── createTeams.ts                          ← WO10: Bulk team creation
    ├── utils/
    │   └── team-names.ts                              ← WO10: Name utilities
    └── validation/
        └── team-names.validation.ts                   ← WO10: Name Zod schemas
```
