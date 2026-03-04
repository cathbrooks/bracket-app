# Work Orders 13, 14, 15: Bracket Visualization, Spectator Access & Engagement

## Table of Contents

- [Work Order 13: Bracket Visualization Core](#work-order-13-bracket-visualization-core)
- [Work Order 14: Spectator Access & Real-Time Updates](#work-order-14-spectator-access--real-time-updates)
- [Work Order 15: Engagement Features](#work-order-15-engagement-features)
- [Dependencies Added](#dependencies-added)
- [Architecture Decisions](#architecture-decisions)
- [File Tree](#file-tree)

---

## Work Order 13: Bracket Visualization Core

### Purpose

Implement the core bracket visualization components including a traditional bracket tree view for desktop/tablet, a match list view for mobile, responsive layout switching, and match cards with state-driven visual indicators. This provides the visual bracket interface that displays tournament structure and match progression for both organizers and spectators.

---

### `lib/utils/match-state.ts` — Match State Utilities

Centralizes match state determination and CSS class mapping:

| Export | Purpose |
|--------|---------|
| `MatchDisplayState` | Type: `'pending' \| 'in-progress' \| 'completed' \| 'bye'` |
| `getMatchDisplayState(match)` | Determines display state (checks `isBye` first, then `match.state`) |
| `getMatchStateStyles(state)` | Returns CSS class strings for card, border, winner text, loser text |
| `getMatchStateLabel(state)` | Human-readable label (e.g., `'in-progress'` → `'Live'`) |

**State styling rules:**

| State | Card | Border | Winner | Loser | Label |
|-------|------|--------|--------|-------|-------|
| Pending | `bg-card` | Default border | Normal text | Normal text | "Upcoming" |
| In Progress | `bg-card` + primary ring | Primary border | Normal text | Normal text | "Live" |
| Completed | `bg-card` | Default border | Bold text | Muted + strikethrough | "Completed" |
| Bye | Muted background | Dashed border | Italic muted text | Very muted text | "Bye" |

This ensures accessibility by using opacity, font weight, and strikethrough in addition to color for state differentiation.

---

### `lib/utils/bracket-layout.ts` — Layout Utilities

Provides grouping and positioning logic for bracket tree rendering:

| Export | Purpose |
|--------|---------|
| `groupByRound(matches)` | Groups matches by `round` number, returns `RoundGroup[]` |
| `groupByBracketCategory(matches)` | Groups by `bracket_category` (winners, losers, grand-finals), returns `CategoryGroup[]` |
| `getRoundName(round, totalRounds, matchCount)` | Auto-names rounds: "Finals", "Semifinals", "Quarterfinals", or "Round N" |
| `calculateMatchPositions(rounds)` | Computes `{x, y, width, height}` for each match in tree layout |

**Layout constants:**

| Constant | Value | Purpose |
|----------|-------|---------|
| `MATCH_WIDTH` | 220px | Card width in tree view |
| `MATCH_HEIGHT` | 72px | Card height in tree view |
| `ROUND_GAP` | 60px | Horizontal gap between rounds |

The positioning algorithm distributes matches evenly within each round, using the first round's count to determine total height, then centering subsequent rounds within that space.

---

### `components/bracket/MatchCard.tsx` — Match Card

The core UI element for displaying a single match:

- **State Badge**: Shows "Live" badge for in-progress matches, "Bye" badge for byes.
- **Match Number**: Displays "M1", "M2", etc. in the top-left corner.
- **Team Rows**: Two team rows separated by a divider line. Each row shows:
  - Optional seed number (left-aligned, muted)
  - Team name (truncated for long names)
  - Winner "W" indicator (green, right-aligned) for the winning team
- **Winner/Loser Styling**: Winner gets bold text; loser gets muted text with strikethrough. Applied via `getMatchStateStyles()`.
- **Interactive**: Accepts `onClick` prop for match selection. When clickable, adds hover shadow and `cursor-pointer`.
- **Compact Mode**: `compact` prop reduces padding for tree view usage.
- **Composable**: Accepts `children` for rendering additional content (e.g., reaction bars) below the team rows.

Props: `match`, `teamA?`, `teamB?`, `compact?`, `onClick?`, `children?`.

---

### `components/bracket/BracketConnectors.tsx` — SVG Connection Lines

Renders SVG paths connecting matches in the tree view:

- Draws a cubic Bézier curve from each match's right edge to its `winnerNextMatchId`'s left edge.
- Uses the midpoint between source and target for smooth curves (`C` command).
- Styled with `text-border` color and 1.5px stroke width.
- Absolutely positioned over the bracket container with `pointer-events-none`.

Props: `matches`, `positions` (Map from `calculateMatchPositions`).

---

### `components/bracket/BracketTreeView.tsx` — Desktop Bracket Tree

Traditional bracket tree visualization for desktop and tablet:

- **Single Elimination**: Renders one bracket section with all rounds laid out horizontally.
- **Double Elimination**: Renders separate sections for Winners Bracket, Losers Bracket, and Grand Finals using `groupByBracketCategory()`. Each section has its own heading and layout.
- **Positioning**: Uses `calculateMatchPositions()` to absolutely position each `MatchCard` in the bracket. Round names appear above each column.
- **Scrolling**: The bracket container supports horizontal scrolling for large brackets.
- **Connectors**: `BracketConnectors` renders advancement lines over the positioned cards.

Props: `tournament`, `matches`, `teams`, `onMatchClick?`.

---

### `components/bracket/MatchListView.tsx` — Mobile Match List

Mobile-optimized vertical scrollable list:

- **Single Elimination**: Groups matches by round using `groupByRound()`. Each round has a section header.
- **Double Elimination**: Groups by bracket category first (Winners/Losers/Grand Finals), then by round within each category.
- **Layout**: `MatchCard` components stacked vertically with 2px gaps between matches and 4px gaps between rounds.

Props: `tournament`, `matches`, `teams`, `onMatchClick?`.

---

### `components/bracket/BracketView.tsx` — Responsive Layout Router

Top-level bracket component that switches between views based on viewport width:

- **Detection**: Uses `useState` + `window.addEventListener('resize')` to track viewport width.
- **Breakpoint**: 768px — below renders `MatchListView`, at or above renders `BracketTreeView`.
- **Loading State**: Shows a spinner while detecting viewport width on initial render (avoids hydration mismatch).
- **Empty State**: Shows "No matches generated yet." when the matches array is empty.

Props: `tournament`, `matches`, `teams`, `onMatchClick?`.

---

## Work Order 14: Spectator Access & Real-Time Updates

### Purpose

Implement frictionless spectator access via join codes and QR codes, real-time bracket synchronization using the existing Supabase Realtime hooks, match timing tooltips, and the full spectator viewing experience requiring no authentication.

---

### `lib/utils/match-timing.ts` — Match Timing Utilities

Provides human-readable timing text for match tooltips:

| Function | Returns | Example Output |
|----------|---------|----------------|
| `getMatchTimingText(match)` | `string` | `"Started 12 minutes ago"`, `"Ready to play"` |
| `getMatchTimingDetails(match)` | `{ primary, secondary? }` | `{ primary: "Completed 1 hour ago", secondary: "Started 2 hours ago" }` |

**State-based output:**

| Match State | Primary Text | Secondary Text |
|-------------|-------------|----------------|
| Completed | "Completed {relative time}" | "Started {relative time}" |
| In Progress | "Started {relative time}" | — |
| Pending (both teams) | "Ready to play" | — |
| Pending (missing teams) | "Waiting for previous matches" | — |
| Bye | "Bye — automatic advancement" | — |

Uses `formatRelativeTime()` from `lib/utils/format.ts` for relative timestamps.

---

### `lib/realtime/apply-bracket-updates.ts` — Delta Update Utilities

| Function | Purpose |
|----------|---------|
| `applyBracketMatchUpdate(currentMatches, updatedMatch)` | Replaces a match in the array by ID, or appends if new. Returns new array. |
| `findDownstreamMatchIds(matchId, matches)` | BFS traversal following `winnerNextMatchId` and `loserNextMatchId` chains. Returns all downstream match IDs. |

These utilities support efficient state updates when matches change in real time, avoiding full data refetches.

---

### `app/api/view/[joinCode]/route.ts` — `GET /api/view/:joinCode`

Public spectator endpoint — no authentication required.

- Queries `tournaments` table with case-insensitive join code match (`.ilike()`).
- Loads associated teams (ordered by seed, then created_at) and matches (ordered by round, match_number).
- Returns the tournament with nested teams and matches arrays, all converted to domain types.
- Returns 404 with `NotFoundError` for invalid join codes.

**Response:**
```typescript
{
  data: {
    tournament: {
      ...Tournament,
      teams: Team[],
      matches: Match[]
    }
  },
  error: null
}
```

---

### `components/bracket/MatchTooltip.tsx` — Match Timing Tooltip

Hover (desktop) and tap (mobile) tooltip for contextual match information:

- **Trigger**: Wraps any child element. Shows tooltip on `mouseEnter`/`touchStart`.
- **Content**: Match state badge (e.g., "Live", "Completed") and timing details from `getMatchTimingDetails()`.
- **Positioning**: Centered above the trigger element with a CSS arrow pointing down.
- **Animation**: Uses `animate-in fade-in-0 zoom-in-95` for smooth appearance.
- **Accessibility**: `role="tooltip"` on the popover element.

Props: `match`, `children`.

---

### `hooks/useBracketData.ts` — Combined Data + Realtime Hook

`useBracketData({ tournamentId?, joinCode? })` provides a unified interface for loading bracket data:

1. **Initial Fetch**: Calls `/api/view/:joinCode` (for spectators) or `/api/tournaments/:id` (for organizers).
2. **Realtime Integration**: Passes the resolved tournament ID to `useRealtimeBracket()` for live match updates.
3. **Type Conversion**: Converts `MatchRow[]` from the realtime hook to domain `Match[]` via `toMatch()`.
4. **Fallback**: Uses initial matches until the realtime subscription provides data.

**Returns:** `{ tournament, matches, teams, isLoading, error, connectionState, refetch }`.

---

### `components/organizer/QRCodeDisplay.tsx` — QR Code Card

Generates and displays a QR code for spectator access:

- **QR Code**: Uses `QRCodeSVG` from `qrcode.react` with the full spectator URL (`/spectator/view/:joinCode`).
- **Join Code Display**: Large tracking-widest monospace text.
- **URL Field**: Read-only input showing the full URL with a copy button (clipboard API with checkmark confirmation).
- **Download**: Serializes the SVG element and creates a Blob download with the tournament name as filename.
- **Print**: Opens a popup window with the QR code, tournament name, and join code for printing.

Props: `joinCode`, `tournamentName`.

---

### `app/(spectator)/spectator/view/page.tsx` — Join Code Entry Page

Route: `/spectator/view`

- Simple centered card with a join code input field.
- Input auto-uppercases as the user types.
- Validates format using `isValidJoinCode()` before navigation.
- Monospace tracking-widest styling on the input for readability.
- On submit, redirects to `/spectator/view/:joinCode`.

---

### `app/(spectator)/spectator/view/[joinCode]/page.tsx` — Spectator Bracket Page

Route: `/spectator/view/:joinCode`

- Extracts `joinCode` from route params using React 19's `use()`.
- Loads data via `useBracketData({ joinCode })`.
- Shows loading spinner, error state (tournament not found), or the full bracket.
- Displays tournament name, game type, and `ConnectionStatus` indicator in the header.
- Renders `BracketView` for the responsive bracket visualization.
- **No authentication required** — fully public page.

---

## Work Order 15: Engagement Features

### Purpose

Transform passive bracket viewing into interactive participation with emoji reactions on matches, a full bracket prediction challenge with weighted scoring, real-time leaderboards, and a dual celebration screen for tournament and prediction winners.

---

### `lib/rate-limiting/reaction-limiter.ts` — Reaction Rate Limiter

In-memory rate limiter with no external dependencies:

- **Cooldown**: 2-second minimum between reactions per (sessionId, matchId) pair.
- **Storage**: `Map<string, number>` keyed by `"sessionId:matchId"`, storing the last reaction timestamp.
- **Cleanup**: Runs every 60 seconds to remove entries older than 20 seconds.
- **API**: `checkReactionRateLimit(sessionId, matchId)` returns `true` if allowed, `false` if rate-limited. Also records the new timestamp when allowed.

---

### `app/api/tournaments/[id]/matches/[matchId]/reactions/route.ts` — `POST .../reactions`

Reaction submission endpoint:

**Request Body:**
```typescript
{
  emojiType: "fire" | "heart" | "trophy" | "shocked" | "sad" | "clap",
  sessionId: string
}
```

**Flow:**
1. Validates `sessionId` is present and `emojiType` is a valid emoji.
2. Checks the rate limiter (2-second cooldown).
3. Verifies the match exists in the tournament.
4. **Upserts** the reaction using `(match_id, session_id)` unique constraint — allows changing reaction.
5. Queries all reactions for the match and aggregates counts by emoji type.

**Response:**
```typescript
{
  data: { reactionCounts: { fire: 12, heart: 5, trophy: 3, ... } },
  error: null
}
```

---

### `hooks/useReactions.ts` — Reaction State Hook

`useReactions(matchId)` manages reaction state for a match:

- **Session Management**: Creates and persists a random UUID in `sessionStorage` as the anonymous spectator identity.
- **Realtime**: Integrates `useRealtimeReactions(matchId)` for live count updates from other spectators.
- **Optimistic Updates**: Sets `currentReaction` immediately on click, reverts on API failure.
- **Submission**: Calls `POST .../reactions` with the session ID and emoji type.

**Returns:** `{ counts, currentReaction, submitReaction, isLoading, connectionState }`.

---

### `components/bracket/ReactionBar.tsx` — Emoji Reaction Interface

Horizontal row of emoji buttons for match reactions:

| Emoji Type | Display |
|------------|---------|
| `fire` | 🔥 |
| `heart` | ❤️ |
| `trophy` | 🏆 |
| `shocked` | 😱 |
| `sad` | 😢 |
| `clap` | 👏 |

- **Selected State**: Current user's reaction gets primary border and background tint.
- **Counts**: Aggregate count displayed next to each emoji (hidden when zero).
- **Accessible**: Each button has `aria-label` and `aria-pressed` attributes.
- **Disabled State**: Reduces opacity and prevents clicks when `disabled` is true.

Props: `counts`, `currentReaction`, `onReact`, `disabled?`.

---

### `lib/services/predictions/scorePredictions.ts` — Prediction Scoring Service

`scorePredictionsForMatch(tournamentId, matchId, winnerTeamId, round)` scores all predictions when a match completes:

**Point System (exponential weighting):**

| Round | Points for Correct Prediction |
|-------|-------------------------------|
| Round 1 | 1 point |
| Round 2 | 2 points |
| Round 3 | 4 points |
| Round 4 | 8 points |
| Finals | 2^(N-1) points |

**Flow:**
1. Queries all `prediction_scores` for the match.
2. For each prediction, compares `predicted_winner_team_id` to the actual winner.
3. Updates `points_earned` and `actual_winner_team_id` on each score record.
4. For correct predictions, re-aggregates `total_points` and `correct_count` on the parent `bracket_predictions` record.

---

### `app/api/tournaments/[id]/predictions/route.ts` — `POST .../predictions`

Bracket prediction submission endpoint:

**Request Body:**
```typescript
{
  displayName?: string,    // Max 30 chars, optional
  predictions: Record<string, string>,  // matchId → predicted winnerTeamId
  sessionId: string
}
```

**Validation:**
1. Session ID is required.
2. Predictions object must be non-empty.
3. Tournament must exist.
4. **Lock check**: If any match in the tournament is `completed`, predictions are locked — returns error.
5. **Duplicate check**: If the session has already submitted, returns `409 Conflict`.

**Side Effects:**
- Inserts a `bracket_predictions` record with the display name (or auto-generated "Predictor #NNN").
- Inserts one `prediction_scores` record per match with the predicted winner.

**Response (201):**
```typescript
{
  data: { predictionId: string },
  error: null
}
```

---

### `app/api/tournaments/[id]/predictions/leaderboard/route.ts` — `GET .../leaderboard`

Prediction leaderboard endpoint:

- Queries all `bracket_predictions` for the tournament, ordered by `total_points` desc then `correct_count` desc.
- Counts non-bye matches for accuracy calculation.
- Assigns sequential ranks starting from 1.

**Response:**
```typescript
{
  data: {
    leaderboard: [
      {
        rank: number,
        displayName: string,
        totalPoints: number,
        correctCount: number,
        accuracy: number,       // Percentage (0-100)
        sessionId: string       // For "You" indicator
      }
    ]
  },
  error: null
}
```

---

### `components/predictions/BracketPredictionForm.tsx` — Prediction Submission Form

Full bracket prediction interface:

- **Match Groups**: Organizes playable (non-bye) matches by round using `groupByRound()`.
- **Pick Interface**: Each match shows two team buttons side-by-side. Clicking a button selects that team as the predicted winner. Selected picks get primary border and tint.
- **Progress**: Badge shows "{N}/{total} picks" count. Submit button disabled until all matches have predictions.
- **Display Name**: Optional text input (max 30 chars) for leaderboard identity.
- **Submission**: POSTs to `/api/tournaments/:id/predictions` with session ID from `sessionStorage`.
- **Error Handling**: Displays API errors (locked predictions, duplicate submissions) in a destructive alert.

Props: `tournament`, `matches`, `teams`, `onSubmitted`.

---

### `components/predictions/PredictionLeaderboard.tsx` — Leaderboard Display

Real-time prediction leaderboard:

- **Columns**: Rank, Display Name, Points, Correct, Accuracy (%).
- **Medal Colors**: Rank 1 (gold), 2 (silver), 3 (bronze) with colored text.
- **Current User**: Rows matching `currentSessionId` get highlighted background and a "You" badge.
- **Auto-Refresh**: Polls the leaderboard API every 15 seconds for near-real-time updates.
- **Empty State**: Shows "No predictions submitted yet." when no entries exist.

Props: `tournamentId`, `currentSessionId?`.

---

### `components/bracket/AggregatePredictionCounts.tsx` — Crowd Sentiment

Displays how many spectators predicted each team to win a match:

```
Team Alpha: 23    predictions    Team Beta: 15
```

- Fetches prediction data from the leaderboard endpoint on mount.
- Aggregates counts per team for the specific match.
- Hidden when no predictions exist (total count is zero).

Props: `matchId`, `tournamentId`, `teamA?`, `teamB?`.

---

### `components/predictions/CelebrationScreen.tsx` — Dual Celebration

Post-tournament celebration display with two cards:

**Tournament Champion Card:**
- Gold-themed gradient background with Trophy icon.
- Shows tournament name and winning team name in large bold text.

**Bracket Challenge Winner Card (optional):**
- Purple-themed gradient background with Medal icon.
- Shows the prediction winner's display name, total points, and correct prediction count.
- Only rendered when `predictionWinner` prop is provided.

Props: `tournamentName`, `winnerTeamName`, `predictionWinner?`.

---

## Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `qrcode.react` | ^4 | Client-side QR code generation for spectator access URLs |

---

## Architecture Decisions

### Responsive Bracket Strategy

Rather than rendering a single complex layout and applying CSS breakpoints, the bracket uses two completely different component trees (`BracketTreeView` and `MatchListView`) selected by JavaScript viewport detection. This approach avoids rendering unnecessary DOM elements on mobile and provides each layout full control over its rendering strategy.

### Match Positioning Algorithm

The tree view uses absolute positioning rather than CSS Grid or Flexbox. Each match's `{x, y}` coordinates are calculated based on its round index and position within the round. This allows the SVG connector lines to reference exact pixel coordinates for their Bézier curves. The first round's match count determines the total bracket height, and subsequent rounds are evenly distributed within that space.

### Spectator Join Code Architecture

Spectator access is entirely unauthenticated. The `/api/view/:joinCode` endpoint uses the Supabase server client which respects RLS policies allowing anyone to SELECT from tournaments. Join codes are matched case-insensitively using Supabase's `.ilike()` to prevent user frustration. The spectator page route group `(spectator)` applies a minimal layout without organizer nav.

### Reaction Rate Limiting

Reactions use an in-memory `Map` rather than Redis or a database-backed rate limiter. This is appropriate for the expected scale (local tournaments with dozens of spectators, not thousands). The 2-second cooldown prevents spam while allowing enthusiastic reactions. The upsert pattern means each spectator has at most one reaction per match, changeable but not stackable.

### Prediction Locking

Predictions lock based on match state rather than a manual toggle. When any match in the tournament reaches `completed` state, the prediction endpoint rejects new submissions. This eliminates the need for a separate "lock predictions" action and ensures fairness — predictions must be submitted before any results are known.

### Scoring System

The exponential point system (1, 2, 4, 8...) rewards correctly predicting later rounds more heavily. A correct Finals prediction is worth 8x a correct Round 1 prediction. This matches the intuition that later-round predictions are harder and more impressive. Scores are aggregated on-demand rather than via database triggers, keeping the scoring logic in the application layer where it's easier to test and modify.

---

## File Tree

```
bracket-app/
├── app/
│   ├── (spectator)/
│   │   └── spectator/
│   │       └── view/
│   │           ├── page.tsx                                ← WO14: Join code entry page
│   │           └── [joinCode]/
│   │               └── page.tsx                            ← WO14: Live bracket page
│   └── api/
│       ├── view/
│       │   └── [joinCode]/
│       │       └── route.ts                                ← WO14: GET spectator data
│       └── tournaments/
│           └── [id]/
│               ├── matches/
│               │   └── [matchId]/
│               │       └── reactions/
│               │           └── route.ts                    ← WO15: POST reactions
│               └── predictions/
│                   ├── route.ts                            ← WO15: POST predictions
│                   └── leaderboard/
│                       └── route.ts                        ← WO15: GET leaderboard
├── components/
│   ├── bracket/
│   │   ├── BracketView.tsx                                 ← WO13: Responsive layout router
│   │   ├── BracketTreeView.tsx                             ← WO13: Desktop tree view
│   │   ├── MatchListView.tsx                               ← WO13: Mobile list view
│   │   ├── MatchCard.tsx                                   ← WO13: Match display card
│   │   ├── BracketConnectors.tsx                           ← WO13: SVG advancement lines
│   │   ├── MatchTooltip.tsx                                ← WO14: Timing tooltip
│   │   ├── ReactionBar.tsx                                 ← WO15: Emoji reaction buttons
│   │   └── AggregatePredictionCounts.tsx                   ← WO15: Crowd sentiment display
│   ├── organizer/
│   │   └── QRCodeDisplay.tsx                               ← WO14: QR code card
│   └── predictions/
│       ├── BracketPredictionForm.tsx                       ← WO15: Prediction submission form
│       ├── PredictionLeaderboard.tsx                       ← WO15: Ranked leaderboard
│       └── CelebrationScreen.tsx                           ← WO15: Post-tournament celebration
├── hooks/
│   ├── useBracketData.ts                                   ← WO14: Data + realtime hook
│   └── useReactions.ts                                     ← WO15: Reaction state hook
└── lib/
    ├── rate-limiting/
    │   └── reaction-limiter.ts                             ← WO15: In-memory rate limiter
    ├── realtime/
    │   └── apply-bracket-updates.ts                        ← WO14: Delta update utilities
    ├── services/
    │   └── predictions/
    │       └── scorePredictions.ts                         ← WO15: Weighted scoring service
    └── utils/
        ├── bracket-layout.ts                               ← WO13: Grouping & positioning
        ├── match-state.ts                                  ← WO13: State styles & labels
        └── match-timing.ts                                 ← WO14: Timing text helpers
```
