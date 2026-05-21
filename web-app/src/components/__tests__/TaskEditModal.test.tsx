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
});
