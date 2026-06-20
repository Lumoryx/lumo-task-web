import { describe, it, expect, vi, afterEach } from "vitest";
import { fmtScheduledStart, fmtDuration, parseDueISO, isDueOverdue, isDueToday } from "@/lib/format";

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

describe("isDueOverdue", () => {
  afterEach(() => vi.useRealTimers());

  it("returns true for a date strictly before today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(isDueOverdue("2026-06-19")).toBe(true);
    expect(isDueOverdue("2026-01-01")).toBe(true);
  });

  it("returns false for today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(isDueOverdue("2026-06-20")).toBe(false);
  });

  it("returns false for a future date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(isDueOverdue("2026-06-21")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isDueOverdue(null)).toBe(false);
  });

  it("returns false for loose labels that can't be pinned", () => {
    expect(isDueOverdue("Fri")).toBe(false);
  });
});

describe("isDueToday", () => {
  afterEach(() => vi.useRealTimers());

  it("returns true when due is today's ISO date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(isDueToday("2026-06-20")).toBe(true);
  });

  it("returns true when due is 'today' keyword", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(isDueToday("today")).toBe(true);
  });

  it("returns false for yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(isDueToday("2026-06-19")).toBe(false);
  });

  it("returns false for tomorrow", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));
    expect(isDueToday("2026-06-21")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isDueToday(null)).toBe(false);
  });
});
