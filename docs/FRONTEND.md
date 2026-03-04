# Frontend Infrastructure

Next.js App Router, Tailwind CSS, and shadcn/ui components.

## Tech Stack

- **Next.js 15** App Router
- **React 19** Server Components by default
- **Tailwind CSS** for styling
- **shadcn/ui** (Radix UI primitives)
- **Lucide React** for icons

## Project Structure

```
app/
  layout.tsx              # Root layout (Inter font, metadata)
  page.tsx                # Landing page
  globals.css              # Tailwind + CSS variables
  (organizer)/
    layout.tsx            # Organizer layout (auth area)
  (spectator)/
    layout.tsx            # Spectator layout (viewing area)
components/
  ui/                     # shadcn/ui primitives
    button.tsx
    input.tsx
    label.tsx
    card.tsx
    badge.tsx
    dialog.tsx
    select.tsx
    form.tsx
lib/
  utils.ts                # cn(), formatTime(), formatDuration()
  constants.ts            # Typed constants, ROUTES
```

## Layouts

### Root (`app/layout.tsx`)
- Inter font
- Metadata (title, description)
- Wraps all routes

### Organizer (`app/(organizer)/layout.tsx`)
- For tournament creation and management
- Auth-protected (to be wired)
- Header with branding

### Spectator (`app/(spectator)/layout.tsx`)
- For viewing brackets
- Minimal chrome
- No auth required (join code only)

## UI Components (shadcn/ui)

| Component | Purpose |
|-----------|---------|
| `Button` | Variants: default, destructive, outline, secondary, ghost, link. Sizes: sm, md, lg, icon. Loading state. |
| `Input` | Text input with focus, disabled, error states |
| `Label` | Form labels with peer-disabled styling |
| `Card` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `Badge` | Variants: default, secondary, destructive, outline |
| `Dialog` | Modal with overlay, close button, portal |
| `Select` | Dropdown with keyboard nav |
| `Form` | FormItem, FormLabel, FormDescription, FormMessage |

All use `cn()` from `lib/utils` for class merging.

## Utilities

### `lib/utils.ts`

| Function | Description |
|----------|-------------|
| `cn(...inputs)` | Merge Tailwind classes (clsx + tailwind-merge) |
| `formatTime(seconds)` | `MM:SS.ss` for time trials |
| `formatDuration(minutes)` | Human-readable (e.g. `2h 30m`) |
| `generateJoinCode()` | 6-char alphanumeric join code |

### `lib/constants.ts`

Typed constants for the app:

- **Formats:** `TOURNAMENT_FORMATS`, `SEEDING_MODES`
- **States:** `MATCH_STATES`, `TOURNAMENT_STATES`, `BRACKET_CATEGORIES`
- **Engagement:** `EMOJI_TYPES`
- **Limits:** `MIN_TEAM_COUNT`, `MAX_TEAM_COUNT`, `MAX_TEAM_NAME_LENGTH`, etc.
- **Routes:** `ROUTES.organizer.*`, `ROUTES.spectator.*`

## Theming

`app/globals.css` defines CSS variables for light and dark themes:

- `--background`, `--foreground`
- `--card`, `--popover`
- `--primary`, `--primary-foreground`
- `--secondary`, `--muted`, `--accent`
- `--destructive`
- `--border`, `--input`, `--ring`
- `--radius`

`tailwind.config.ts` wires these into Tailwind utilities (`bg-background`, `text-foreground`, etc.) and enables `tailwindcss-animate`.
