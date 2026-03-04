import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initSentry() {
  if (initialized || !SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  initialized = true;
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry]', error, context);
  }
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
) {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, { level, extra: context });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Sentry:${level}]`, message, context);
  }
}

export function setUser(user: { id: string; email?: string } | null) {
  Sentry.setUser(user);
}
