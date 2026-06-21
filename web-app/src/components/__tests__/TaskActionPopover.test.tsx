import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TaskActionPopover } from "../TaskActionPopover";
import type { Task } from "@/types/task";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockComplete = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/store/useTasksStore", () => ({
  useTasksStore: (sel: any) => sel({ complete: mockComplete, update: mockUpdate }),
}));

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TASK: Task = {
  id: "t1",
  title: { en: "Test Task", zh: "测试" },
  quadrant: "Q1",
  today: false,
  week_focus: false,
  due: null,
  duration: 30,
  pomos_done: 0,
  pomos_total: 2,
  completed: false,
};

const ANCHOR: DOMRect = {
  top: 100, bottom: 130, left: 50, right: 200,
  width: 150, height: 30, x: 50, y: 100,
  toJSON: () => ({}),
};

function setup(task = TASK) {
  const onClose = vi.fn();
  const onEdit = vi.fn();
  render(
    <MemoryRouter>
      <TaskActionPopover task={task} anchor={ANCHOR} onClose={onClose} onEdit={onEdit} />
    </MemoryRouter>
  );
  return { onClose, onEdit };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TaskActionPopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComplete.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
  });

  it("renders complete and today buttons", () => {
    setup();
    expect(screen.getByText("focus.complete")).toBeInTheDocument();
    expect(screen.getByText("popover.today.add")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const { onClose } = setup();
    const backdrop = document.querySelector(".fixed.inset-0")!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("disables action buttons while complete is in-flight and calls onClose after", async () => {
    let resolve!: () => void;
    mockComplete.mockReturnValueOnce(new Promise<void>((res) => { resolve = res; }));

    const { onClose } = setup();
    const completeBtn = screen.getByText("focus.complete").closest("button")!;

    fireEvent.click(completeBtn);
    await waitFor(() => expect(completeBtn).toBeDisabled());

    resolve();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("disables action buttons while toggle-today is in-flight and calls onClose after", async () => {
    let resolve!: () => void;
    mockUpdate.mockReturnValueOnce(new Promise<void>((res) => { resolve = res; }));

    const { onClose } = setup();
    const todayBtn = screen.getByText("popover.today.add").closest("button")!;

    fireEvent.click(todayBtn);
    await waitFor(() => expect(todayBtn).toBeDisabled());

    resolve();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows 'remove from today' label when task.today is true", () => {
    setup({ ...TASK, today: true });
    expect(screen.getByText("popover.today.remove")).toBeInTheDocument();
  });
});
