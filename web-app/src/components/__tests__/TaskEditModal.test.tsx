import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TaskEditModal } from "../TaskEditModal";
import type { Task } from "@/types/task";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock("@/store/useTasksStore", () => ({
  useTasksStore: (sel: any) => sel({ update: mockUpdate, remove: mockRemove }),
}));

vi.mock("@/store/usePeopleStore", () => ({
  usePeopleStore: (sel: any) => sel({ people: [] }),
}));

vi.mock("@/store/useAppStore", () => ({
  useAppStore: (sel: any) => sel({ locale: "en" }),
}));

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TASK: Task = {
  id: "t1",
  title: { en: "Buy groceries", zh: "买菜" },
  quadrant: "Q2",
  today: false,
  due: null,
  duration: 30,
  pomos_done: 0,
  pomos_total: 2,
  completed: false,
};

function setup(task = TASK) {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <TaskEditModal task={task} onClose={onClose} />
    </MemoryRouter>
  );
  return { onClose };
}

function getSaveBtn() {
  return screen.getByText("edit.save").closest("button")!;
}

function getTitleInput() {
  return screen.getByDisplayValue("Buy groceries") as HTMLInputElement;
}

function getDateInput() {
  return document.querySelector('input[type="date"]') as HTMLInputElement;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TaskEditModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockRemove.mockResolvedValue(undefined);
  });

  it("pre-fills the title from the task prop", () => {
    setup();
    expect(getTitleInput().value).toBe("Buy groceries");
  });

  it("disables save button when title is cleared", () => {
    setup();
    fireEvent.change(getTitleInput(), { target: { value: "" } });
    expect(getSaveBtn()).toBeDisabled();
  });

  it("disables save button while update is in-flight", async () => {
    let resolve!: () => void;
    mockUpdate.mockReturnValueOnce(new Promise<void>((res) => { resolve = res; }));

    setup();
    fireEvent.click(getSaveBtn());
    await waitFor(() => expect(getSaveBtn()).toBeDisabled());

    resolve();
    await waitFor(() => expect(getSaveBtn()).not.toBeDisabled());
  });

  it("calls onClose after successful save", async () => {
    const { onClose } = setup();
    fireEvent.click(getSaveBtn());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("calls onClose when Escape is pressed", () => {
    const { onClose } = setup();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("initializes date input to empty when task has no due date", () => {
    setup();
    expect(getDateInput().value).toBe("");
  });

  it("pre-fills ISO due date from task prop", () => {
    const task: Task = { ...TASK, due: "2026-08-15" };
    setup(task);
    expect(getDateInput().value).toBe("2026-08-15");
  });

  it("sends due as null when task has no due date and none is selected", async () => {
    setup();
    fireEvent.click(getSaveBtn());
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        "t1",
        expect.objectContaining({ due: null })
      )
    );
  });

  it("sends the selected ISO due date on save", async () => {
    setup();
    fireEvent.change(getDateInput(), { target: { value: "2026-09-01" } });
    fireEvent.click(getSaveBtn());
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        "t1",
        expect.objectContaining({ due: "2026-09-01" })
      )
    );
  });

  it("renders quick-select shortcut buttons", () => {
    setup();
    expect(screen.getByText("due.today")).toBeTruthy();
    expect(screen.getByText("due.tomorrow")).toBeTruthy();
    expect(screen.getByText("due.nextWeek")).toBeTruthy();
  });

  it("clicking Today shortcut sets the date input to today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    setup();
    fireEvent.click(screen.getByText("due.today"));
    expect(getDateInput().value).toBe("2026-06-21");
    vi.useRealTimers();
  });

  it("shows Clear button when a due date is set and clears on click", async () => {
    const task: Task = { ...TASK, due: "2026-08-15" };
    setup(task);
    const clearBtn = screen.getByText("due.none");
    fireEvent.click(clearBtn);
    fireEvent.click(getSaveBtn());
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        "t1",
        expect.objectContaining({ due: null })
      )
    );
  });
});
