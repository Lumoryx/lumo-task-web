/**
 * Playwright globalSetup — runs once before the entire test suite.
 *
 * Steps
 * ─────
 * 1. Authenticate against the real backend (sign in or auto-register the
 *    test account if this is the first run against a fresh environment).
 * 2. Seed the test account with tasks if it has fewer than 5 active tasks.
 * 3. Open a headless browser, inject the auth state into localStorage, then
 *    capture a Playwright storageState snapshot so every test starts with
 *    a pre-authenticated session — no UI login required per test.
 */

import { chromium, request } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { config } from "./config";
import { SEED_TASKS } from "./seed-data";

// ── Auth helpers ──────────────────────────────────────────────────────────────

interface AuthResult {
  token: string;
  user: Record<string, unknown>;
}

async function authenticate(): Promise<AuthResult> {
  const ctx = await request.newContext({ baseURL: config.apiBaseUrl });

  // Try sign-in first
  const signinRes = await ctx.post("/auth/signin", {
    data: { email: config.testEmail, password: config.testPassword },
  });

  if (signinRes.ok()) {
    const body = await signinRes.json();
    await ctx.dispose();
    return { token: body.token, user: body.user };
  }

  // Account doesn't exist yet — register it
  console.log("[setup] Test account not found; registering…");
  const registerRes = await ctx.post("/auth/register", {
    data: {
      email: config.testEmail,
      password: config.testPassword,
      confirm: config.testPassword,
      name: "E2E Test User",
    },
  });

  if (!registerRes.ok()) {
    const text = await registerRes.text();
    await ctx.dispose();
    throw new Error(
      `[setup] Failed to authenticate test user (${config.testEmail}): ${text}`
    );
  }

  const body = await registerRes.json();
  await ctx.dispose();
  return { token: body.token, user: body.user };
}

// ── Task seeding ──────────────────────────────────────────────────────────────

async function seedTasksIfNeeded(token: string): Promise<void> {
  const ctx = await request.newContext({
    baseURL: config.apiBaseUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });

  const res = await ctx.get("/tasks");
  if (!res.ok()) {
    await ctx.dispose();
    return; // Non-fatal: tests will still run, some may skip
  }

  const tasks: unknown[] = await res.json();
  const activeTasks = Array.isArray(tasks)
    ? tasks.filter((t: any) => !t.completed)
    : [];

  if (activeTasks.length >= 5) {
    console.log(`[setup] ${activeTasks.length} tasks found — skipping seed.`);
    await ctx.dispose();
    return;
  }

  console.log(
    `[setup] Only ${activeTasks.length} active tasks; seeding ${SEED_TASKS.length} tasks…`
  );

  for (const task of SEED_TASKS) {
    const r = await ctx.post("/tasks", { data: task });
    if (!r.ok()) {
      console.warn("[setup] Failed to create task:", task.title.en);
    }
  }

  await ctx.dispose();
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default async function globalSetup() {
  console.log(`[setup] target → ${config.baseUrl}`);
  console.log(`[setup] api    → ${config.apiBaseUrl}`);

  // 1. Authenticate
  const { token, user } = await authenticate();
  console.log(`[setup] signed in as ${(user as any).email ?? config.testEmail}`);

  // 2. Seed tasks
  await seedTasksIfNeeded(token);

  // 3. Capture browser storage state ─────────────────────────────────────────
  //    addInitScript runs before the page's own JS, so localStorage is set
  //    before React / Zustand read it. The app boots as onboarded + signed in.

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.addInitScript(
    ({ appState, authState, jwtToken }) => {
      localStorage.setItem("lumo.app.v1", JSON.stringify(appState));
      localStorage.setItem("lumo.auth.v1", JSON.stringify(authState));
      localStorage.setItem("lumo.token", jwtToken);
    },
    {
      appState: {
        state: {
          onboarded: true,
          locale: "en",
          accent: "green",
          density: "comfortable",
          reducedMotion: false,
        },
        version: 0,
      },
      authState: {
        state: { user, loading: false, error: null },
        version: 0,
      },
      jwtToken: token,
    }
  );

  await page.goto(config.baseUrl);
  // Wait until the app has navigated past the auth/onboarding gates
  await page.waitForURL(
    (url) => !url.pathname.includes("/onboarding"),
    { timeout: 30_000 }
  );

  // Persist storage state (cookies + localStorage) for all tests
  const authDir = path.dirname(config.authFile);
  await fs.mkdir(authDir, { recursive: true });
  await context.storageState({ path: config.authFile });

  await browser.close();
  console.log(`[setup] storage state saved → ${config.authFile}`);
}
