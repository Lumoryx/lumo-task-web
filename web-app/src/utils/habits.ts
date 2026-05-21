import type { Habit, HabitLog } from "@/types/task";

/** Returns YYYY-MM-DD for a given Date */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns the set of dates on which a habit was completed */
function completedDates(logs: HabitLog[], habitId: string): Set<string> {
  return new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.date));
}

/** Whether today is a scheduled day for this habit */
export function isScheduledToday(habit: Habit): boolean {
  const day = new Date().getDay(); // 0=Sun, 6=Sat
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekdays") return day >= 1 && day <= 5;
  if (habit.frequency === "weekly") return day === 1; // Monday anchor
  return false;
}

/**
 * Compute the current streak (consecutive scheduled days with a completion log).
 * "Today" is included only if already completed.
 */
export function currentStreak(habit: Habit, logs: HabitLog[]): number {
  const done = completedDates(logs, habit.id);
  let streak = 0;
  const today = new Date();

  for (let i = 0; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toDateStr(d);
    const isScheduled = isScheduledForDate(habit, d);

    if (!isScheduled) continue;

    if (done.has(dateStr)) {
      streak++;
    } else {
      // Allow missing today (not yet done) only on the first iteration
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

/** Whether a habit is scheduled on a specific date */
function isScheduledForDate(habit: Habit, date: Date): boolean {
  const day = date.getDay();
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekdays") return day >= 1 && day <= 5;
  if (habit.frequency === "weekly") return day === 1;
  return false;
}

/** Is this habit completed today? */
export function isCompletedToday(habit: Habit, logs: HabitLog[]): boolean {
  const today = toDateStr(new Date());
  return logs.some((l) => l.habitId === habit.id && l.date === today);
}

/**
 * Get the completion rate over the past N days (only scheduled days counted).
 * Returns a value 0–1.
 */
export function completionRate(habit: Habit, logs: HabitLog[], days = 30): number {
  const done = completedDates(logs, habit.id);
  const today = new Date();
  let scheduled = 0;
  let completed = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (!isScheduledForDate(habit, d)) continue;
    scheduled++;
    if (done.has(toDateStr(d))) completed++;
  }

  return scheduled === 0 ? 0 : completed / scheduled;
}

/**
 * Longest streak ever for a habit.
 */
export function longestStreak(habit: Habit, logs: HabitLog[]): number {
  const done = completedDates(logs, habit.id);
  if (done.size === 0) return 0;

  // Sort all done dates ascending
  const sorted = [...done].sort();
  const today = new Date();

  let best = 0;
  let current = 0;
  let lastScheduled: Date | null = null;

  for (let i = 365; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (!isScheduledForDate(habit, d)) continue;

    const dateStr = toDateStr(d);
    if (done.has(dateStr)) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
    lastScheduled = d;
  }

  void sorted; // used indirectly
  void lastScheduled;
  return best;
}
