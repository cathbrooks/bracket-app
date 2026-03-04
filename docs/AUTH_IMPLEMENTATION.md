# Work Order 4: Authentication & Authorization

## Overview

This document describes the full implementation of Supabase Auth integration for tournament organizer authentication, including email/password flows, session management, protected route middleware, and integration with Row Level Security.

---

## Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | latest | Performant form state management and validation |
| `zod` | latest | Schema-based form validation with TypeScript inference |
| `@hookform/resolvers` | latest | Connects Zod schemas to React Hook Form |

Installed via:
```
npm install react-hook-form zod @hookform/resolvers
```

---

## Files Created

### 1. `lib/auth/client.ts` — Client-Side Auth Helpers

Provides typed functions for use in Client Components:

- **`signUp(email, password)`** — Creates a new account via Supabase Auth. Returns the user object or an error.
- **`signIn(email, password)`** — Signs in with email/password credentials. Returns user + session or an error.
- **`signOut()`** — Ends the current session and clears auth cookies.
- **`getSession()`** — Retrieves the current session from the browser client (may be stale; prefer server-side `getUser()` for security).
- **`onAuthStateChange(callback)`** — Subscribes to auth state changes (sign in, sign out, token refresh). Returns a subscription object for cleanup.

All functions use the existing `createClient()` from `lib/supabase/client.ts`.

---

### 2. `lib/auth/server.ts` — Server-Side Auth Helpers

Provides typed functions for use in Server Components, Route Handlers, and Server Actions:

- **`getSession()`** — Retrieves the current session using cookie-based auth. Uses the server Supabase client.
- **`getUser()`** — Retrieves the authenticated user by validating the JWT with Supabase (more secure than `getSession()` since it hits the auth server).
- **`requireAuth()`** — Calls `getUser()` and redirects to `/login` if no user is found. Returns the validated `User` object. Use this as a guard at the top of any Server Component or Route Handler that requires authentication.

All functions use the existing `createClient()` from `lib/supabase/server.ts`.

---

### 3. `components/auth/LoginForm.tsx` — Login Form Component

A `'use client'` component implementing the sign-in form:

- **Validation**: Uses React Hook Form with a Zod schema requiring a valid email and non-empty password.
- **Submission**: Calls `signIn()` from `lib/auth/client.ts`. On success, redirects to the organizer dashboard. On failure, displays the error message from Supabase.
- **UX**: Submit button shows a loading spinner during submission via the `loading` prop on the Button component. Server errors display in a styled alert above the form. Field-level errors appear inline below each input.

---

### 4. `components/auth/SignupForm.tsx` — Signup Form Component

A `'use client'` component implementing the registration form:

- **Validation**: Zod schema enforces:
  - Valid email format
  - Password minimum 8 characters
  - At least one uppercase letter, one lowercase letter, and one number
  - Password confirmation must match
- **Submission**: Calls `signUp()` from `lib/auth/client.ts`. On success, displays an email confirmation notice. On failure, displays the Supabase error.
- **Success State**: After successful signup, the form is replaced with a message instructing the user to check their email for a confirmation link, plus a button to navigate back to sign in.

---

### 5. `components/auth/AuthGuard.tsx` — Client-Side Route Protection

A `'use client'` wrapper component for protecting organizer pages at the client level:

- **Auth Check**: On mount, calls `supabase.auth.getUser()`. If no user, redirects to the login page (or a custom `fallbackUrl`).
- **Real-Time Listener**: Subscribes to `onAuthStateChange` to detect session expiry or sign-out, redirecting immediately.
- **Loading State**: Renders a centered spinner while the auth check is in progress.
- **Cleanup**: Unsubscribes from the auth listener on unmount to prevent memory leaks.

Usage:
```tsx
<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

---

### 6. `components/auth/SignOutButton.tsx` — Sign Out Button

A `'use client'` component that calls `signOut()` and redirects to `/login`. Renders as a ghost-variant button. Added to the organizer layout header nav.

---

### 7. `app/(auth)/layout.tsx` — Auth Layout (Server Component)

The layout wrapping the `/login` and `/signup` pages:

- **Already-Authenticated Redirect**: Calls `getUser()` from `lib/auth/server.ts`. If a user is already authenticated, redirects to the organizer dashboard — preventing authenticated users from seeing login/signup pages.
- **UI**: Renders a vertically and horizontally centered container with the BracketApp branding and a max-width constraint for the form card.

---

### 8. `app/(auth)/login/page.tsx` — Login Page

- Wraps `LoginForm` inside a `Card` component with a header ("Welcome back") and description.
- Footer contains a link to the signup page.
- Sets page metadata for SEO (`title: "Sign In | Bracket App"`).

---

### 9. `app/(auth)/signup/page.tsx` — Signup Page

- Wraps `SignupForm` inside a `Card` component with a header ("Create an account") and description.
- Footer contains a link to the login page.
- Sets page metadata for SEO (`title: "Sign Up | Bracket App"`).

---

### 10. `app/api/auth/callback/route.ts` — Auth Callback Route

Handles the redirect from Supabase after email confirmation:

- Extracts the `code` query parameter from the callback URL.
- Exchanges the code for a session using `supabase.auth.exchangeCodeForSession()`.
- On success, redirects to the organizer dashboard (or a custom `next` URL if provided).
- On failure, redirects to `/login?error=auth_callback_error`.
- Handles `x-forwarded-host` for production deployments behind proxies.

---

## Files Modified

### 11. `middleware.ts` — Auth Middleware

**Before**: Only refreshed the Supabase session on each request (no redirects).

**After**: Added route protection logic:

- **Protected Routes** (`/organizer/*`): If the user is not authenticated, they are redirected to `/login` with a `next` query parameter preserving their intended destination.
- **Auth Routes** (`/login`, `/signup`): If the user is already authenticated, they are redirected to `/organizer/dashboard` to prevent re-authentication.
- **Session Refresh**: Still calls `supabase.auth.getUser()` on every request to keep sessions alive (existing behavior preserved).

Route classification uses prefix matching:
```
PROTECTED_ROUTES = ['/organizer']
AUTH_ROUTES = ['/login', '/signup']
```

---

### 12. `lib/constants.ts` — Route Constants

Added auth route constants:
```typescript
auth: {
  login: "/login",
  signup: "/signup",
  callback: "/api/auth/callback",
}
```

These sit alongside the existing `organizer` and `spectator` route groups.

---

### 13. `app/(organizer)/layout.tsx` — Organizer Layout

Added the `SignOutButton` component to the organizer header navigation, appearing after the "New Tournament" link. This gives authenticated organizers a way to sign out from any organizer page.

---

## Architecture Decisions

### Server-Side vs Client-Side Auth Checks

The implementation uses a **layered approach**:

1. **Middleware** (server-side, runs first): Handles the primary redirect logic for protected routes. This runs before any page renders, so unauthenticated users never see organizer page content.
2. **Auth Layout** (server-side): Prevents authenticated users from seeing login/signup pages via server-side redirect.
3. **AuthGuard** (client-side, optional): Available as an additional layer for Client Components that need real-time auth state awareness (e.g., detecting session expiry without a page reload).

### Session Management

Sessions are managed entirely by Supabase Auth with cookie-based persistence:

- The middleware refreshes sessions on every request via `getUser()`.
- Cookies are set/read through the `@supabase/ssr` helpers.
- No server-side session storage is needed (stateless, per the backend blueprint).

### Password Validation

The signup form enforces password strength rules client-side via Zod:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Supabase Auth also enforces its own server-side password requirements as a second layer.

### Spectator Access

Spectator routes (`/spectator/*`) are intentionally **not** protected by authentication. Spectators access tournaments via join codes, enforced by RLS policies at the database level — not by application-layer auth.

---

## File Tree

```
bracket-app/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              ← NEW: Auth layout with redirect logic
│   │   ├── login/
│   │   │   └── page.tsx            ← NEW: Login page
│   │   └── signup/
│   │       └── page.tsx            ← NEW: Signup page
│   ├── (organizer)/
│   │   └── layout.tsx              ← MODIFIED: Added SignOutButton
│   └── api/
│       └── auth/
│           └── callback/
│               └── route.ts        ← NEW: Email confirmation callback
├── components/
│   └── auth/
│       ├── AuthGuard.tsx           ← NEW: Client-side route protection
│       ├── LoginForm.tsx           ← NEW: Login form with validation
│       ├── SignOutButton.tsx       ← NEW: Sign out button
│       └── SignupForm.tsx          ← NEW: Signup form with validation
├── lib/
│   ├── auth/
│   │   ├── client.ts              ← NEW: Client-side auth helpers
│   │   └── server.ts              ← NEW: Server-side auth helpers
│   └── constants.ts               ← MODIFIED: Added auth routes
└── middleware.ts                   ← MODIFIED: Added auth redirects
```
