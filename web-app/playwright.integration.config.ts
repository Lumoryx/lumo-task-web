/**
 * Playwright config for real-backend integration tests.
 *
 * Starts two servers before the suite:
 *   1. Hono backend  →  http://localhost:47292   (LUMO_PORT=47292)
 *   2. Vite dev      →  http://localhost:5174    (VITE_API_BASE → backend)
 *
 * Tests in e2e/real-backend.spec.ts hit the real API; no mocking.
 *
 * The DB path is injected by the calling script (LUMO_DB_PATH env var) so
 * it works on both Windows (%TEMP%) and Unix (/tmp).
 */

import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = "http://localhost:47292";
const FRONTEND_URL = "http://localhost:5174";
const BACKEND_DIR = path.resolve(__dirname, "../backend");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "real-backend.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-integration", open: "never" }],
  ],
  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // Backend: real Hono server with real SQLite
      command: `node --env-file src/test/.env.web-integration --import tsx/esm src/index.ts`,
      cwd: BACKEND_DIR,
      url: `${BACKEND_URL}/health`,
      timeout: 30_000,
      reuseExistingServer: false,
      env: {
        LUMO_DB_PATH: process.env.LUMO_DB_PATH ?? (
          process.platform === "win32"
            ? `${process.env.TEMP ?? "C:\\Windows\\Temp"}\\lumo-web-integration.db`
            : "/tmp/lumo-web-integration.db"
        ),
      },
    },
    {
      // Frontend: Vite dev pointed at test backend
      command: `npm run dev -- --port 5174`,
      url: FRONTEND_URL,
      timeout: 60_000,
      reuseExistingServer: false,
      env: {
        VITE_API_BASE: `${BACKEND_URL}/v1`,
        BROWSER: "none",
      },
    },
  ],
});
