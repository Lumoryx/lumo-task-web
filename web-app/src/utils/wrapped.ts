import type { CompletedEntry } from "@/types/task";
import type { QuadrantCount } from "@/utils/stats";

export interface PrevWeekStats {
  tasksCompleted: number;
  focusMinutes: number;
  q1Tasks: number;
  peakDayIndex: number | null;
  byDay: number[];
  weekLabel: string;
  quadrantBreakdown: QuadrantCount[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function wrappedKey(userId: string): string {
  const now = new Date();
  const prevMonday = new Date(now);
  prevMonday.setDate(prevMonday.getDate() - 7);
  return `lumo.wrapped.${userId}.${getISOWeekKey(prevMonday)}`;
}

export function shouldShowWrapped(userId: string): boolean {
  if (new Date().getDay() !== 1) return false;
  return !localStorage.getItem(wrappedKey(userId));
}

export function markWrappedShown(userId: string): void {
  localStorage.setItem(wrappedKey(userId), "1");
}

export function computePrevWeekStats(entries: CompletedEntry[]): PrevWeekStats {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const prevWeekStart = new Date(thisWeekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(thisWeekStart);
  prevWeekEnd.setMilliseconds(-1);

  const weekEntries = entries.filter((e) => {
    if (!e.completedAt) return false;
    const d = new Date(e.completedAt);
    return d >= prevWeekStart && d <= prevWeekEnd;
  });

  const byDay = [0, 0, 0, 0, 0, 0, 0];
  for (const e of weekEntries) {
    if (e.completedAt) byDay[new Date(e.completedAt).getDay()]++;
  }

  const maxDay = Math.max(...byDay);
  const peakDayIndex = maxDay > 0 ? byDay.indexOf(maxDay) : null;

  const startLabel = prevWeekStart.toLocaleDateString("en", { month: "short", day: "numeric" });
  const endLabel = new Date(prevWeekEnd).toLocaleDateString("en", { month: "short", day: "numeric" });

  const quadrantOrder = ["Q1", "Q2", "Q3", "Q4", "unclassified"] as const;
  const counts: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, unclassified: 0 };
  for (const e of weekEntries) {
    const q = e.quadrant ?? "unclassified";
    counts[q] = (counts[q] ?? 0) + 1;
  }
  const total = weekEntries.length;
  const quadrantBreakdown: QuadrantCount[] = quadrantOrder.map((q) => ({
    quadrant: q,
    count: counts[q],
    percent: total > 0 ? Math.round((counts[q] / total) * 100) : 0,
  }));

  return {
    tasksCompleted: weekEntries.length,
    focusMinutes: weekEntries.reduce((s, e) => s + (e.duration ?? 0), 0),
    q1Tasks: weekEntries.filter((e) => e.quadrant === "Q1").length,
    peakDayIndex,
    byDay,
    weekLabel: `${startLabel} – ${endLabel}`,
    quadrantBreakdown,
  };
}
