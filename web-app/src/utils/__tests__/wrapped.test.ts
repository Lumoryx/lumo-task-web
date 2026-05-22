import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getISOWeekKey, shouldShowWrapped, markWrappedShown } from "../wrapped";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("getISOWeekKey", () => {
  it("returns correct key for a known Monday", () => {
    // 2024-01-08 is Monday of ISO Week 2
    expect(getISOWeekKey(new Date("2024-01-08"))).toBe("2024-W02");
  });

  it("returns correct key for a Sunday within the same ISO week", () => {
    // 2024-01-14 is Sunday of ISO Week 2
    expect(getISOWeekKey(new Date("2024-01-14"))).toBe("2024-W02");
  });

  it("handles year-boundary week correctly", () => {
    // 2024-01-01 is ISO Week 1 of 2024
    expect(getISOWeekKey(new Date("2024-01-01"))).toBe("2024-W01");
  });
});

describe("shouldShowWrapped", () => {
  it("returns false on Tuesday", () => {
    vi.setSystemTime(new Date("2024-01-09T10:00:00")); // Tuesday
    expect(shouldShowWrapped("u1")).toBe(false);
  });

  it("returns false on Wednesday", () => {
    vi.setSystemTime(new Date("2024-01-10T10:00:00")); // Wednesday
    expect(shouldShowWrapped("u1")).toBe(false);
  });

  it("returns true on Monday if not shown this week", () => {
    vi.setSystemTime(new Date("2024-01-08T10:00:00")); // Monday
    expect(shouldShowWrapped("u1")).toBe(true);
  });

  it("returns false on Monday after being shown", () => {
    vi.setSystemTime(new Date("2024-01-08T10:00:00")); // Monday
    markWrappedShown("u1");
    expect(shouldShowWrapped("u1")).toBe(false);
  });

  it("is per-user (different users get independent state)", () => {
    vi.setSystemTime(new Date("2024-01-08T10:00:00"));
    markWrappedShown("u1");
    expect(shouldShowWrapped("u2")).toBe(true);
  });
});

describe("markWrappedShown", () => {
  it("persists across calls within the same week", () => {
    vi.setSystemTime(new Date("2024-01-08T10:00:00"));
    markWrappedShown("u1");
    vi.setSystemTime(new Date("2024-01-08T14:00:00")); // later same day
    expect(shouldShowWrapped("u1")).toBe(false);
  });
});
