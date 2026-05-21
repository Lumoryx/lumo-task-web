import type { CompletedEntry } from "@/types/task";

export interface WeekStats {
  tasksCompleted: number;
  focusMinutes: number;
  q1Tasks: number;
  peakHour: number | null;
  byDay: number[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  weekStart: Date;
  weekEnd: Date;
}

export interface AllTimeStats {
  tasksCompleted: number;
  focusMinutes: number;
  currentStreak: number;
  bestStreak: number;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeWeekStats(entries: CompletedEntry[]): WeekStats {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekEntries = entries.filter((e) => {
    if (!e.completedAt) return false;
    const d = new Date(e.completedAt);
    return d >= weekStart && d <= new Date(weekEnd.getTime() + 86400000);
  });

  const byDay = [0, 0, 0, 0, 0, 0, 0];
  const hourCounts: number[] = new Array(24).fill(0);

  for (const e of weekEntries) {
    if (!e.completedAt) continue;
    const d = new Date(e.completedAt);
    byDay[d.getDay()]++;
    hourCounts[d.getHours()]++;
  }

  const maxHourCount = Math.max(...hourCounts);
  const peakHour = maxHourCount > 0 ? hourCounts.indexOf(maxHourCount) : null;

  return {
    tasksCompleted: weekEntries.length,
    focusMinutes: weekEntries.reduce((s, e) => s + (e.duration ?? 0), 0),
    q1Tasks: weekEntries.filter((e) => e.quadrant === "Q1").length,
    peakHour,
    byDay,
    weekStart,
    weekEnd,
  };
}

export function computeAllTimeStats(entries: CompletedEntry[]): AllTimeStats {
  if (entries.length === 0) {
    return { tasksCompleted: 0, focusMinutes: 0, currentStreak: 0, bestStreak: 0 };
  }

  const doneByDay = new Set(
    entries
      .filter((e) => e.completedAt)
      .map((e) => toDateStr(new Date(e.completedAt!)))
  );

  // Compute current streak (consecutive days ending today/yesterday)
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (doneByDay.has(toDateStr(d))) {
      currentStreak++;
    } else if (i === 0) {
      // today not done yet, check yesterday
      continue;
    } else {
      break;
    }
  }

  // Compute best streak
  const sortedDays = [...doneByDay].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of sortedDays) {
    const d = new Date(day);
    if (prev) {
      const diff = (d.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        run++;
      } else {
        run = 1;
      }
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }

  return {
    tasksCompleted: entries.length,
    focusMinutes: entries.reduce((s, e) => s + (e.duration ?? 0), 0),
    currentStreak,
    bestStreak: best,
  };
}

export function fmtHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}
