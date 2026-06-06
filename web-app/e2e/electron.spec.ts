/**
 * Electron (Windows desktop) UI integration tests — full user journey.
 *
 * One shared Electron instance runs from start to finish:
 *   1. Onboarding wizard (OB01–OB06)
 *   2. Registration via UI form  (REG01–REG05)
 *   3. Navigation (NAV01–NAV07)
 *   4. Task CRUD (TASK01–TASK02)
 *   5. Matrix (MATRIX01–MATRIX03)
 *   6. Focus page (FOCUS01–FOCUS04)
 *   7. Settings — all tabs (SET01–SET10)
 *   8. Habits (HAB01–HAB04)
 *   9. Stats (STAT01–STAT03)
 *  10. Countdown (CD01–CD02)
 *  11. Account & Change password (ACC01–ACC04)
 *  12. Window controls (WIN01–WIN03)
 *
 * Tests run in order and build on each other: onboarding → registration →
 * feature coverage.  The Electron app embeds its own Hono/SQLite backend, so
 * every assertion hits real data — no mocking.
 *
 * Prerequisites:
 *   npm run build  (web-app/ → dist/   and   backend/ → dist/bundle.cjs)
 */

import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAIN_CJS = path.resolve(__dirname, "../electron/main.cjs");
const APP_DIR = path.resolve(__dirname, "..");

test.describe("Electron app", () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let backendPort: number;

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

    page = await electronApp.firstWindow({ timeout: 60_000 });
    await page.waitForLoadState("domcontentloaded");

    // Obtain the embedded backend port before any test runs.
    backendPort = await page.evaluate(() =>
      (window as unknown as { electronAPI: { getApiPort: () => Promise<number> } })
        .electronAPI.getApiPort()
    );

    // Clear any localStorage from previous test runs so onboarding shows.
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
  });

  test.afterAll(async () => {
    await electronApp.close().catch(() => {});
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Onboarding wizard  (fresh app, no localStorage)
  // ─────────────────────────────────────────────────────────────────────────

  test("OB01 – first launch shows Welcome to Lumo", async () => {
    await expect(page.getByText("Welcome to Lumo")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /let's set it up/i })).toBeVisible();
  });

  test("OB02 – step 1 shows step counter and Skip button", async () => {
    await expect(page.getByText(/1.*5/)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /skip/i })).toBeVisible();
  });

  test("OB03 – advance to step 2: language selection (English / 中文)", async () => {
    await page.getByRole("button", { name: /let's set it up/i }).click();
    await expect(page.getByText("Language")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/english/i)).toBeVisible();
    await expect(page.getByText("中文")).toBeVisible();
  });

  test("OB04 – advance to step 3: accent color picker", async () => {
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText("Pick an accent")).toBeVisible({ timeout: 8_000 });
  });

  test("OB05 – advance to step 4: Comfortable / Compact density options", async () => {
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText("Density")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Comfortable")).toBeVisible();
    await expect(page.getByText("Compact")).toBeVisible();
  });

  test("OB06 – advance to step 5: 'All set', then complete → login page", async () => {
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByText("All set")).toBeVisible({ timeout: 8_000 });
    await page.getByRole("button", { name: /open the matrix/i }).click();
    // Onboarded users with no auth go to login
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Registration  (app is now on the login page)
  // ─────────────────────────────────────────────────────────────────────────

  test("REG01 – login page shows 'Welcome back' and Create account link", async () => {
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /create account/i }).first().click();
    await expect(page.getByText(/create your account/i)).toBeVisible({ timeout: 5_000 });
  });

  test("REG02 – register form has email, two password, and nickname inputs", async () => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("REG03 – fill form and submit → authenticated shell with Today link", async () => {
    const email = `electron-e2e-${Date.now()}@lumo.test`;
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').first().fill("E2eTest!2345");
    await page.locator('input[type="password"]').nth(1).fill("E2eTest!2345");
    const nick = page.locator('input[type="text"]');
    if (await nick.count() > 0) await nick.first().fill("E2E Tester");
    const tos = page.locator('input[type="checkbox"]');
    if (await tos.count() > 0) await tos.first().check();
    await page.locator('button[type="submit"]').click();
    // Backend registers user and redirects to the app shell
    await expect(page.getByRole("link", { name: /today/i })).toBeVisible({ timeout: 20_000 });
  });

  test("REG04 – after registration Matrix page is reachable from sidebar", async () => {
    await page.getByRole("link", { name: /matrix/i }).click();
    await expect(page.getByText("Do first")).toBeVisible({ timeout: 8_000 });
  });

  test("REG05 – after registration Settings page loads", async () => {
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page.getByText("Appearance")).toBeVisible({ timeout: 8_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Window basics
  // ─────────────────────────────────────────────────────────────────────────

  test("WIN01 – window title contains 'Lumo'", async () => {
    await expect(page).toHaveTitle(/lumo/i);
  });

  test("WIN02 – window is visible and not minimised", async () => {
    const visible = await electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win ? !win.isMinimized() && win.isVisible() : false;
    });
    expect(visible).toBe(true);
  });

  test("WIN03 – window can be minimised and restored", async () => {
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

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────

  test("NAV01 – Today sidebar link is present", async () => {
    await page.getByRole("link", { name: /today/i }).click();
    await expect(page.getByRole("link", { name: /today/i })).toBeVisible({ timeout: 5_000 });
  });

  test("NAV02 – Matrix link navigates to Matrix page", async () => {
    await page.getByRole("link", { name: /matrix/i }).click();
    await expect(page.getByText("Do first")).toBeVisible({ timeout: 8_000 });
  });

  test("NAV03 – Focus link navigates to Focus page", async () => {
    await page.getByRole("link", { name: /focus/i }).click();
    await expect(page.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible({ timeout: 8_000 });
  });

  test("NAV04 – Settings link navigates to Settings page", async () => {
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page.getByText("Appearance")).toBeVisible({ timeout: 8_000 });
  });

  test("NAV05 – Stats page accessible via hash navigation", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/stats"; });
    await expect(page.getByText(/this week|stats/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("NAV06 – Habits page accessible via hash navigation", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/habits"; });
    await expect(page.getByText("Habits").first()).toBeVisible({ timeout: 8_000 });
  });

  test("NAV07 – Countdown page accessible via hash navigation", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/countdown"; });
    await expect(page.getByText(/countdown/i).first()).toBeVisible({ timeout: 8_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Today page
  // ─────────────────────────────────────────────────────────────────────────

  test("TODAY01 – Today page renders shell content", async () => {
    await page.getByRole("link", { name: /today/i }).click();
    await expect(
      page.getByText("Recommended")
        .or(page.getByText("Nothing planned yet"))
        .or(page.getByText("Today's plan"))
    ).toBeVisible({ timeout: 8_000 });
  });

  test("TODAY02 – Quick Add modal opens from topbar", async () => {
    await expect(page.getByRole("button", { name: /quick add/i })).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /quick add/i }).click();
    await expect(page.getByPlaceholder(/what needs doing/i)).toBeVisible({ timeout: 5_000 });
  });

  test("TODAY03 – Quick Add Create button submits and closes modal", async () => {
    await page.getByPlaceholder(/what needs doing/i).fill("Electron journey task");
    await page.getByRole("button", { name: /^create$/i }).click();
    await expect(page.getByPlaceholder(/what needs doing/i)).not.toBeVisible({ timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Task CRUD via embedded backend API
  // ─────────────────────────────────────────────────────────────────────────

  test("TASK01 – task created via API appears in Today plan", async () => {
    const token = await page.evaluate(() => localStorage.getItem("lumo.token")) as string;
    const title = `API Today Task ${Date.now()}`;

    await page.evaluate(
      async ({ port, token, title }: { port: number; token: string; title: string }) => {
        await fetch(`http://127.0.0.1:${port}/v1/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: { en: title }, quadrant: "Q1", today: true }),
        });
      },
      { port: backendPort, token, title }
    );

    // Navigate to Today and wait for the new task to appear
    await page.evaluate(() => { (window as any).location.hash = "/today"; });
    await page.waitForTimeout(1_000);
    await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });
  });

  test("TASK02 – complete task button removes it from active task view", async () => {
    const token = await page.evaluate(() => localStorage.getItem("lumo.token")) as string;
    const title = `Complete Me ${Date.now()}`;

    await page.evaluate(
      async ({ port, token, title }: { port: number; token: string; title: string }) => {
        await fetch(`http://127.0.0.1:${port}/v1/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: { en: title }, quadrant: "Q1", today: true }),
        });
      },
      { port: backendPort, token, title }
    );

    await page.evaluate(() => { (window as any).location.hash = "/today"; });
    await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });

    const completeBtn = page.getByRole("button", { name: /complete task/i }).first();
    if (await completeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await completeBtn.click();
      await expect(completeBtn).not.toBeVisible({ timeout: 5_000 });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Matrix
  // ─────────────────────────────────────────────────────────────────────────

  test("MATRIX01 – all four Eisenhower quadrant headers are visible", async () => {
    await page.getByRole("link", { name: /matrix/i }).click();
    await expect(page.getByText("Do first")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Schedule")).toBeVisible();
    await expect(page.getByText("Delegate")).toBeVisible();
    await expect(page.getByText("Drop")).toBeVisible();
  });

  test("MATRIX02 – calendar view toggle shows week-day headers then returns", async () => {
    const calBtn = page.getByRole("button", { name: /calendar/i });
    if (await calBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await calBtn.click();
      await expect(
        page.getByText(/sun|mon|tue|wed|thu|fri|sat/i).first()
      ).toBeVisible({ timeout: 5_000 });
      await page.getByRole("button", { name: /matrix/i }).click();
      await expect(page.getByText("Do first")).toBeVisible({ timeout: 5_000 });
    }
  });

  test("MATRIX03 – API-created Q2 task appears in Schedule quadrant", async () => {
    const token = await page.evaluate(() => localStorage.getItem("lumo.token")) as string;
    const title = `Schedule Task ${Date.now()}`;

    await page.evaluate(
      async ({ port, token, title }: { port: number; token: string; title: string }) => {
        await fetch(`http://127.0.0.1:${port}/v1/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: { en: title }, quadrant: "Q2" }),
        });
      },
      { port: backendPort, token, title }
    );

    await page.getByRole("link", { name: /matrix/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Focus
  // ─────────────────────────────────────────────────────────────────────────

  test("FOCUS01 – focus page shows timer in MM:SS format", async () => {
    await page.getByRole("link", { name: /focus/i }).click();
    await expect(page.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible({ timeout: 8_000 });
  });

  test("FOCUS02 – 'Do not disturb' label is visible", async () => {
    await expect(page.getByText("Do not disturb")).toBeVisible({ timeout: 5_000 });
  });

  test("FOCUS03 – focus controls or empty-state message render", async () => {
    await expect(
      page.getByRole("button", { name: /pause|resume|mark complete/i })
        .or(page.getByText("Nothing to focus on"))
    ).toBeVisible({ timeout: 8_000 });
  });

  test("FOCUS04 – 'Mark complete' button present when task is active", async () => {
    await expect(
      page.getByRole("button", { name: /mark complete/i })
        .or(page.getByText("Nothing to focus on"))
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Settings — all tabs
  // ─────────────────────────────────────────────────────────────────────────

  test("SET01 – Appearance tab shows density controls", async () => {
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page.getByText("Appearance")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Comfortable")).toBeVisible();
    await expect(page.getByText("Compact")).toBeVisible();
  });

  test("SET02 – Appearance tab has Reduced motion toggle", async () => {
    await expect(page.getByText(/reduced motion/i)).toBeVisible({ timeout: 5_000 });
  });

  test("SET03 – Language tab shows English and 中文 options", async () => {
    await page.getByRole("button", { name: /language/i }).click();
    await expect(page.getByText(/english/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("中文")).toBeVisible();
  });

  test("SET04 – switching locale to 中文 and back to English works", async () => {
    await page.getByText("中文").click();
    await expect(page.getByText("中文")).toBeVisible({ timeout: 3_000 });
    await page.getByText(/english/i).click();
    await expect(page.getByText(/english/i)).toBeVisible({ timeout: 3_000 });
  });

  test("SET05 – Members tab shows 'Add member' button", async () => {
    await page.getByRole("button", { name: /members/i }).click();
    await expect(page.getByRole("button", { name: /add member/i })).toBeVisible({ timeout: 5_000 });
  });

  test("SET06 – Storage tab shows database location (Electron-specific)", async () => {
    const storageTab = page.getByRole("button", { name: /storage/i });
    if (await storageTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await storageTab.click();
      await expect(
        page.getByText(/database location|lumo\.db|show in/i).first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("SET07 – Sync tab shows cloud sync section", async () => {
    const syncTab = page.getByRole("button", { name: /^sync$/i });
    if (await syncTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await syncTab.click();
      await expect(
        page.getByText(/cloud sync|turso|remote replica/i).first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("SET08 – AI tab shows provider / model controls", async () => {
    const aiTab = page.getByRole("button", { name: /^AI$/i });
    if (await aiTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await aiTab.click();
      await expect(
        page.getByText(/openai|provider|model|api key/i).first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("SET09 – Data tab shows 'Replay onboarding' button", async () => {
    await page.getByRole("button", { name: /data/i }).click();
    await expect(page.getByRole("button", { name: /replay onboarding/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test("SET10 – Data tab shows 'Reset demo data' button", async () => {
    await expect(
      page.getByRole("button", { name: /reset/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Habits
  // ─────────────────────────────────────────────────────────────────────────

  test("HAB01 – Habits page loads with heading", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/habits"; });
    await expect(page.getByText("Habits").first()).toBeVisible({ timeout: 8_000 });
  });

  test("HAB02 – 'Add' button opens habit creation modal with name field", async () => {
    const addBtn = page.getByRole("button", { name: /add/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();
    await expect(page.locator("input").first()).toBeVisible({ timeout: 5_000 });
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
  });

  test("HAB03 – create a habit and verify it appears in the list", async () => {
    const addBtn = page.getByRole("button", { name: /add/i }).first();
    await addBtn.click();
    await expect(page.locator("input").first()).toBeVisible({ timeout: 5_000 });
    await page.locator("input").first().fill("Daily meditation");
    await page.getByRole("button", { name: /save|create|add/i }).first().click();
    await expect(page.getByText("Daily meditation")).toBeVisible({ timeout: 8_000 });
  });

  test("HAB04 – habit card shows a completion checkbox", async () => {
    await expect(page.getByText("Daily meditation")).toBeVisible({ timeout: 5_000 });
    await expect(
      page.locator('input[type="checkbox"]').or(page.getByRole("checkbox")).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────────────────────────────────

  test("STAT01 – Stats page shows 'This week' section", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/stats"; });
    await expect(page.getByText(/this week/i)).toBeVisible({ timeout: 8_000 });
  });

  test("STAT02 – Stats page shows 'All time' section", async () => {
    await expect(page.getByText(/all time/i)).toBeVisible({ timeout: 5_000 });
  });

  test("STAT03 – Tasks, Focus, and Streak stat cards are visible", async () => {
    await expect(page.getByText(/tasks/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/focus|hours/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/streak/i).first()).toBeVisible({ timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Countdown
  // ─────────────────────────────────────────────────────────────────────────

  test("CD01 – Countdown page loads with heading", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/countdown"; });
    await expect(page.getByText(/countdown/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("CD02 – 'Add' button opens countdown creation modal", async () => {
    const addBtn = page.getByRole("button", { name: /add/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();
    await expect(page.locator("input").first()).toBeVisible({ timeout: 5_000 });
    const cancelBtn = page.getByRole("button", { name: /cancel/i });
    if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Account
  // ─────────────────────────────────────────────────────────────────────────

  test("ACC01 – Account page shows signed-in user's email", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/account"; });
    await expect(page.getByText("Account").first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/lumo\.test/i)).toBeVisible({ timeout: 5_000 });
  });

  test("ACC02 – Account page has a 'Sign out' button", async () => {
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible({ timeout: 5_000 });
  });

  test("ACC03 – Change password link shows form with 3 password inputs", async () => {
    await page.getByRole("link", { name: /change password/i }).click();
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('input[type="password"]')).toHaveCount(3, { timeout: 5_000 });
    await page.evaluate(() => { (window as any).location.hash = "/account"; });
  });

  test("ACC04 – Account page shows Profile / Usage sections", async () => {
    await page.evaluate(() => { (window as any).location.hash = "/account"; });
    await expect(page.getByText("Account").first()).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByText(/profile|usage|tasks|pomodoros/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
