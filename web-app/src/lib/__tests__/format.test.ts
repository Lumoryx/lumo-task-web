import { describe, it, expect, vi, afterEach } from "vitest";
import { fmtScheduledStart, fmtDuration, parseDueISO, formatDue, isOverdue, isDueToday } from "@/lib/format";

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
  it("passes through ISO dates and rejects non-ISO values", () => {
    expect(parseDueISO("2026-06-10")).toBe("2026-06-10");
    expect(parseDueISO("Fri")).toBeNull();
    expect(parseDueISO(null)).toBeNull();
    expect(parseDueISO("today")).toBeNull();
  });
});

describe("formatDue", () => {
  afterEach(() => vi.useRealTimers());

  it("returns null for null input", () => {
    expect(formatDue(null, "en")).toBeNull();
    expect(formatDue(null, "zh")).toBeNull();
  });

  it("returns Today / 今天 for today's date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    expect(formatDue("2026-06-21", "en")).toBe("Today");
    expect(formatDue("2026-06-21", "zh")).toBe("今天");
  });

  it("formats a future ISO date in English", () => {
    expect(formatDue("2026-08-02", "en")).toBe("Aug 2");
  });

  it("formats a future ISO date in Chinese", () => {
    expect(formatDue("2026-08-02", "zh")).toBe("8月2日");
  });
});

describe("isOverdue", () => {
  afterEach(() => vi.useRealTimers());

  it("returns false for null", () => {
    expect(isOverdue(null)).toBe(false);
  });

  it("returns true for a past date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    expect(isOverdue("2026-06-20")).toBe(true);
    expect(isOverdue("2026-01-01")).toBe(true);
  });

  it("returns false for today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    expect(isOverdue("2026-06-21")).toBe(false);
  });

  it("returns false for a future date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    expect(isOverdue("2026-06-26")).toBe(false);
  });
});

describe("isDueToday", () => {
  afterEach(() => vi.useRealTimers());

  it("returns false for null", () => {
    expect(isDueToday(null)).toBe(false);
  });

  it("returns true for today's date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    expect(isDueToday("2026-06-21")).toBe(true);
  });

  it("returns false for yesterday and tomorrow", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    expect(isDueToday("2026-06-20")).toBe(false);
    expect(isDueToday("2026-06-22")).toBe(false);
  });
});
