/**
 * Playwright configuration.
 *
 * The test suite runs against any environment — local dev stack or any
 * deployed URL — by setting environment variables:
 *
 *   BASE_URL      Frontend origin (default: http://localhost:5173)
 *   API_BASE_URL  Backend API base  (default: http://localhost:47291/v1)
 *   TEST_EMAIL    E2E account email (default: e2e@lumo.test)
 *   TEST_PASSWORD E2E account password
 *
 * When BASE_URL points at localhost, the config automatically starts the
 * Vite dev server. For remote URLs the webServer block is omitted — the
 * suite tests the live deployment as-is.
 */

import { defineConfig, devices } from "@playwright/test";
import { config } from "./tests/config";

const isLocalhost =
  config.baseUrl.includes("localhost") ||
  config.baseUrl.includes("127.0.0.1");

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",

  // Run tests sequentially — avoids race conditions when the backend's
  // SQLite DB is shared between parallel test runners.
  fullyParallel: false,
  workers: 1,

  retries: process.env.CI ? 1 : 0,

  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["list"],
  ],

  use: {
    baseURL: config.baseUrl,

    // Every test starts with the pre-authenticated session captured by
    // globalSetup. Onboarding / auth tests override this with an empty state.
    storageState: config.authFile,

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Only start the Vite dev server when testing localhost.
  // Remote deployments are already live — no server management needed.
  ...(isLocalhost
    ? {
        webServer: {
          command: "npm run dev",
          url: config.baseUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }
    : {}),

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
