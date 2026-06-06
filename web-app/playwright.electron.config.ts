/**
 * Playwright config for Windows/Electron UI integration tests.
 *
 * Requires a production build to be present (npm run build in web-app and
 * npm run build in backend) before running.  The calling script handles this.
 *
 * Uses Playwright's _electron helper to launch the Electron main process
 * directly — no browser connection needed.
 */

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "electron.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-electron", open: "never" }],
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  // No webServer block — Electron manages its own window
});
