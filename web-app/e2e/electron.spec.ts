/**
 * Electron (Windows desktop) UI integration tests.
 *
 * All tests share a single Electron app instance (launched once in beforeAll).
 * Must be wrapped in a describe block so beforeAll/afterAll are scoped correctly.
 *
 * Prerequisites:
 *   - npm run build  in web-app/   → dist/
 *   - npm run build  in backend/   → dist/bundle.cjs (or dist/index.js)
 */

import { test, expect, _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAIN_CJS = path.resolve(__dirname, "../electron/main.cjs");
const APP_DIR = path.resolve(__dirname, "..");

test.describe("Electron app", () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [MAIN_CJS],
      cwd: APP_DIR,
      env: {
        ...process.env,
        NODE_ENV: "test",
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        LUMO_USE_DIST: "1",
      },
    });

    // Electron main starts the backend then opens the window — allow up to 60 s
    page = await electronApp.firstWindow({ timeout: 60_000 });
    await page.waitForLoadState("domcontentloaded");

    // Get the backend port the Electron main process chose
    const backendPort = await page.evaluate(() =>
      (window as unknown as { electronAPI: { getApiPort: () => Promise<number> } }).electronAPI.getApiPort()
    );

    // Register a test user via the embedded backend
    const email = `electron-test-${Date.now()}@lumo.test`;
    const authData = await page.evaluate(
      async ({ email, port }: { email: string; port: number }) => {
        const r = await fetch(`http://127.0.0.1:${port}/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: "ElectronTest!23", name: "Electron Tester" }),
        });
        if (!r.ok) return null;
        return r.json() as Promise<{ token: string; user: object }>;
      },
      { email, port: backendPort }
    );

    if (!authData) throw new Error(`Registration failed — backend on port ${backendPort} did not return auth data`);

    // Inject auth + onboarding state, then reload into the shell
    await page.evaluate(
      ({ token, user }: { token: string; user: object }) => {
        localStorage.setItem(
          "lumo.app.v1",
          JSON.stringify({
            state: { locale: "en", accent: "green", density: "comfortable", reducedMotion: false, onboarded: true },
            version: 0,
          })
        );
        // Auth store (Zustand persist) only serializes "user" — token lives in a flat key
        localStorage.setItem(
          "lumo.auth.v1",
          JSON.stringify({ state: { user }, version: 0 })
        );
        localStorage.setItem("lumo.token", token);
      },
      { token: authData.token, user: authData.user }
    );

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Wait for the shell nav to appear
    await page.getByRole("link", { name: /today/i }).waitFor({ timeout: 30_000 });
  });

  test.afterAll(async () => {
    await electronApp.close().catch(() => {});
  });

  // ── Window basics ────────────────────────────────────────────────────────────

  test("app window opens with correct title", async () => {
    await expect(page).toHaveTitle(/lumo/i);
  });

  test("window is visible and not minimised", async () => {
    const isVisible = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win ? !win.isMinimized() && win.isVisible() : false;
    });
    expect(isVisible).toBe(true);
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  test("Today page renders without crash", async () => {
    await page.getByRole("link", { name: /today/i }).click();
    await expect(
      page.getByRole("heading", { name: /today/i })
        .or(page.getByText(/nothing planned/i).first())
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Matrix page renders quadrant layout", async () => {
    await page.getByRole("link", { name: /matrix/i }).click();
    await expect(
      page.getByText(/do first/i).or(page.getByText(/Q1/))
    ).toBeVisible({ timeout: 8_000 });
  });

  test("Focus page shows pomodoro timer", async () => {
    await page.evaluate(() => { window.location.hash = "/focus"; });
    await expect(page.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible({ timeout: 8_000 });
  });

  // ── Electron window controls ─────────────────────────────────────────────────

  test("window can be minimised and restored", async () => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.minimize();
    });
    await page.waitForTimeout(500);

    const minimised = await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.isMinimized() ?? false
    );
    expect(minimised).toBe(true);

    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.restore();
    });
    await page.waitForTimeout(500);

    const restored = await electronApp.evaluate(({ BrowserWindow }) =>
      !(BrowserWindow.getAllWindows()[0]?.isMinimized() ?? true)
    );
    expect(restored).toBe(true);
  });
});
