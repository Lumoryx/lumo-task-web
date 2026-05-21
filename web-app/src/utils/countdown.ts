import type { CountdownEvent } from "@/types/task";

function clampDate(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

export function daysUntil(dateStr: string, repeat: CountdownEvent["repeat"]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");

  if (repeat === "yearly") {
    const thisYear = clampDate(today.getFullYear(), target.getMonth(), target.getDate());
    if (thisYear < today) {
      const nextYear = clampDate(today.getFullYear() + 1, target.getMonth(), target.getDate());
      return Math.round((nextYear.getTime() - today.getTime()) / 86_400_000);
    }
    return Math.round((thisYear.getTime() - today.getTime()) / 86_400_000);
  }

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function fmtDate(dateStr: string, repeat: CountdownEvent["repeat"], locale: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (repeat === "none") opts.year = "numeric";
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", opts);
}
