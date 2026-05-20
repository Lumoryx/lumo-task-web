/**
 * Shared test helpers for Playwright UI tests.
 *
 * Provides:
 *  - setupAuthState   — writes localStorage before page load so the app boots
 *                       as an authenticated, already-onboarded user.
 *  - mockAllApiCalls  — intercepts every backend call and returns seed data so
 *                       tests work without a running backend.
 */

import type { Page } from "@playwright/test";

// ── Demo user returned by the mocked /auth/signin endpoint ───────────────────

export const DEMO_USER = {
  id: "u-test-1",
  name: "Alex",
  email: "alex@stride.studio",
  initials: "AL",
  local: false,
  plan: "pro",
  stats: { tasks: 11, pomodoros: 6, syncOK: true },
};

// ── Seed tasks (mirrors src/mocks/tasks.ts, shaped for the API response) ─────

export const MOCK_TASKS = [
  {
    id: "t1",
    assignee_ids: [],
    title: { en: "Finish homepage wireframes for client review", zh: "完成客户评审用的首页线框" },
    desc: { en: "Hero, features section, footer.", zh: "Hero、功能区、Footer。" },
    quadrant: "Q1",
    today: true,
    due: "today",
    duration: 90,
    pomos_done: 1,
    pomos_total: 4,
    completed: false,
    conviction: 0.92,
    next_step: { en: "Open Hero frame · Outline 3 layout options", zh: "打开 Hero 画板 · 列 3 个版式" },
    reason: {
      en: "Due today and blocks the next design stage.",
      zh: "今天截止,会卡住下一阶段。",
    },
    not_now: [
      { id: "t2", reason: { en: "Can wait until Sat", zh: "周六前都不卡进度" } },
    ],
    ai_suggest: null,
  },
  {
    id: "t2",
    assignee_ids: [],
    title: { en: "Draft Q3 OKRs", zh: "起草 Q3 OKR 初稿" },
    quadrant: "Q2",
    today: true,
    due: "Fri",
    duration: 60,
    pomos_done: 0,
    pomos_total: 3,
    completed: false,
    conviction: null,
    next_step: null,
    reason: null,
    not_now: [],
    ai_suggest: null,
  },
  {
    id: "t3",
    assignee_ids: [],
    title: { en: "Reply to investor follow-up email", zh: "回复投资人跟进邮件" },
    quadrant: "Q1",
    today: true,
    due: "today",
    duration: 20,
    pomos_done: 0,
    pomos_total: 1,
    completed: false,
    conviction: null,
    next_step: null,
    reason: null,
    not_now: [],
    ai_suggest: null,
  },
  {
    id: "t4",
    assignee_ids: [],
    title: { en: "Refactor auth module — token rotation", zh: "重构 auth 模块的 Token 轮换" },
    quadrant: "Q2",
    today: false,
    due: "next wk",
    duration: 180,
    pomos_done: 0,
    pomos_total: 6,
    completed: false,
    conviction: null,
    next_step: null,
    reason: null,
    not_now: [],
    ai_suggest: "Q2",
  },
  {
    id: "t5",
    assignee_ids: [],
    title: { en: "Approve Acme invoices", zh: "审批 Acme 发票" },
    quadrant: "Q3",
    today: true,
    due: "today",
    duration: 15,
    pomos_done: 0,
    pomos_total: 1,
    completed: false,
    conviction: null,
    next_step: null,
    reason: null,
    not_now: [],
    ai_suggest: null,
  },
  {
    id: "t6",
    assignee_ids: [],
    title: { en: "Clean up Downloads folder", zh: "清理下载文件夹" },
    quadrant: "Q4",
    today: false,
    due: null,
    duration: 15,
    pomos_done: 0,
    pomos_total: 1,
    completed: false,
    conviction: null,
    next_step: null,
    reason: null,
    not_now: [],
    ai_suggest: null,
  },
  {
    id: "t7",
    assignee_ids: [],
    title: { en: "Plan team offsite agenda", zh: "策划团队 offsite 议程" },
    quadrant: "unclassified",
    today: false,
    due: "Aug 2",
    duration: 45,
    pomos_done: 0,
    pomos_total: 2,
    completed: false,
    conviction: null,
    next_step: null,
    reason: null,
    not_now: [],
    ai_suggest: "Q2",
  },
];

// ── Seed completed entries ────────────────────────────────────────────────────

function todayAt(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const MOCK_COMPLETED = [
  {
    id: "c1",
    title: { en: "Reply to design feedback from Pieter", zh: "回复 Pieter 的设计反馈" },
    duration: 18,
    quadrant: "Q2",
    startedAt: todayAt(8, 55),
    completedAt: todayAt(9, 13),
    taskId: null,
  },
  {
    id: "c2",
    title: { en: "Set up next week's calendar blocks", zh: "排好下周的日程块" },
    duration: 12,
    quadrant: "Q3",
    startedAt: todayAt(9, 20),
    completedAt: todayAt(9, 32),
    taskId: null,
  },
];

// ── localStorage state helpers ────────────────────────────────────────────────

/**
 * Injects localStorage entries so the app boots as a signed-in,
 * already-onboarded user. Must be called before page.goto().
 */
export async function setupAuthState(page: Page): Promise<void> {
  await page.addInitScript((user) => {
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
    localStorage.setItem(
      "lumo.auth.v1",
      JSON.stringify({ state: { user, loading: false, error: null }, version: 0 })
    );
    localStorage.setItem("lumo.token", "test-jwt-token");
  }, DEMO_USER);
}

/**
 * Injects only the onboarded flag — no auth token — so the app
 * starts on /today but without a signed-in user (e.g. for login-page tests).
 */
export async function setupOnboardedState(page: Page): Promise<void> {
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

// ── API route mocks ───────────────────────────────────────────────────────────

const API = "http://localhost:47291";

/**
 * Intercepts all backend calls and returns mock data.
 * Call this before page.goto() alongside setupAuthState().
 */
export async function mockAllApiCalls(page: Page): Promise<void> {
  // GET /v1/tasks
  await page.route(`${API}/v1/tasks`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: MOCK_TASKS });
    } else {
      await route.continue();
    }
  });

  // GET /v1/completed?date=... and POST /v1/completed/:id/reopen
  await page.route(`${API}/v1/completed**`, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ json: MOCK_COMPLETED });
    } else {
      await route.fulfill({ status: 204, body: "" });
    }
  });

  // GET/POST/PATCH/DELETE /v1/people
  await page.route(`${API}/v1/people**`, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ json: [] });
    } else {
      await route.fulfill({ status: 204, body: "" });
    }
  });

  // POST /v1/auth/signin
  await page.route(`${API}/v1/auth/signin`, async (route) => {
    await route.fulfill({
      json: { token: "test-jwt-token", user: DEMO_USER },
    });
  });

  // PATCH /v1/tasks/:id and task mutations
  await page.route(`${API}/v1/tasks/**`, async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  // Fallthrough: allow any remaining calls (settings, user, etc.) to fail
  // gracefully by returning empty objects rather than crashing the runner.
  await page.route(`${API}/**`, async (route) => {
    await route.fulfill({ json: {} });
  });
}
