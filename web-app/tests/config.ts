/**
 * Central config for the Playwright UI test suite.
 *
 * Every value can be overridden via environment variable so the same test
 * suite can run against localhost, a staging environment, or any deployed URL.
 *
 * Usage examples
 * ──────────────
 * # default (local dev stack)
 * npm run test:e2e
 *
 * # against a Vercel preview URL
 * BASE_URL=https://lumo-task-xyz.vercel.app \
 *   API_BASE_URL=https://lumo-task-backend.onrender.com/v1 \
 *   TEST_EMAIL=e2e@lumo.test TEST_PASSWORD=… \
 *   npm run test:e2e
 */

export const config = {
  /** Frontend origin to test against.
   *  Use || (not ??) so that an empty-string env var also falls back to the
   *  default — GitHub Actions sets env vars to '' when no value is supplied. */
  baseUrl: process.env.BASE_URL || "http://localhost:5173",

  /** Backend REST API base URL (without trailing slash). */
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:47291/v1",

  /** Credentials for the E2E test account.
   *  Defaults to the user that the backend seeds on every cold start
   *  (ensureDefaultUser in src/db/migrate.ts), so no registration is needed. */
  testEmail: process.env.TEST_EMAIL || "alex@stride.studio",
  testPassword: process.env.TEST_PASSWORD || "demo1234",

  /** Where globalSetup writes the browser storage state. */
  authFile: "tests/.auth/user.json",
} as const;
