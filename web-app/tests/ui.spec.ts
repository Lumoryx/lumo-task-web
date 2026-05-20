/**
 * Lumo Task — UI Automation Tests
 *
 * Runs against the real backend (no API mocking). The target environment is
 * configured via environment variables — see tests/config.ts for details.
 *
 * globalSetup (tests/global-setup.ts) handles:
 *   • signing in / registering the test account
 *   • seeding tasks if the account is empty
 *   • saving a Playwright storageState so every test starts authenticated
 *
 * Test cases
 * ──────────
 *   TC-01  Onboarding welcome screen renders
 *   TC-02  Skip onboarding lands on /today
 *   TC-03  Login page form elements render
 *   TC-04  Sign-in with test credentials navigates to /today
 *   TC-05  Today page conviction card shows top-task data
 *   TC-06  "Start focus" button navigates to /focus
 *   TC-07  Matrix page shows all four Eisenhower quadrants
 *   TC-08  AI classify button opens the review modal
 *   TC-09  Focus page timer and Pause/Resume controls work
 *   TC-10  Settings page accent swatch selection persists
 */

import { test, expect } from "@playwright/test";
import { setOnboardedOnly } from "./helpers";
import { config } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// Group 1: Onboarding  (empty localStorage — first-run experience)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Onboarding", () => {
  // Override the default storageState with an empty session so the app
  // behaves as if it has never been opened before.
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * TC-01: Welcome screen renders correctly.
   *
   * With empty localStorage, the app gates to /onboarding automatically.
   * Verifies the product name, primary CTA, and the Skip escape hatch.
   */
  test("TC-01: welcome screen shows title, CTA, and skip link", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
    await expect(page.getByText("Welcome to Lumo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Let's set it up" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  });

  /**
   * TC-02: Clicking "Skip" on the first step bypasses all onboarding steps
   * and routes the user to /today.
   */
  test("TC-02: skip onboarding redirects to /today", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

    await page.getByRole("button", { name: "Skip" }).click();

    await expect(page).toHaveURL(/\/today/, { timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 2: Auth pages  (onboarded, not signed in — local user)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Auth pages", () => {
  // Onboarded but not signed in; login-page tests need a clean auth state.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Mark onboarding complete so the app doesn't redirect to /onboarding
    await setOnboardedOnly(page);
  });

  /**
   * TC-03: Login page renders all required form elements.
   *
   * Checks the heading, email field, password field, sign-in button, and
   * the "Continue without account" local-first escape hatch.
   */
  test("TC-03: login page renders email, password, and sign-in button", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    // Local-first escape hatch must always be reachable
    await expect(
      page.getByRole("button", { name: /continue without/i })
    ).toBeVisible();
  });

  /**
   * TC-04: Signing in with the configured test credentials (real backend call)
   * updates the auth state and redirects to /today.
   */
  test("TC-04: sign-in with test credentials navigates to /today", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("you@example.com").fill(config.testEmail);
    await page.getByPlaceholder("••••••••").fill(config.testPassword);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/today/, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 3: Authenticated app
// (default storageState from playwright.config.ts — session from globalSetup)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Authenticated app", () => {
  /**
   * TC-05: Today page conviction card displays the top task.
   *
   * The real backend returns the tasks seeded by globalSetup. The card must
   * show the "Recommended" label, the Q1 task title, and the Conviction bar.
   */
  test("TC-05: Today page shows conviction card with top-task data", async ({ page }) => {
    await page.goto("/today");

    await expect(page.getByText("Recommended").first()).toBeVisible({
      timeout: 10_000,
    });
    // The seeded Q1/today task must be the top recommendation
    await expect(
      page.getByText("Finish homepage wireframes for client review")
    ).toBeVisible();
    await expect(page.getByText("Conviction")).toBeVisible();
  });

  /**
   * TC-06: Clicking "Start focus" on the conviction card navigates to /focus.
   */
  test("TC-06: Start focus button navigates to /focus", async ({ page }) => {
    await page.goto("/today");

    const startBtn = page.getByRole("button", { name: /start focus/i });
    await expect(startBtn).toBeVisible({ timeout: 10_000 });
    await startBtn.click();

    await expect(page).toHaveURL(/\/focus/, { timeout: 5_000 });
  });

  /**
   * TC-07: Matrix page renders all four Eisenhower quadrant panels.
   *
   * Checks Do first (Q1), Schedule (Q2), Delegate (Q3), Drop (Q4).
   */
  test("TC-07: Matrix page shows all four Eisenhower quadrants", async ({ page }) => {
    await page.goto("/matrix");

    await expect(page.getByText("Do first")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Schedule")).toBeVisible();
    await expect(page.getByText("Delegate")).toBeVisible();
    await expect(page.getByText("Drop")).toBeVisible();
  });

  /**
   * TC-08: Clicking "AI classify" opens the review modal with the correct
   * heading. The button is enabled because tasks were seeded by globalSetup.
   */
  test("TC-08: AI classify button opens the classify modal", async ({ page }) => {
    await page.goto("/matrix");

    const classifyBtn = page.getByRole("button", { name: /ai classify/i });
    await expect(classifyBtn).toBeVisible({ timeout: 10_000 });
    await expect(classifyBtn).toBeEnabled();
    await classifyBtn.click();

    await expect(page.getByText("Let me sort these for you")).toBeVisible({
      timeout: 5_000,
    });
  });

  /**
   * TC-09: Focus page shows a 25:00 countdown timer and working
   * Pause / Resume controls.
   */
  test("TC-09: Focus page timer starts at 25:00 and Pause/Resume toggles", async ({
    page,
  }) => {
    await page.goto("/focus");

    await expect(page.getByText("25:00")).toBeVisible({ timeout: 10_000 });

    const pauseBtn = page.getByRole("button", { name: /pause/i });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    await expect(page.getByRole("button", { name: /resume/i })).toBeVisible({
      timeout: 3_000,
    });
  });

  /**
   * TC-10: Clicking a different accent swatch in Settings updates the
   * selection, and the choice persists after navigating away and back.
   */
  test("TC-10: Settings accent swatch selection persists across navigation", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Default green swatch must be visible
    await expect(page.getByTitle("Lumo Green")).toBeVisible({ timeout: 10_000 });

    // Switch to Calm Cyan
    await page.getByTitle("Calm Cyan").click();

    // Navigate away via the sidebar
    await page.getByText("Today").first().click();
    await expect(page).toHaveURL(/\/today/, { timeout: 5_000 });

    // Return to Settings
    await page.goto("/settings");

    // The selected swatch should now use a solid outline (selected state)
    // while unselected swatches use a 1px border.
    const outlineStyle = await page
      .getByTitle("Calm Cyan")
      .evaluate((el) => getComputedStyle(el).outlineStyle);

    expect(outlineStyle).not.toBe("none");
  });
});
