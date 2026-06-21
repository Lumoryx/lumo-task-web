import { describe, it, expect, vi, afterEach } from "vitest";
import { fmtScheduledStart, fmtDuration, parseDueISO, getDueLabel, isOverdue, getDueColor } from "@/lib/format";

describe("fmtScheduledStart", () => {
  it("formats English with am/pm, dropping :00 minutes", () => {
    expect(fmtScheduledStart("2026-06-10T15:00:00", "en")).toBe("Jun 10 3pm");
    expect(fmtScheduledStart("2026-06-10T09:30:00", "en")).toBe("Jun 10 9:30am");
  });

  it("handles midnight and noon in English", () => {
    expect(fmtScheduledStart("2026-06-10T00:00:00", "en")).toBe("Jun 10 12am");
    expect(fmtScheduledStart("2026-06-10T12:00:00", "en")).toBe("Jun 10 12pm");
  });

  it("formats Chinese with 24-hour time", () => {
    expect(fmtScheduledStart("2026-06-10T15:00:00", "zh")).toBe("6月10日 15:00");
    expect(fmtScheduledStart("2026-06-10T09:05:00", "zh")).toBe("6月10日 09:05");
  });
});

describe("fmtDuration", () => {
  it("formats minutes-only and hour+minute in both locales", () => {
    expect(fmtDuration(45, "en")).toBe("45m");
    expect(fmtDuration(90, "en")).toBe("1h 30m");
    expect(fmtDuration(45, "zh")).toBe("45 分钟");
    expect(fmtDuration(90, "zh")).toBe("1 小时 30 分");
  });
});

describe("parseDueISO", () => {
  it("passes through strict dates and rejects loose labels", () => {
    expect(parseDueISO("2026-06-10")).toBe("2026-06-10");
    expect(parseDueISO("Fri")).toBeNull();
    expect(parseDueISO(null)).toBeNull();
  });
});

describe("getDueLabel", () => {
  it("formats ISO date in English", () => {
    expect(getDueLabel("2026-01-15", "en")).toBe("Jan 15");
    expect(getDueLabel("2026-06-05", "en")).toBe("Jun 5");
    expect(getDueLabel("2026-12-31", "en")).toBe("Dec 31");
  });

  it("formats ISO date in Chinese", () => {
    expect(getDueLabel("2026-01-15", "zh")).toBe("1月15日");
    expect(getDueLabel("2026-06-05", "zh")).toBe("6月5日");
  });

  it("returns null for null input", () => {
    expect(getDueLabel(null, "en")).toBeNull();
    expect(getDueLabel(null, "zh")).toBeNull();
  });

  it("handles legacy keyword 'today' for backward compat", () => {
    expect(getDueLabel("today", "en")).toBe("Today");
    expect(getDueLabel("today", "zh")).toBe("今天");
  });
});

describe("isOverdue", () => {
  it("returns true for a date clearly in the past", () => {
    expect(isOverdue("2020-01-01")).toBe(true);
  });

  it("returns false for a date clearly in the future", () => {
    expect(isOverdue("2099-12-31")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("returns false for non-ISO strings", () => {
    expect(isOverdue("today")).toBe(false);
    expect(isOverdue("next wk")).toBe(false);
  });
});

describe("getDueColor", () => {
  afterEach(() => vi.useRealTimers());

  it("returns status-urgent for a past date", () => {
    expect(getDueColor("2020-01-01")).toBe("var(--status-urgent)");
  });

  it("returns accent-primary for today's date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    expect(getDueColor("2026-06-21")).toBe("var(--accent-primary)");
    vi.useRealTimers();
  });

  it("returns text-faint for a future date", () => {
    expect(getDueColor("2099-12-31")).toBe("var(--text-faint)");
  });

  it("returns text-faint for null", () => {
    expect(getDueColor(null)).toBe("var(--text-faint)");
  });
});
