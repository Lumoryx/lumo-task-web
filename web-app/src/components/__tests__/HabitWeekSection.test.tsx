import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HabitWeekSection } from "../HabitWeekSection";
import type { Habit, HabitLog } from "@/types/task";

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

// Week: Sun 2026-06-15 → Sat 2026-06-21
const WEEK_START = new Date("2026-06-15T00:00:00");
const WEEK_END = new Date("2026-06-21T00:00:00");

const FIXED_NOW = new Date("2026-06-19T10:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "h1",
    title: "Morning Run",
    emoji: "🏃",
    color: "green",
    frequency: "daily",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeLog(habitId: string, date: string): HabitLog {
  return { habitId, date, completedAt: `${date}T08:00:00.000Z` };
}

describe("HabitWeekSection", () => {
  it("renders nothing when habits array is empty", () => {
    const { container } = render(
      <HabitWeekSection habits={[]} logs={[]} weekStart={WEEK_START} weekEnd={WEEK_END} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the section heading when habits exist", () => {
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={[]}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("stats.habits.section")).toBeInTheDocument();
  });

  it("renders habit emoji and title", () => {
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={[]}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("🏃")).toBeInTheDocument();
    expect(screen.getByText("Morning Run")).toBeInTheDocument();
  });

  it("shows correct done count and target count for a daily habit", () => {
    const logs = [
      makeLog("h1", "2026-06-15"),
      makeLog("h1", "2026-06-16"),
      makeLog("h1", "2026-06-17"),
    ];
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={logs}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 7")).toBeInTheDocument();
  });

  it("counts only logs within the week range", () => {
    const logs = [
      makeLog("h1", "2026-06-14"), // before weekStart — excluded
      makeLog("h1", "2026-06-15"), // weekStart — included
      makeLog("h1", "2026-06-21"), // weekEnd — included
      makeLog("h1", "2026-06-22"), // after weekEnd — excluded
    ];
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={logs}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows 'On Track' status when completion rate ≥ 85%", () => {
    // 6/7 ≈ 85.7% → On Track
    const logs = ["2026-06-15","2026-06-16","2026-06-17","2026-06-18","2026-06-19","2026-06-20"].map(
      (d) => makeLog("h1", d),
    );
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={logs}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("stats.habits.ontrack")).toBeInTheDocument();
  });

  it("shows 'Keep Going' status when completion rate is 50–84%", () => {
    // 4/7 ≈ 57% → Keep Going
    const logs = ["2026-06-15","2026-06-16","2026-06-17","2026-06-18"].map(
      (d) => makeLog("h1", d),
    );
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={logs}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("stats.habits.keepgoing")).toBeInTheDocument();
  });

  it("shows 'Needs Attention' status when completion rate < 50%", () => {
    // 2/7 ≈ 28% → Needs Attention
    const logs = ["2026-06-15","2026-06-16"].map((d) => makeLog("h1", d));
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={logs}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("stats.habits.needsattention")).toBeInTheDocument();
  });

  it("shows 'Needs Attention' when no logs", () => {
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={[]}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("stats.habits.needsattention")).toBeInTheDocument();
  });

  it("renders streak when > 0", () => {
    const logs = [
      makeLog("h1", "2026-06-18"),
      makeLog("h1", "2026-06-19"),
    ];
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={logs}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText(/stats\.habits\.streak/)).toBeInTheDocument();
  });

  it("does not render streak when streak is 0", () => {
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={[]}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.queryByText(/stats\.habits\.streak/)).not.toBeInTheDocument();
  });

  it("computes correct target for times_per_week habit", () => {
    const habit = makeHabit({ frequency: "times_per_week", frequencyTimes: 4 });
    render(
      <HabitWeekSection
        habits={[habit]}
        logs={[]}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("/ 4")).toBeInTheDocument();
  });

  it("computes correct target for weekdays habit", () => {
    const habit = makeHabit({ frequency: "weekdays" });
    render(
      <HabitWeekSection
        habits={[habit]}
        logs={[]}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("/ 5")).toBeInTheDocument();
  });

  it("renders multiple habits", () => {
    const habits = [
      makeHabit({ id: "h1", title: "Run" }),
      makeHabit({ id: "h2", title: "Read", emoji: "📚" }),
    ];
    render(
      <HabitWeekSection
        habits={habits}
        logs={[]}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    expect(screen.getByText("Run")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
  });

  it("renders a progressbar with correct aria-valuenow", () => {
    // 7/7 = 100%
    const logs = ["2026-06-15","2026-06-16","2026-06-17","2026-06-18","2026-06-19","2026-06-20","2026-06-21"].map(
      (d) => makeLog("h1", d),
    );
    render(
      <HabitWeekSection
        habits={[makeHabit()]}
        logs={logs}
        weekStart={WEEK_START}
        weekEnd={WEEK_END}
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });
});
