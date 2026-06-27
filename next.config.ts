import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // HTTP cache headers for API responses
  async headers() {
    return [
      {
        // /api/profiles/me is authenticated user data — must never be publicly cached
        source: "/api/profiles/me",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, no-store" },
        ],
      },
      {
        // Other public profile pages — short CDN cache is fine (no PII exposed)
        source: "/api/profiles/:id",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=30" },
        ],
      },
      {
        // Match results are personalised — browser only, 5 min
        source: "/api/matches",
        headers: [
          { key: "Cache-Control", value: "private, max-age=300, stale-while-revalidate=60" },
        ],
      },
      {
        // Search results — short browser cache, CDN-cacheable (query-key'd)
        source: "/api/search",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=120, stale-while-revalidate=30" },
        ],
      },
      {
        // Static uploads (photos) — long cache
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

// Only wrap with Sentry when DSN is configured, to avoid build warnings in dev
const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  // Don't block the build if Sentry source map upload fails
  errorHandler: (err: Error) => {
    console.warn("[Sentry] Build warning:", err.message);
  },
};

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
