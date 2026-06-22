import { describe, it, expect } from "vitest";
import {
  getStagnationDays,
  getStagnationLevel,
  getStagnationTag,
  getUntouchedLabel,
  getStagnantQ2Tasks,
} from "@/lib/stagnation";
import type { Task } from "@/types/task";

const NOW = new Date("2026-06-22T12:00:00Z");

/** Build a Task whose updated_at is `daysAgo` days before NOW. */
function makeTask(daysAgo: number, over: Partial<Task> = {}): Task {
  const updated = new Date(NOW.getTime() - daysAgo * 86400000).toISOString();
  return {
    id: "t" + daysAgo,
    title: { en: "x", zh: "x" },
    quadrant: "Q2",
    today: false,
    week_focus: false,
    due: null,
    duration: 0,
    pomos_done: 0,
    pomos_total: 0,
    completed: false,
    updated_at: updated,
    ...over,
  } as Task;
}

describe("getStagnationDays", () => {
  it("counts whole days since updated_at", () => {
    expect(getStagnationDays(makeTask(9).updated_at, NOW)).toBe(9);
    expect(getStagnationDays(makeTask(0).updated_at, NOW)).toBe(0);
  });

  it("returns 0 for missing, invalid, or future timestamps", () => {
    expect(getStagnationDays(undefined, NOW)).toBe(0);
    expect(getStagnationDays("not-a-date", NOW)).toBe(0);
    expect(getStagnationDays(new Date(NOW.getTime() + 86400000).toISOString(), NOW)).toBe(0);
  });
});

describe("getStagnationLevel", () => {
  it("tiers by age: none < 7 ≤ low < 14 ≤ mid < 30 ≤ high", () => {
    expect(getStagnationLevel(makeTask(6), NOW)).toBe("none");
    expect(getStagnationLevel(makeTask(7), NOW)).toBe("low");
    expect(getStagnationLevel(makeTask(13), NOW)).toBe("low");
    expect(getStagnationLevel(makeTask(14), NOW)).toBe("mid");
    expect(getStagnationLevel(makeTask(29), NOW)).toBe("mid");
    expect(getStagnationLevel(makeTask(30), NOW)).toBe("high");
  });

  it("never stagnates completed tasks", () => {
    expect(getStagnationLevel(makeTask(40, { completed: true }), NOW)).toBe("none");
  });

  it("only evaluates Q1/Q2 tasks", () => {
    expect(getStagnationLevel(makeTask(40, { quadrant: "Q3" }), NOW)).toBe("none");
    expect(getStagnationLevel(makeTask(40, { quadrant: "Q1" }), NOW)).toBe("high");
  });

  it("downgrades one level when effort was already invested (pomos_done > 0)", () => {
    // 30d high → mid once there is a focus session on record
    expect(getStagnationLevel(makeTask(30, { pomos_done: 2 }), NOW)).toBe("mid");
    // 7d low → none (still distinguishable from a forgotten task)
    expect(getStagnationLevel(makeTask(7, { pomos_done: 1 }), NOW)).toBe("none");
  });
});

describe("getStagnationTag", () => {
  it("is empty under 7 days and shows day count with ⚠ at the high tier", () => {
    expect(getStagnationTag(makeTask(3), NOW)).toBe("");
    expect(getStagnationTag(makeTask(9), NOW)).toBe("9d");
    expect(getStagnationTag(makeTask(31), NOW)).toBe("⚠ 31d");
  });
});

describe("getUntouchedLabel", () => {
  it("renders bilingual untouched labels", () => {
    expect(getUntouchedLabel(18, "zh")).toBe("未动 · 18 天");
    expect(getUntouchedLabel(18, "en")).toBe("Untouched · 18d");
  });
});

describe("getStagnantQ2Tasks", () => {
  it("returns only Q2 tasks untouched ≥ 14 days", () => {
    const tasks = [
      makeTask(20),                              // stagnant Q2 ✓
      makeTask(16),                              // stagnant Q2 ✓
      makeTask(10),                              // too recent ✗
      makeTask(40, { quadrant: "Q1" }),          // Q1 ✗
      makeTask(40, { completed: true }),         // completed ✗
    ];
    expect(getStagnantQ2Tasks(tasks, NOW)).toHaveLength(2);
  });
});
