import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // % of transactions captured for performance tracing
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session replays — only on error in production
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,     // hide PII in replays
      blockAllMedia: false,
    }),
  ],

  // Only enable if DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  debug: false,
});
