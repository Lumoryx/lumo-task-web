/**
 * Shared Playwright test helpers.
 *
 * Auth state is now handled globally by globalSetup (which writes
 * tests/.auth/user.json). These utilities cover the remaining edge cases:
 *
 *  - clearStorageState  — wipe localStorage for tests that need a fresh
 *                         first-run experience (onboarding, login page).
 *  - setOnboardedState  — mark onboarding complete but leave the user
 *                         signed out (used for login-page tests).
 */

import type { Page } from "@playwright/test";

/**
 * Inject only the "onboarded" flag into localStorage.
 * The app will load as a local (not signed-in) user so that
 * login-page and auth flows can be tested end-to-end.
 * Must be called before page.goto().
 */
export async function setOnboardedOnly(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      "lumo.app.v1",
      JSON.stringify({
        state: {
          onboarded: true,
          locale: "en",
          accent: "green",
          density: "comfortable",
          reducedMotion: false,
        },
        version: 0,
      })
    );
  });
}
