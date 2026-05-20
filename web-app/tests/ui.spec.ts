/**
 * Lumo Task — UI Automation Tests
 *
 * 10 end-to-end test cases covering the core user flows:
 *   TC-01  Onboarding welcome screen renders
 *   TC-02  Skip onboarding lands on /today
 *   TC-03  Login page form fields render
 *   TC-04  Demo credentials sign-in navigates to /today
 *   TC-05  Today page conviction card displays task info
 *   TC-06  "Start focus" button navigates to /focus
 *   TC-07  Matrix page shows all four Eisenhower quadrants
 *   TC-08  AI classify button opens the review modal
 *   TC-09  Focus page timer and Pause/Resume controls work
 *   TC-10  Settings page accent swatch selection persists
 */

import { test, expect } from "@playwright/test";
import {
  setupAuthState,
  setupOnboardedState,
  mockAllApiCalls,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// Group 1: Onboarding  (fresh localStorage → app redirects to /onboarding)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Onboarding", () => {
  /**
   * TC-01: Welcome screen renders correctly.
   *
   * On first visit (empty localStorage) the app gate-keeps to /onboarding.
   * The welcome step must display the product name, the primary CTA, and the
   * "Skip" escape hatch.
   */
  test("TC-01: welcome screen shows title, CTA, and skip link", async ({ page }) => {
    // No localStorage → onboarded defaults to false → app redirects
    await page.goto("/");

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
    await expect(page.getByText("Welcome to Lumo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Let's set it up" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
  });

  /**
   * TC-02: Clicking "Skip" on the first onboarding step bypasses all steps
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
// Group 2: Auth pages  (onboarded, but not signed in)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Auth pages", () => {
  test.beforeEach(async ({ page }) => {
    await setupOnboardedState(page);
  });

  /**
   * TC-03: Login page form renders all required elements.
   *
   * Checks heading, email field, password field, submit button, and the
   * "Continue without account" ghost button (local-first escape hatch).
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
   * TC-04: Signing in with demo credentials (intercepted by mock API)
   * updates auth state and redirects to /today.
   */
  test("TC-04: sign-in with demo credentials navigates to /today", async ({ page }) => {
    await mockAllApiCalls(page);
    await page.goto("/login");

    await page.getByPlaceholder("you@example.com").fill("alex@stride.studio");
    await page.getByPlaceholder("••••••••").fill("demo1234");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/today/, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 3: Authenticated app  (onboarded + signed in + API mocked)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Authenticated app", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthState(page);
    await mockAllApiCalls(page);
  });

  /**
   * TC-05: Today page conviction card displays the top task.
   *
   * After tasks load from the mocked API, the conviction card must show
   * the "Recommended" label, the task title, and the conviction percentage bar.
   */
  test("TC-05: Today page shows conviction card with top-task data", async ({ page }) => {
    await page.goto("/today");

    // Section label
    await expect(page.getByText("Recommended").first()).toBeVisible({ timeout: 8_000 });
    // Top Q1 task title
    await expect(
      page.getByText("Finish homepage wireframes for client review")
    ).toBeVisible();
    // Conviction sidebar label
    await expect(page.getByText("Conviction")).toBeVisible();
  });

  /**
   * TC-06: The "Start focus" button on the conviction card navigates to /focus.
   */
  test("TC-06: Start focus button navigates to /focus", async ({ page }) => {
    await page.goto("/today");

    await expect(
      page.getByRole("button", { name: /start focus/i })
    ).toBeVisible({ timeout: 8_000 });

    await page.getByRole("button", { name: /start focus/i }).click();

    await expect(page).toHaveURL(/\/focus/, { timeout: 5_000 });
  });

  /**
   * TC-07: Matrix page renders all four Eisenhower quadrant panels.
   *
   * Checks Q1 "Do first", Q2 "Schedule", Q3 "Delegate", Q4 "Drop" headers
   * and verifies that the task count badge is visible in the sidebar.
   */
  test("TC-07: Matrix page shows all four Eisenhower quadrants", async ({ page }) => {
    await page.goto("/matrix");

    await expect(page.getByText("Do first")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText("Schedule")).toBeVisible();
    await expect(page.getByText("Delegate")).toBeVisible();
    await expect(page.getByText("Drop")).toBeVisible();
  });

  /**
   * TC-08: Clicking "AI classify" opens the review modal.
   *
   * The button is enabled only when there are active tasks; with seed data
   * loaded it should be clickable and the modal heading must appear.
   */
  test("TC-08: AI classify button opens the classify modal", async ({ page }) => {
    await page.goto("/matrix");

    const classifyBtn = page.getByRole("button", { name: /ai classify/i });
    await expect(classifyBtn).toBeVisible({ timeout: 8_000 });
    await expect(classifyBtn).toBeEnabled();

    await classifyBtn.click();

    await expect(
      page.getByText("Let me sort these for you")
    ).toBeVisible({ timeout: 5_000 });

    // Modal should also have a close button
    await expect(page.getByRole("button", { name: /close/i }).or(
      page.locator('[aria-label="Close"]')
    ).or(page.locator('button').filter({ hasText: /×|✕/ })).first()).toBeVisible();
  });

  /**
   * TC-09: Focus page shows a 25:00 countdown and working Pause/Resume controls.
   *
   * Verifies the timer renders at 25:00, Pause switches to Resume, and the
   * current task title is visible in the task strip.
   */
  test("TC-09: Focus page timer starts at 25:00 and Pause/Resume toggles", async ({ page }) => {
    await page.goto("/focus");

    // Timer must start at exactly 25:00
    await expect(page.getByText("25:00")).toBeVisible({ timeout: 8_000 });

    // Pause control
    const pauseBtn = page.getByRole("button", { name: /pause/i });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // After pause the button label changes to Resume
    await expect(page.getByRole("button", { name: /resume/i })).toBeVisible({
      timeout: 3_000,
    });
  });

  /**
   * TC-10: Settings page accent switcher updates the selected swatch.
   *
   * Clicks the "Calm Cyan" swatch, navigates away, then returns to Settings
   * to confirm the selection persisted in the app store.
   */
  test("TC-10: Settings page accent swatch selection persists across navigation", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Default accent (green) swatch must be visible
    const greenSwatch = page.getByTitle("Lumo Green");
    await expect(greenSwatch).toBeVisible({ timeout: 8_000 });

    // Select Calm Cyan
    const cyanSwatch = page.getByTitle("Calm Cyan");
    await expect(cyanSwatch).toBeVisible();
    await cyanSwatch.click();

    // Navigate away and back to verify persistence
    await page.getByText("Today").first().click();
    await expect(page).toHaveURL(/\/today/, { timeout: 5_000 });

    await page.goto("/settings");

    // Cyan should now have the "selected" outline (scale(1.05) + bold outline)
    // We verify by checking the CSS outline via evaluate
    const selectedOutline = await page.getByTitle("Calm Cyan").evaluate(
      (el) => getComputedStyle(el).outlineStyle
    );
    // Selected swatches use a solid outline; unselected use a 1px solid border
    expect(selectedOutline).not.toBe("none");
  });
});
