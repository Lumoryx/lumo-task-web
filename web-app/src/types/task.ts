/**
 * Core domain types.
 *
 * Mirrors the shape that the mock API returns. Keep in sync with
 * `src/mocks/tasks.ts`. When wiring a real backend, change the
 * implementation of `src/api/client.ts` but keep these types stable.
 */

export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4" | "unclassified";

export type Locale = "en" | "zh";

/** A localized string that resolves on read via i18n helpers. */
export interface LocalizedString {
  en: string;
  zh?: string;
}

export interface Task {
  id: string;
  title: LocalizedString;
  desc?: LocalizedString;
  quadrant: Quadrant;
  /** Whether the task is included in today's plan. */
  today: boolean;
  /** ISO-ish loose due descriptor — e.g. "today", "Fri", "next wk", "Aug 14". */
  due: string | null;
  /** Estimated minutes. */
  duration: number;
  pomos_done: number;
  pomos_total: number;
  /** Conviction score 0..1, used by the Today recommendation card. */
  conviction?: number;
  /** Lumo's suggested next step. */
  next_step?: LocalizedString;
  /** Why Lumo deprioritized other items in favor of this one. */
  reason?: LocalizedString;
  /** AI suggested quadrant (used when `quadrant === "unclassified"`). */
  ai_suggest?: Quadrant;
  /** Done-state. */
  completed?: boolean;
  /** Counter-recommendations to be transparent about what's NOT being shown. */
  not_now?: Array<{ id: string; reason: LocalizedString }>;
}

export interface CompletedEntry {
  id: string;
  title: LocalizedString;
  /** Actual minutes spent (may differ from estimate). */
  duration: number;
  /** ISO timestamp when the focus session started. */
  startedAt?: string;
  /** ISO timestamp when the task was marked complete. */
  completedAt?: string;
  /** Quadrant of the source task, for the timeline chip. */
  quadrant?: Quadrant;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Initials for avatar. */
  initials: string;
  /** Whether the account is local-only (no cloud sync). */
  local: boolean;
  /** Subscription tier. */
  plan?: "free" | "pro";
  /** Renewal date for paid plans. */
  renewsAt?: string;
  /** Aggregate counters surfaced on the account page. */
  stats?: {
    tasks: number;
    pomodoros: number;
    syncOK: boolean;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
