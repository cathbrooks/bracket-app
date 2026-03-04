# Backend Infrastructure

Next.js API routes, Supabase clients, and configuration.

## Environment Variables

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client + Server | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only | Service role key (bypasses RLS) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Client + Server | App origin (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | Optional | Server | Direct PostgreSQL URL |

Copy `.env.example` to `.env.local` and fill in values from the Supabase dashboard.

## Supabase Clients

Three clients for different contexts:

### `lib/supabase/client.ts` — Browser Client

```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

- Uses `createBrowserClient` from `@supabase/ssr`
- For Client Components and client-side code
- Session stored in cookies

### `lib/supabase/server.ts` — Server Client (SSR)

```typescript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

- Uses `createServerClient` from `@supabase/ssr`
- For Server Components, API routes, Server Actions
- Reads/writes cookies via `next/headers` for session

### `lib/supabase/admin.ts` — Admin Client

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
const supabase = createAdminClient();
```

- Uses service role key
- Bypasses RLS — use for admin-only operations
- **Server-side only**

## Config

`lib/config.ts` exports a typed `config` object. It validates required env vars at startup and throws if any are missing. Use `config.supabase.url`, `config.supabase.anonKey`, etc.

## API Routes

### `GET /api/health`

Health check for monitoring and deployments.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-03T...",
  "version": "0.1.0",
  "database": "connected" | "degraded" | "unreachable"
}
```

## Middleware

`middleware.ts` runs on every request (except static files):

- Creates a Supabase server client with request/response cookies
- Calls `supabase.auth.getUser()` to refresh the session
- Keeps auth state in sync across server and client

## Vercel Deployment

`vercel.json` configures:

- Framework: Next.js
- CORS headers for API routes (for join code and other custom headers)

## Project Structure

```
lib/
  config.ts          # Env validation
  supabase/
    client.ts        # Browser client
    server.ts        # Server/SSR client
    admin.ts         # Admin client (service role)
app/
  api/
    health/
      route.ts       # Health check
middleware.ts        # Session refresh
vercel.json          # Deployment config
```
