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
  /** Frontend origin to test against. */
  baseUrl: process.env.BASE_URL ?? "http://localhost:5173",

  /** Backend REST API base URL (without trailing slash). */
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:47291/v1",

  /** Credentials for the E2E test account. */
  testEmail: process.env.TEST_EMAIL ?? "e2e@lumo.test",
  testPassword: process.env.TEST_PASSWORD ?? "e2eTestPass2024!",

  /** Where globalSetup writes the browser storage state. */
  authFile: "tests/.auth/user.json",
} as const;
