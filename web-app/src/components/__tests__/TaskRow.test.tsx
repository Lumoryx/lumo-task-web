import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TaskRow } from "../TaskRow";
import type { Task } from "@/types/task";

// Top-level mock functions so vi.mock (hoisted) can reference them
const mockComplete = vi.fn();
const mockRemove = vi.fn();

vi.mock("@/store/useTasksStore", () => ({
  useTasksStore: (sel: any) =>
    sel({ complete: mockComplete, remove: mockRemove }),
}));

vi.mock("@/store/usePeopleStore", () => ({
  usePeopleStore: (sel: any) => sel({ people: [], byId: () => undefined }),
}));

vi.mock("@/store/useAppStore", () => ({
  useAppStore: (sel: any) => sel({ locale: "en" }),
}));

const TASK: Task = {
  id: "t_test1",
  title: { en: "Test task", zh: "测试任务" },
  quadrant: "Q1",
  today: true,
  due: null,
  duration: 30,
  pomos_done: 0,
  pomos_total: 2,
  completed: false,
};

function renderRow(task = TASK) {
  return render(
    <MemoryRouter>
      <TaskRow task={task} />
    </MemoryRouter>
  );
}

describe("TaskRow", () => {
  it("renders the task title", () => {
    renderRow();
    expect(screen.getByText("Test task")).toBeInTheDocument();
  });

  it("complete button is present with accessible label", () => {
    renderRow();
    expect(screen.getByRole("button", { name: /complete/i })).toBeInTheDocument();
  });

  it("shows recurrence icon when task has a recurrence rule", () => {
    renderRow({ ...TASK, recurrence: "weekly" });
    expect(screen.getByLabelText(/weekly/i)).toBeInTheDocument();
  });

  it("does not show recurrence icon when recurrence is none", () => {
    renderRow({ ...TASK, recurrence: "none" });
    expect(screen.queryByLabelText(/daily|weekdays|weekly|monthly/i)).not.toBeInTheDocument();
  });

  it("does not show recurrence icon when recurrence is absent", () => {
    renderRow({ ...TASK });
    expect(screen.queryByLabelText(/daily|weekdays|weekly|monthly/i)).not.toBeInTheDocument();
  });

  it("complete button becomes disabled while request is in-flight", async () => {
    // Arrange: complete resolves after a tick
    let resolveComplete!: () => void;
    mockComplete.mockReturnValueOnce(
      new Promise<void>((res) => { resolveComplete = res; })
    );

    renderRow();
    const btn = screen.getByRole("button", { name: /complete/i });
    expect(btn).not.toBeDisabled();

    // Act: click
    fireEvent.click(btn);

    // Assert: disabled while in flight
    await waitFor(() => expect(btn).toBeDisabled());

    // Resolve and confirm it re-enables
    resolveComplete();
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
