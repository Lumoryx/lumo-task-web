import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MorningPlanningModal } from "../MorningPlanningModal";
import type { Task } from "@/types/task";

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
  useLocaleString: () => (val: { en: string } | string) =>
    typeof val === "string" ? val : (val?.en ?? ""),
}));

let DAILY_CAPACITY = 360;

vi.mock("@/store/useAppStore", () => ({
  useAppStore: (sel: (s: { locale: string; dailyCapacityMinutes: number }) => unknown) =>
    sel({ locale: "en", dailyCapacityMinutes: DAILY_CAPACITY }),
}));

const mockCelebrate = vi.fn();
const mockPetGetState = vi.fn(() => ({ celebrate: mockCelebrate }));

vi.mock("@/store/usePetStore", () => {
  const usePetStore = (sel: (s: { species: string }) => unknown) =>
    sel({ species: "dog" });
  usePetStore.getState = () => ({ celebrate: mockCelebrate });
  return { usePetStore };
});

const mockUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/store/useTasksStore", () => ({
  useTasksStore: (sel: (s: unknown) => unknown) =>
    sel({
      tasks: TASKS,
      update: mockUpdate,
    }),
}));

vi.mock("@/store/useAIStore", () => {
  // Reads module-level AI_HAS_KEY on each call so tests can toggle the AI step
  const getState = () => ({
    activeProvider: "openai",
    providerConfigs: { openai: { hasKey: AI_HAS_KEY } },
  });
  return {
    useAIStore: (sel?: (s: unknown) => unknown) =>
      sel ? sel(getState()) : getState(),
  };
});

vi.mock("@/components/PetSvg", () => ({
  PetSvg: ({ mood }: { mood: string }) => (
    <div data-testid="pet-svg" data-mood={mood} />
  ),
}));

// Render createPortal inline for test environment
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    createPortal: (node: unknown) => node,
  };
});

// ─── Test data ────────────────────────────────────────────────────────────

function makeTask(override: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: { en: "Task 1" },
    quadrant: "Q1",
    today: false,
    week_focus: false,
    completed: false,
    duration: 30,
    pomos_done: 0,
    pomos_total: 1,
    due: null,
    ...override,
  };
}

// Module-level mutable task list — mock reads this on each call
let TASKS: Task[] = [];
// Module-level AI toggle — mock reads this on each call (drives the AI step)
let AI_HAS_KEY = false;

beforeEach(() => {
  TASKS = [];
  AI_HAS_KEY = false;
  DAILY_CAPACITY = 360;
  mockUpdate.mockClear();
  mockCelebrate.mockClear();
  mockPetGetState.mockClear();

  // Stub localStorage
  const store: Record<string, string> = {};
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(
    (k) => store[k] ?? null
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((k, v) => {
    store[k] = v;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────

describe("MorningPlanningModal", () => {
  it("shows select step when no previous today tasks", () => {
    TASKS = [makeTask({ id: "t1", quadrant: "Q1", today: false })];
    render(<MorningPlanningModal onClose={vi.fn()} />);
    expect(screen.getByText("planning.step.select.title")).toBeInTheDocument();
  });

  it("shows carry step first when previous today tasks exist", () => {
    TASKS = [makeTask({ id: "t1", quadrant: "Q1", today: true, completed: false })];
    render(<MorningPlanningModal onClose={vi.fn()} />);
    expect(screen.getByText("planning.step.carry.title")).toBeInTheDocument();
  });

  it("close button calls onClose", () => {
    TASKS = [];
    const onClose = vi.fn();
    render(<MorningPlanningModal onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "qc.close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("advances from carry to select step on Next", () => {
    TASKS = [makeTask({ id: "t1", quadrant: "Q1", today: true, completed: false })];
    render(<MorningPlanningModal onClose={vi.fn()} />);
    expect(screen.getByText("planning.step.carry.title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("planning.btn.next"));
    expect(screen.getByText("planning.step.select.title")).toBeInTheDocument();
  });

  it("Back button returns to previous step", () => {
    TASKS = [makeTask({ id: "t1", quadrant: "Q1", today: true, completed: false })];
    render(<MorningPlanningModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("planning.btn.next")); // carry → select
    expect(screen.getByText("planning.step.select.title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("planning.btn.back"));
    expect(screen.getByText("planning.step.carry.title")).toBeInTheDocument();
  });

  it("enforces max 3 task selection in select step", async () => {
    TASKS = [
      makeTask({ id: "t1", title: { en: "Task 1" }, quadrant: "Q1", today: false }),
      makeTask({ id: "t2", title: { en: "Task 2" }, quadrant: "Q1", today: false }),
      makeTask({ id: "t3", title: { en: "Task 3" }, quadrant: "Q1", today: false }),
      makeTask({ id: "t4", title: { en: "Task 4" }, quadrant: "Q2", today: false }),
    ];
    const user = userEvent.setup();
    render(<MorningPlanningModal onClose={vi.fn()} />);

    await user.click(screen.getByText("Task 1"));
    await user.click(screen.getByText("Task 2"));
    await user.click(screen.getByText("Task 3"));
    // Limit message appears proactively once 3 tasks are selected
    expect(screen.getByText("planning.step.select.limit")).toBeInTheDocument();
  });

  it("clears limit warning when a task is deselected", async () => {
    TASKS = [
      makeTask({ id: "t1", title: { en: "Task 1" }, quadrant: "Q1", today: false }),
      makeTask({ id: "t2", title: { en: "Task 2" }, quadrant: "Q1", today: false }),
      makeTask({ id: "t3", title: { en: "Task 3" }, quadrant: "Q1", today: false }),
    ];
    const user = userEvent.setup();
    render(<MorningPlanningModal onClose={vi.fn()} />);

    await user.click(screen.getByText("Task 1"));
    await user.click(screen.getByText("Task 2"));
    await user.click(screen.getByText("Task 3"));
    // 3 selected — now deselect one
    await user.click(screen.getByText("Task 1"));
    expect(screen.queryByText("planning.step.select.limit")).not.toBeInTheDocument();
  });

  it("advances from select to done step (no AI)", () => {
    TASKS = [makeTask({ id: "t1", quadrant: "Q1", today: false })];
    render(<MorningPlanningModal onClose={vi.fn()} />);
    expect(screen.getByText("planning.step.select.title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("planning.btn.next"));
    expect(screen.getByText("planning.step.done.title")).toBeInTheDocument();
  });

  it("renders pet svg on done step", () => {
    TASKS = [];
    render(<MorningPlanningModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("planning.btn.next")); // select → done
    expect(screen.getByTestId("pet-svg")).toBeInTheDocument();
  });

  it("only shows Q1 and Q2 tasks in select step", () => {
    TASKS = [
      makeTask({ id: "t1", title: { en: "Q1 Task" }, quadrant: "Q1", today: false }),
      makeTask({ id: "t2", title: { en: "Q2 Task" }, quadrant: "Q2", today: false }),
      makeTask({ id: "t3", title: { en: "Q3 Task" }, quadrant: "Q3", today: false }),
    ];
    render(<MorningPlanningModal onClose={vi.fn()} />);
    expect(screen.getByText("Q1 Task")).toBeInTheDocument();
    expect(screen.getByText("Q2 Task")).toBeInTheDocument();
    expect(screen.queryByText("Q3 Task")).not.toBeInTheDocument();
  });

  it("calls update(id, {today:true}) for selected tasks on finish", async () => {
    TASKS = [makeTask({ id: "t1", title: { en: "Task 1" }, quadrant: "Q1", today: false })];
    const onClose = vi.fn();
    render(<MorningPlanningModal onClose={onClose} />);
    // Select task, advance to done
    fireEvent.click(screen.getByText("Task 1"));
    fireEvent.click(screen.getByText("planning.btn.next")); // → done
    fireEvent.click(screen.getByText("planning.btn.finish"));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(mockUpdate).toHaveBeenCalledWith("t1", { today: true });
  });

  it("calls update(id, {today:false}) for deferred tasks on finish", async () => {
    TASKS = [
      makeTask({ id: "t1", title: { en: "Task 1" }, quadrant: "Q1", today: true, completed: false }),
    ];
    const onClose = vi.fn();
    render(<MorningPlanningModal onClose={onClose} />);
    // carry step — defer t1
    fireEvent.click(screen.getByText("planning.carry.defer"));
    fireEvent.click(screen.getByText("planning.btn.next")); // carry → select
    fireEvent.click(screen.getByText("planning.btn.next")); // select → done
    fireEvent.click(screen.getByText("planning.btn.finish"));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(mockUpdate).toHaveBeenCalledWith("t1", { today: false });
  });

  it("saves planning_done_date to localStorage on finish", async () => {
    TASKS = [];
    const onClose = vi.fn();
    render(<MorningPlanningModal onClose={onClose} />);
    fireEvent.click(screen.getByText("planning.btn.next")); // select → done
    fireEvent.click(screen.getByText("planning.btn.finish"));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    const today = new Date().toISOString().slice(0, 10);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "lumo.planning_done_date",
      today
    );
  });

  // ─── Focus load bar ──────────────────────────────────────────────────────
  describe("Focus load bar in select step", () => {
    it("shows load bar when a task with duration is selected", async () => {
      TASKS = [makeTask({ id: "t1", title: { en: "Task 1" }, quadrant: "Q1", duration: 90, today: false })];
      const user = userEvent.setup();
      render(<MorningPlanningModal onClose={vi.fn()} />);

      // Before selection — bar should not show (nothing selected)
      expect(screen.queryByText("planning.load.title")).not.toBeInTheDocument();

      // After selecting the task with duration 90m
      await user.click(screen.getByText("Task 1"));
      expect(screen.getByText("planning.load.title")).toBeInTheDocument();
    });

    it("does not show load bar when only unestimated tasks are in pool", () => {
      TASKS = [makeTask({ id: "t1", title: { en: "No Est" }, quadrant: "Q1", duration: 0, today: false })];
      render(<MorningPlanningModal onClose={vi.fn()} />);
      expect(screen.queryByText("planning.load.title")).not.toBeInTheDocument();
    });

    it("shows overload warning when total exceeds capacity", async () => {
      DAILY_CAPACITY = 60; // 1h capacity
      TASKS = [
        makeTask({ id: "t1", title: { en: "Big Task" }, quadrant: "Q1", duration: 120, today: false }),
      ];
      const user = userEvent.setup();
      render(<MorningPlanningModal onClose={vi.fn()} />);
      await user.click(screen.getByText("Big Task"));
      expect(screen.getByText("planning.load.overload")).toBeInTheDocument();
    });

    it("shows nearfull warning when load is 80–100%", async () => {
      DAILY_CAPACITY = 100;
      TASKS = [
        makeTask({ id: "t1", title: { en: "Heavy Task" }, quadrant: "Q1", duration: 90, today: false }),
      ];
      const user = userEvent.setup();
      render(<MorningPlanningModal onClose={vi.fn()} />);
      await user.click(screen.getByText("Heavy Task"));
      expect(screen.getByText("planning.load.nearfull")).toBeInTheDocument();
    });

    it("shows no status message when load is under 80%", async () => {
      DAILY_CAPACITY = 360;
      TASKS = [makeTask({ id: "t1", title: { en: "Light Task" }, quadrant: "Q1", duration: 60, today: false })];
      const user = userEvent.setup();
      render(<MorningPlanningModal onClose={vi.fn()} />);
      await user.click(screen.getByText("Light Task"));
      expect(screen.queryByText("planning.load.overload")).not.toBeInTheDocument();
      expect(screen.queryByText("planning.load.nearfull")).not.toBeInTheDocument();
    });

    it("shows unestimated count hint when some selected tasks have no duration", async () => {
      DAILY_CAPACITY = 360;
      TASKS = [
        makeTask({ id: "t1", title: { en: "Estimated" }, quadrant: "Q1", duration: 60, today: false }),
        makeTask({ id: "t2", title: { en: "No Duration" }, quadrant: "Q2", duration: 0, today: false }),
      ];
      const user = userEvent.setup();
      render(<MorningPlanningModal onClose={vi.fn()} />);
      await user.click(screen.getByText("Estimated"));
      await user.click(screen.getByText("No Duration"));
      expect(screen.getByText(/planning\.load\.unestimated/)).toBeInTheDocument();
    });
  });

  // ─── AI step (AC #3 / #5) ────────────────────────────────────────────────
  describe("AI step (hasKey: true)", () => {
    it("inserts the AI step between select and done when AI is configured", () => {
      AI_HAS_KEY = true;
      TASKS = [makeTask({ id: "t1", quadrant: "Q1", today: false })];
      render(<MorningPlanningModal onClose={vi.fn()} />);
      // select → ai (not straight to done)
      fireEvent.click(screen.getByText("planning.btn.next"));
      expect(screen.getByText("planning.step.ai.title")).toBeInTheDocument();
    });

    it("prompts to pick a task when nothing is selected", () => {
      AI_HAS_KEY = true;
      TASKS = [makeTask({ id: "t1", quadrant: "Q1", today: false })];
      render(<MorningPlanningModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByText("planning.btn.next")); // select → ai
      expect(screen.getByText(/planning\.ai\.empty/)).toBeInTheDocument();
    });

    it("gives positive feedback when the selection is well-focused", async () => {
      AI_HAS_KEY = true;
      TASKS = [makeTask({ id: "t1", title: { en: "Task 1" }, quadrant: "Q1", due: "2026-06-20" })];
      const user = userEvent.setup();
      render(<MorningPlanningModal onClose={vi.fn()} />);
      await user.click(screen.getByText("Task 1")); // select the only Q1 task
      fireEvent.click(screen.getByText("planning.btn.next")); // select → ai
      expect(screen.getByText(/planning\.ai\.focused/)).toBeInTheDocument();
    });

    it("warns when an urgent Q1 task with a due date is left unselected", async () => {
      AI_HAS_KEY = true;
      TASKS = [
        makeTask({ id: "t1", title: { en: "Picked" }, quadrant: "Q1", due: null }),
        makeTask({ id: "t2", title: { en: "Urgent" }, quadrant: "Q1", due: "2026-06-20" }),
      ];
      const user = userEvent.setup();
      render(<MorningPlanningModal onClose={vi.fn()} />);
      await user.click(screen.getByText("Picked")); // select non-urgent, leave Urgent
      fireEvent.click(screen.getByText("planning.btn.next")); // select → ai
      expect(screen.getByText(/planning\.ai\.q1skipped/)).toBeInTheDocument();
    });
  });
});
