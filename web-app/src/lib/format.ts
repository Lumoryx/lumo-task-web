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

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

export function getDueLabel(due: string | null, locale: Locale): string | null {
  if (!due) return null;

  // Strict ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    const today = toISODate(new Date());
    if (due === today) return locale === "zh" ? "今天" : "Today";
    const month = parseInt(due.slice(5, 7), 10);
    const day = parseInt(due.slice(8, 10), 10);
    return locale === "zh" ? `${month}月${day}日` : `${MONTHS_EN[month - 1]} ${day}`;
  }

  // Legacy keyword fallback (for backward-compat with pre-migration data)
  const legacyEn: Record<string, string> = { today: "Today", Fri: "Fri", "next wk": "Next wk" };
  const legacyZh: Record<string, string> = { today: "今天", Fri: "周五", "next wk": "下周" };
  return (locale === "zh" ? legacyZh : legacyEn)[due] ?? due;
}

/** Returns true when the due date is strictly before today (string-comparable ISO). */
export function isOverdue(due: string | null): boolean {
  if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return false;
  return due < toISODate(new Date());
}

/** Returns a CSS variable token appropriate for the given due date state. */
export function getDueColor(due: string | null): string {
  if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return "var(--text-faint)";
  const today = toISODate(new Date());
  if (due < today) return "var(--status-urgent)";
  if (due === today) return "var(--accent-primary)";
  return "var(--text-faint)";
}

/** Formats a scheduled_start ISO timestamp as a short date + time, e.g. "Jun 10 3pm" / "6月10日 15:00". */
export function fmtScheduledStart(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  if (locale === "zh") {
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${timeStr}`;
  }
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const suffix = h >= 12 ? "pm" : "am";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const timeStr = m === 0 ? `${dh}${suffix}` : `${dh}:${String(m).padStart(2, "0")}${suffix}`;
  return `${dateStr} ${timeStr}`;
}
