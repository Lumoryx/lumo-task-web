import type { Locale } from "@/types/task";

/** Returns YYYY-MM-DD using local time (avoids UTC offset issues from toISOString). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Returns the ISO date string unchanged if it matches YYYY-MM-DD, else null.
 * All due dates stored after the migration are ISO format — this is a pass-through validator.
 */
export function parseDueISO(due: string | null): string | null {
  if (!due) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return due;
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

/** Formats an ISO due date (YYYY-MM-DD) into a locale-aware display string. */
export function formatDue(due: string | null, locale: Locale): string | null {
  if (!due) return null;
  const today = toISODate(new Date());
  if (due === today) return locale === "zh" ? "今天" : "Today";
  const d = new Date(due + "T00:00:00");
  if (locale === "zh") return `${d.getMonth() + 1}月${d.getDate()}日`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** True when the ISO due date is strictly before today (overdue). */
export function isOverdue(due: string | null): boolean {
  if (!due) return false;
  return due < toISODate(new Date());
}

/** True when the ISO due date is today. */
export function isDueToday(due: string | null): boolean {
  if (!due) return false;
  return due === toISODate(new Date());
}

/** @deprecated Use formatDue — kept for CalendarView compat */
export function getDueLabel(due: string | null, locale: Locale): string | null {
  return formatDue(due, locale);
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
