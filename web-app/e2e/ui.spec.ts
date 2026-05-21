import { test, expect, type Page } from "@playwright/test";

/**
 * The app uses HashRouter: routes live in the hash fragment (e.g. /#/today).
 * Set localStorage before the page boots so Zustand picks up onboarded=true
 * and does not redirect to /onboarding on every test that doesn't test it.
 */
async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "lumo.app.v1",
      JSON.stringify({
        state: {
          locale: "en",
          accent: "green",
          density: "comfortable",
          reducedMotion: false,
          onboarded: true,
        },
        version: 0,
      })
    );
  });
}

/**
 * Mock all /v1/* API calls so tests run without a live backend.
 */
async function mockAPI(page: Page) {
  await page.route("**/v1/**", (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/v1/auth/signin") && method === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "mock-token",
          user: {
            id: "u1",
            email: "alex@stride.studio",
            name: "Alex",
            initials: "AL",
            plan: "free",
            stats: { tasksCreated: 5, pomodorosCompleted: 3, syncOK: false },
          },
        }),
      });
    }
    if (url.includes("/v1/tasks")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tasks: [] }),
      });
    }
    if (url.includes("/v1/people")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ people: [] }),
      });
    }
    if (url.includes("/v1/settings")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          settings: { locale: "en", accent: "green", density: "comfortable" },
        }),
      });
    }
    if (url.includes("/v1/completed")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ entries: [] }),
      });
    }
    if (url.includes("/v1/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "u1",
            email: "alex@stride.studio",
            name: "Alex",
            initials: "AL",
            plan: "free",
            stats: { tasksCreated: 5, pomodorosCompleted: 3, syncOK: false },
          },
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TC01 – Onboarding: complete the full 5-step wizard
// ─────────────────────────────────────────────────────────────────────────────
test("TC01 – Onboarding: complete full 5-step flow", async ({ page }) => {
  // Fresh context — no onboarded flag in localStorage
  await page.goto("/");

  // The first-run gate redirects to #/onboarding
  await expect(page).toHaveURL(/#\/onboarding/);

  // Step 1 of 5 — "Let's set it up"
  await expect(page.getByText("1 / 5")).toBeVisible();
  await page.locator("footer .btn-primary").click();

  // Steps 2–4 — "Continue"
  for (let step = 2; step <= 4; step++) {
    await expect(page.getByText(`${step} / 5`)).toBeVisible();
    await page.locator("footer .btn-primary").click();
  }

  // Step 5 — "Open the matrix"
  await expect(page.getByText("5 / 5")).toBeVisible();
  await page.locator("footer .btn-primary").click();

  // Completing onboarding lands in the main app
  await expect(page).toHaveURL(/matrix|today/);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC02 – Onboarding: Skip button exits immediately to Today
// ─────────────────────────────────────────────────────────────────────────────
test("TC02 – Onboarding: skip button goes to Today page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/#\/onboarding/);

  // "Skip" sits in the top-right of the onboarding card
  await page.getByRole("button", { name: "Skip" }).click();

  await expect(page).toHaveURL(/today/);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC03 – Login page: all essential form elements are visible
// ─────────────────────────────────────────────────────────────────────────────
test("TC03 – Login page: email, password and submit button are visible", async ({ page }) => {
  await skipOnboarding(page);
  // HashRouter routes live in the hash fragment — navigate to /#/login
  await page.goto("/#/login");

  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();

  // Submit button says "Sign in"
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeVisible();
  await expect(submitBtn).toBeEnabled();

  // OAuth coming-soon buttons
  await expect(page.getByText(/continue with google/i)).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC04 – Login page: "Create account" link navigates to /register
// ─────────────────────────────────────────────────────────────────────────────
test("TC04 – Login page: 'Create account' link navigates to /register", async ({ page }) => {
  await skipOnboarding(page);
  await page.goto("/#/login");

  // There are two buttons named "Create account" on the login page
  // (footer link + OAuth section), pick the type="button" navigation link
  const toRegisterBtn = page
    .locator('button[type="button"]')
    .filter({ hasText: /create account/i })
    .first();
  await toRegisterBtn.click();

  await expect(page).toHaveURL(/register/);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC05 – Register page: all required input fields are present
// ─────────────────────────────────────────────────────────────────────────────
test("TC05 – Register page: email, password, confirm and nickname fields visible", async ({
  page,
}) => {
  await skipOnboarding(page);
  await page.goto("/#/register");

  await expect(page.locator('input[type="email"]')).toBeVisible();

  // Two password-type inputs: password + confirm
  const passwordInputs = page.locator('input[type="password"]');
  await expect(passwordInputs).toHaveCount(2);

  // Nickname / display name (text input)
  await expect(page.locator('input[type="text"]')).toBeVisible();

  // Submit button says "Create account"
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC06 – Today page: sidebar and page content render correctly
// ─────────────────────────────────────────────────────────────────────────────
test("TC06 – Today page: sidebar brand and page content are visible", async ({ page }) => {
  await skipOnboarding(page);
  await mockAPI(page);
  await page.goto("/#/today");

  // Sidebar brand
  await expect(page.getByText("Lumo").first()).toBeVisible();

  // Today nav item is active in the sidebar
  await expect(page.locator(".nav-item", { hasText: /today/i }).first()).toBeVisible();

  // Today page empty-state (no tasks yet via mock API)
  await expect(page.getByText("Nothing planned yet")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC07 – Matrix page: all four Eisenhower quadrant headers are visible
// ─────────────────────────────────────────────────────────────────────────────
test("TC07 – Matrix page: four quadrant headers visible (Do first, Schedule, Delegate, Drop)", async ({
  page,
}) => {
  await skipOnboarding(page);
  await mockAPI(page);
  await page.goto("/#/matrix");

  // The four quadrant column headings
  await expect(page.getByText("Do first")).toBeVisible();
  await expect(page.getByText("Schedule")).toBeVisible();
  await expect(page.getByText("Delegate")).toBeVisible();
  await expect(page.getByText("Drop")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC08 – Focus page: renders without errors (empty state with no tasks)
// ─────────────────────────────────────────────────────────────────────────────
test("TC08 – Focus page: empty state renders when there are no tasks", async ({ page }) => {
  await skipOnboarding(page);
  await mockAPI(page);
  await page.goto("/#/focus");

  // With zero tasks the focus page shows this empty-state heading
  await expect(page.getByText("Nothing to focus on")).toBeVisible();

  // CTA to go back to Today
  await expect(page.getByRole("button", { name: /go to today/i })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC09 – Settings page: appearance controls render
// ─────────────────────────────────────────────────────────────────────────────
test("TC09 – Settings page: appearance section with accent and density controls visible", async ({
  page,
}) => {
  await skipOnboarding(page);
  await mockAPI(page);
  await page.goto("/#/settings");

  // "Appearance" section group heading
  await expect(page.getByText("Appearance").first()).toBeVisible();

  // Density segmented control — at least one density option
  await expect(page.getByText("Comfortable").first()).toBeVisible();
  await expect(page.getByText("Compact").first()).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC10 – Sidebar navigation: clicking links changes the active page
// ─────────────────────────────────────────────────────────────────────────────
test("TC10 – Sidebar navigation: Today → Matrix → Settings updates the URL", async ({
  page,
}) => {
  await skipOnboarding(page);
  await mockAPI(page);
  await page.goto("/#/today");

  // Navigate to Matrix
  await page.locator(".nav-item", { hasText: /matrix/i }).click();
  await expect(page).toHaveURL(/matrix/);

  // Navigate to Settings
  await page.locator(".nav-item", { hasText: /settings/i }).click();
  await expect(page).toHaveURL(/settings/);

  // Navigate back to Today
  await page.locator(".nav-item", { hasText: /today/i }).click();
  await expect(page).toHaveURL(/today/);
});
