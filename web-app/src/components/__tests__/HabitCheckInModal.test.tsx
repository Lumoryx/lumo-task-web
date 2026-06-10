import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HabitCheckInModal } from "../HabitCheckInModal";
import type { Habit } from "@/types/task";

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

const HABIT: Habit = {
  id: "h1",
  title: "Morning run",
  color: "green",
  frequency: "daily",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const HABIT_WITH_EMOJI: Habit = { ...HABIT, emoji: "🏃" };

describe("HabitCheckInModal", () => {
  it("renders habit title and confirm button", () => {
    render(
      <HabitCheckInModal habit={HABIT} onConfirm={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText("Morning run")).toBeInTheDocument();
    expect(screen.getByText("habit.checkin.btn")).toBeInTheDocument();
    expect(screen.getByText("habit.btn.cancel")).toBeInTheDocument();
  });

  it("renders emoji when habit has one", () => {
    render(
      <HabitCheckInModal habit={HABIT_WITH_EMOJI} onConfirm={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText("🏃")).toBeInTheDocument();
  });

  it("calls onConfirm and onClose when confirm button clicked", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <HabitCheckInModal habit={HABIT} onConfirm={onConfirm} onClose={onClose} />
    );
    fireEvent.click(screen.getByText("habit.checkin.btn"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button clicked", () => {
    const onClose = vi.fn();
    render(
      <HabitCheckInModal habit={HABIT} onConfirm={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getByText("habit.btn.cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <HabitCheckInModal habit={HABIT} onConfirm={vi.fn()} onClose={onClose} />
    );
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("prevents double-confirm: confirm button disabled after first click", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <HabitCheckInModal habit={HABIT} onConfirm={onConfirm} onClose={onClose} />
    );
    const btn = screen.getByText("habit.checkin.btn");
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  describe("Escape key", () => {
    beforeEach(() => {
      render(
        <HabitCheckInModal habit={HABIT} onConfirm={vi.fn()} onClose={vi.fn()} />
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("calls onClose on Escape keydown", () => {
      const onClose = vi.fn();
      render(
        <HabitCheckInModal habit={HABIT} onConfirm={vi.fn()} onClose={onClose} />
      );
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
