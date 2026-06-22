/**
 * Q2 stagnation awareness (#187).
 *
 * Turns the server-maintained `updated_at` timestamp into a "how long has this
 * important task sat untouched" signal. All computation is client-side off the
 * already-synced task — no extra API calls.
 *
 * Eisenhower's matrix fails in practice when Q2 (important / not urgent) work
 * silently piles up: no deadline pressure (unlike Q1), no external nudge (unlike
 * Q3). These helpers surface that age so the matrix becomes a strategic ledger
 * instead of a black hole.
 */
import type { Task, Locale } from "@/types/task";
import { STRINGS } from "@/i18n/strings";

export type StagnationLevel = "none" | "low" | "mid" | "high";

/** Day thresholds for each level. A task is stagnant once untouched ≥ LOW days. */
export const STAGNATION_LOW = 7;
export const STAGNATION_MID = 14;
export const STAGNATION_HIGH = 30;

/**
 * Whole calendar days since the task was last touched (`updated_at`).
 * Returns 0 for missing/invalid timestamps or future dates (clock skew).
 */
export function getStagnationDays(
  updatedAt: string | undefined | null,
  now: Date = new Date()
): number {
  if (!updatedAt) return 0;
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return 0;
  const diffMs = now.getTime() - then;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 86400000);
}

/**
 * Stagnation level for a task.
 *
 * - Completed tasks never stagnate.
 * - Only Q1/Q2 (strategic) tasks are evaluated; everything else is "none".
 * - `pomos_done > 0` downgrades one level: real effort already went in, so it's
 *   "in progress but slow", not "forgotten".
 */
export function getStagnationLevel(task: Task, now: Date = new Date()): StagnationLevel {
  if (task.completed) return "none";
  if (task.quadrant !== "Q1" && task.quadrant !== "Q2") return "none";

  const days = getStagnationDays(task.updated_at, now);
  let level: StagnationLevel =
    days >= STAGNATION_HIGH ? "high" : days >= STAGNATION_MID ? "mid" : days >= STAGNATION_LOW ? "low" : "none";

  // Effort already invested → soften the emphasis by one notch (never below none).
  if (level !== "none" && (task.pomos_done ?? 0) > 0) {
    level = level === "high" ? "mid" : level === "mid" ? "low" : "none";
  }
  return level;
}

/** CSS color token for a stagnation level (drives the matrix age tag). */
export function getStagnationColor(level: StagnationLevel): string {
  switch (level) {
    case "high":
      return "var(--stagnation-high)"; // orange-red — long overdue strategic work
    case "mid":
      return "var(--stagnation-mid)"; // amber — needs attention
    case "low":
      return "var(--text-faint)"; // low-key gray — just a heads-up
    default:
      return "transparent";
  }
}

/** Compact matrix tag, e.g. "9d" or "⚠ 31d". Empty string when not stagnant. */
export function getStagnationTag(task: Task, now: Date = new Date()): string {
  const level = getStagnationLevel(task, now);
  if (level === "none") return "";
  const days = getStagnationDays(task.updated_at, now);
  return level === "high" ? `⚠ ${days}d` : `${days}d`;
}

/** Compact untouched label for planning lists, from i18n: "未动 · 18 天" / "Untouched · 18d". */
export function getUntouchedLabel(days: number, locale: Locale): string {
  return STRINGS[locale]["stagnation.untouched.compact"].replace("{n}", String(days));
}

/**
 * Q2 tasks that have been stagnant for ≥ MID days (untouched ≥ 14d, not
 * completed, no focus today). Used by the evening review summary.
 */
export function getStagnantQ2Tasks(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks.filter(
    (t) =>
      t.quadrant === "Q2" &&
      !t.completed &&
      getStagnationDays(t.updated_at, now) >= STAGNATION_MID
  );
}
