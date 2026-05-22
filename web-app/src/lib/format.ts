import type { Locale } from "@/types/task";

/** Returns YYYY-MM-DD using local time (avoids UTC offset issues from toISOString). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Resolves a task's loose `due` string to a strict ISO date (YYYY-MM-DD),
 * or null if it can't be pinned to a specific calendar date.
 * Handles: YYYY-MM-DD pass-through, "today" keyword.
 * Loose labels like "Fri" / "next wk" return null (can't be pinned).
 */
export function parseDueISO(due: string | null): string | null {
  if (!due) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return due;
  if (due === "today") return toISODate(new Date());
  return null;
}

export function fmtDuration(mins: number, locale: Locale): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (locale === "zh") {
    if (h > 0 && m > 0) return `${h} 小时 ${m} 分`;
    if (h > 0) return `${h} 小时`;
    return `${m} 分钟`;
  }
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function fmtMMSS(secs: number): string {
  const m = Math.max(0, Math.floor(secs / 60));
  const s = Math.max(0, Math.floor(secs % 60));
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getDueLabel(due: string | null, locale: Locale): string | null {
  if (!due) return null;
  const map: Record<Locale, Record<string, string>> = {
    en: { today: "Today", Fri: "Fri", "next wk": "Next wk" },
    zh: { today: "今天", Fri: "周五", "next wk": "下周" },
  };
  return map[locale][due] ?? due;
}
