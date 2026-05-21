import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { currentStreak, isCompletedToday, completionRate, longestStreak, toDateStr } from "../habits";
import type { Habit, HabitLog } from "@/types/task";

const DAILY_HABIT: Habit = {
  id: "h1",
  title: "Morning run",
  color: "green",
  frequency: "daily",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const WEEKDAY_HABIT: Habit = {
  id: "h2",
  title: "Read",
  color: "amber",
  frequency: "weekdays",
  createdAt: "2024-01-01T00:00:00.000Z",
};

function log(habitId: string, date: string): HabitLog {
  return { habitId, date, completedAt: `${date}T08:00:00.000Z` };
}

// Fix "today" to a known Tuesday (2026-05-19)
const FIXED_NOW = new Date("2026-05-19T10:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("toDateStr", () => {
  it("formats date correctly", () => {
    expect(toDateStr(new Date("2026-05-19T00:00:00"))).toBe("2026-05-19");
  });
});

describe("currentStreak", () => {
  it("returns 0 when no logs", () => {
    expect(currentStreak(DAILY_HABIT, [])).toBe(0);
  });

  it("returns 1 when only today is logged", () => {
    const logs = [log("h1", "2026-05-19")];
    expect(currentStreak(DAILY_HABIT, logs)).toBe(1);
  });

  it("counts consecutive days including today", () => {
    const logs = [
      log("h1", "2026-05-17"),
      log("h1", "2026-05-18"),
      log("h1", "2026-05-19"),
    ];
    expect(currentStreak(DAILY_HABIT, logs)).toBe(3);
  });

  it("breaks streak on gap (daily habit)", () => {
    const logs = [
      log("h1", "2026-05-16"),
      // gap on 17th
      log("h1", "2026-05-18"),
      log("h1", "2026-05-19"),
    ];
    expect(currentStreak(DAILY_HABIT, logs)).toBe(2);
  });

  it("counts weekday streak correctly, skipping weekend", () => {
    // Fixed date is Tuesday May 19. Weekend was Sat/Sun May 16/17.
    // Mon May 18 + Tue May 19 = streak of 2 (weekend is not scheduled)
    const logs = [
      log("h2", "2026-05-18"),
      log("h2", "2026-05-19"),
    ];
    expect(currentStreak(WEEKDAY_HABIT, logs)).toBe(2);
  });

  it("does not break streak when today is not yet completed (streak from yesterday)", () => {
    const logs = [
      log("h1", "2026-05-18"),
      // today not done yet
    ];
    // Streak counts yesterday but today (skipped) does not break it
    expect(currentStreak(DAILY_HABIT, logs)).toBe(1);
  });
});

describe("isCompletedToday", () => {
  it("returns false when no logs", () => {
    expect(isCompletedToday(DAILY_HABIT, [])).toBe(false);
  });

  it("returns true when today logged", () => {
    const logs = [log("h1", "2026-05-19")];
    expect(isCompletedToday(DAILY_HABIT, logs)).toBe(true);
  });

  it("returns false when only yesterday logged", () => {
    const logs = [log("h1", "2026-05-18")];
    expect(isCompletedToday(DAILY_HABIT, logs)).toBe(false);
  });
});

describe("completionRate", () => {
  it("returns 0 for no logs", () => {
    expect(completionRate(DAILY_HABIT, [], 7)).toBe(0);
  });

  it("returns 1.0 when all 7 days completed (daily)", () => {
    const logs = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(FIXED_NOW);
      d.setDate(d.getDate() - i);
      return log("h1", toDateStr(d));
    });
    expect(completionRate(DAILY_HABIT, logs, 7)).toBe(1);
  });

  it("handles partial completion", () => {
    const logs = [log("h1", "2026-05-19"), log("h1", "2026-05-18")];
    const rate = completionRate(DAILY_HABIT, logs, 7);
    expect(rate).toBeCloseTo(2 / 7);
  });
});

describe("longestStreak", () => {
  it("returns 0 for no logs", () => {
    expect(longestStreak(DAILY_HABIT, [])).toBe(0);
  });

  it("returns correct longest streak", () => {
    // 3 consecutive days, gap, 1 day
    const logs = [
      log("h1", "2026-05-12"),
      log("h1", "2026-05-13"),
      log("h1", "2026-05-14"),
      // gap 15
      log("h1", "2026-05-16"),
    ];
    expect(longestStreak(DAILY_HABIT, logs)).toBe(3);
  });
});
