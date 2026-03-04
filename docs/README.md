# Bracket App — Documentation

Technical documentation for the Bracket App tournament management system.

## Overview

Bracket App is built on Next.js 15 with Supabase. Organizers create and manage tournaments; spectators view brackets in real time via a join code. The app uses Row Level Security (RLS) for database-level access control and Supabase Realtime for live updates.

### Architecture Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js App Router, React 19, Tailwind, shadcn/ui | SSR pages, forms, bracket UI |
| Backend | Next.js API routes, Supabase JS client | Auth, data access, RPC calls |
| Database | PostgreSQL (Supabase) | Tournaments, teams, matches, RLS policies |
| Realtime | Supabase Realtime | Live bracket updates for spectators |

### Route Groups

- **`(organizer)`** — Auth-required layout for tournament creation and management
- **`(spectator)`** — Minimal layout for viewing brackets (join code only, no auth)

## Docs

| Document | Description |
|----------|-------------|
| [DATABASE.md](./DATABASE.md) | Schema, migrations, tables, RLS, RPC functions |
| [BACKEND.md](./BACKEND.md) | Supabase clients, config, API routes, middleware |
| [FRONTEND.md](./FRONTEND.md) | Components, layouts, styling, constants |
| [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) | WO4: Authentication & authorization |
| [WO5_WO6_WO7_IMPLEMENTATION.md](./WO5_WO6_WO7_IMPLEMENTATION.md) | WO5–7: Types, error handling, realtime |
| [WO8_WO9_IMPLEMENTATION.md](./WO8_WO9_IMPLEMENTATION.md) | WO8–9: Tournament creation wizard & backend |
| [WO10_WO11_WO12_IMPLEMENTATION.md](./WO10_WO11_WO12_IMPLEMENTATION.md) | WO10–12: Team management, seeding, time trials |
| [WO13_WO14_WO15_IMPLEMENTATION.md](./WO13_WO14_WO15_IMPLEMENTATION.md) | WO13–15: Bracket visualization, spectator access, engagement |
