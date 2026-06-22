/**
 * Domain factories for backend tests.
 *
 * `makeX(overrides)` returns a valid request payload (spread overrides to vary
 * a single field per scenario). `seedX(token, overrides)` POSTs it and returns
 * the created entity, so a test that just needs "a task to exist" gets one in a
 * single line instead of an inline create. Add a new domain here once and every
 * test layer (api / security / standards) can reuse it.
 */
import { req } from "./client.js";

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function makeTask(overrides: Record<string, unknown> = {}) {
  return { title: { en: "Test task" }, ...overrides };
}

export async function seedTask(token: string, overrides: Record<string, unknown> = {}) {
  const { body } = await req("POST", "/v1/tasks", { token, body: makeTask(overrides) });
  return body;
}

// ── People ────────────────────────────────────────────────────────────────────

export function makePerson(overrides: Record<string, unknown> = {}) {
  return { name: "Test Person", initials: "TP", color: "#5bc8d4", ...overrides };
}

export async function seedPerson(token: string, overrides: Record<string, unknown> = {}) {
  const { body } = await req("POST", "/v1/people", { token, body: makePerson(overrides) });
  return body;
}

// ── Habits ────────────────────────────────────────────────────────────────────

export function makeHabit(overrides: Record<string, unknown> = {}) {
  return { title: "Test habit", color: "green", frequency: "daily", ...overrides };
}

export async function seedHabit(token: string, overrides: Record<string, unknown> = {}) {
  const { body } = await req("POST", "/v1/habits", { token, body: makeHabit(overrides) });
  return body;
}

// ── Countdowns ──────────────────────────────────────────────────────────────────

export function makeCountdown(overrides: Record<string, unknown> = {}) {
  return { title: "Test event", date: "2026-12-01", color: "cyan", repeat: "none", ...overrides };
}

export async function seedCountdown(token: string, overrides: Record<string, unknown> = {}) {
  const { body } = await req("POST", "/v1/countdowns", { token, body: makeCountdown(overrides) });
  return body;
}
