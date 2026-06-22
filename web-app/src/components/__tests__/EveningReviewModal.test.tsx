import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EveningReviewModal } from "../EveningReviewModal";
import type { CompletedEntry, Task } from "@/types/task";

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
  useLocaleString: () => (val: { en: string } | string) =>
    typeof val === "string" ? val : (val?.en ?? ""),
}));

vi.mock("@/store/useAppStore", () => ({
  useAppStore: (sel: (s: { locale: string }) => unknown) => sel({ locale: "en" }),
}));

const mockCelebrate = vi.fn();
vi.mock("@/store/usePetStore", () => {
  const usePetStore = () => ({});
  usePetStore.getState = () => ({ celebrate: mockCelebrate });
  return { usePetStore };
});

const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockRemove = vi.fn().mockResolvedValue(undefined);

vi.mock("@/store/useTasksStore", () => ({
  useTasksStore: (sel: (s: unknown) => unknown) =>
    sel({
      tasks: TASKS,
      completed: COMPLETED,
      update: mockUpdate,
      remove: mockRemove,
    }),
}));

vi.mock("@/lib/format", () => ({
  fmtDuration: (mins: number, _locale: string) => `${mins}m`,
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, createPortal: (node: unknown) => node };
});

// ─── Test data ────────────────────────────────────────────────────────────

function makeTask(override: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: { en: "Task 1" },
    quadrant: "Q1",
    today: true,
    week_focus: false,
    completed: false,
    duration: 30,
    pomos_done: 0,
    pomos_total: 1,
    due: null,
    ...override,
  };
}

function makeCompleted(override: Partial<CompletedEntry> = {}): CompletedEntry {
  return {
    id: "c1",
    title: { en: "Completed Task" },
    duration: 30,
    quadrant: "Q1",
    ...override,
  };
}

let TASKS: Task[] = [];
let COMPLETED: CompletedEntry[] = [];

const localStore: Record<string, string> = {};

beforeEach(() => {
  TASKS = [];
  COMPLETED = [];
  mockUpdate.mockClear();
  mockRemove.mockClear();
  mockCelebrate.mockClear();

  vi.spyOn(Storage.prototype, "getItem").mockImplementation((k) => localStore[k] ?? null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((k, v) => { localStore[k] = v; });
  delete localStore["lumo.evening_review_done_date"];
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────

describe("EveningReviewModal", () => {
  it("renders results step first", () => {
    COMPLETED = [makeCompleted()];
    render(<EveningReviewModal onClose={vi.fn()} />);
    expect(screen.getByText("review.step.results.title")).toBeInTheDocument();
  });

  it("close button calls onClose", () => {
    const onClose = vi.fn();
    render(<EveningReviewModal onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "qc.close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows empty state when no completed tasks", () => {
    COMPLETED = [];
    TASKS = [];
    render(<EveningReviewModal onClose={vi.fn()} />);
    expect(screen.getByText("review.step.results.empty")).toBeInTheDocument();
  });

  it("shows alldone message when all today tasks are completed", () => {
    TASKS = [];
    COMPLETED = [makeCompleted()];
    render(<EveningReviewModal onClose={vi.fn()} />);
    expect(screen.getByText("review.step.results.alldone")).toBeInTheDocument();
  });

  it("lists completed tasks", () => {
    COMPLETED = [
      makeCompleted({ id: "c1", title: { en: "First task" } }),
      makeCompleted({ id: "c2", title: { en: "Second task" } }),
    ];
    render(<EveningReviewModal onClose={vi.fn()} />);
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
  });

  it("skips unfinished step when no unfinished tasks", async () => {
    TASKS = [];
    COMPLETED = [makeCompleted()];
    render(<EveningReviewModal onClose={vi.fn()} />);
    // Step dots: results → done (2 steps)
    // Next from results goes to done directly
    fireEvent.click(screen.getByText("review.btn.next"));
    expect(screen.getByText("review.step.done.title")).toBeInTheDocument();
  });

  it("shows unfinished step when there are unfinished tasks", () => {
    TASKS = [makeTask({ id: "t1", title: { en: "Unfinished" }, today: true, completed: false })];
    COMPLETED = [];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next"));
    expect(screen.getByText("review.step.unfinished.title")).toBeInTheDocument();
  });

  it("shows unfinished task in step 2", () => {
    TASKS = [makeTask({ id: "t1", title: { en: "Unfinished Task" }, today: true, completed: false })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // results → unfinished
    expect(screen.getByText("Unfinished Task")).toBeInTheDocument();
  });

  it("back button returns to previous step", () => {
    TASKS = [makeTask({ id: "t1", today: true, completed: false })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // results → unfinished
    expect(screen.getByText("review.step.unfinished.title")).toBeInTheDocument();
    fireEvent.click(screen.getByText("review.btn.back"));
    expect(screen.getByText("review.step.results.title")).toBeInTheDocument();
  });

  it("keep all button sets all decisions to keep", () => {
    TASKS = [
      makeTask({ id: "t1", title: { en: "Task A" }, today: true }),
      makeTask({ id: "t2", title: { en: "Task B" }, today: true }),
    ];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    fireEvent.click(screen.getByText("review.step.unfinished.keepall"));
    // All "Tomorrow" buttons should be active (rendered with keep class)
    const tomorrowBtns = screen.getAllByText("review.unfinished.keep");
    expect(tomorrowBtns.length).toBe(2);
  });

  it("shows abandon confirmation dialog", () => {
    TASKS = [makeTask({ id: "t1", title: { en: "Task A" }, today: true })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    fireEvent.click(screen.getByText("review.unfinished.abandon"));
    expect(screen.getByText("review.abandon.yes")).toBeInTheDocument();
  });

  it("cancels abandon when cancel clicked", () => {
    TASKS = [makeTask({ id: "t1", title: { en: "Task A" }, today: true })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    fireEvent.click(screen.getByText("review.unfinished.abandon"));
    fireEvent.click(screen.getByText("review.abandon.cancel"));
    expect(screen.queryByText("review.abandon.yes")).not.toBeInTheDocument();
  });

  it("calls remove for abandoned tasks on finish", async () => {
    TASKS = [makeTask({ id: "t1", title: { en: "Task A" }, today: true })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    fireEvent.click(screen.getByText("review.unfinished.abandon"));
    fireEvent.click(screen.getByText("review.abandon.yes")); // confirm
    fireEvent.click(screen.getByText("review.btn.next")); // → done
    fireEvent.click(screen.getByText("review.btn.finish")); // finish
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith("t1"));
  });

  it("calls update with today=false for matrix tasks on finish", async () => {
    TASKS = [makeTask({ id: "t1", title: { en: "Task A" }, today: true })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    fireEvent.click(screen.getByText("review.unfinished.matrix"));
    fireEvent.click(screen.getByText("review.btn.next")); // → done
    fireEvent.click(screen.getByText("review.btn.finish")); // finish
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("t1", { today: false })
    );
  });

  it("does NOT call update for 'keep' decision (today stays true)", async () => {
    TASKS = [makeTask({ id: "t1", today: true })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    // Default decision is "keep" — no action needed
    fireEvent.click(screen.getByText("review.btn.next")); // → done
    fireEvent.click(screen.getByText("review.btn.finish")); // finish
    await waitFor(() => {
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  it("stores evening review date in localStorage on finish", async () => {
    TASKS = [];
    COMPLETED = [makeCompleted()];
    const onClose = vi.fn();
    render(<EveningReviewModal onClose={onClose} />);
    fireEvent.click(screen.getByText("review.btn.next")); // results → done
    fireEvent.click(screen.getByText("review.btn.finish"));
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "lumo.evening_review_done_date",
        expect.any(String)
      );
    });
  });

  it("calls celebrate on finish", async () => {
    TASKS = [];
    COMPLETED = [makeCompleted()];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → done
    fireEvent.click(screen.getByText("review.btn.finish"));
    await waitFor(() =>
      expect(mockCelebrate).toHaveBeenCalledWith("pet.celebrate.eveningdone")
    );
  });

  it("shows perfect completion message for 100% rate", () => {
    TASKS = [];
    COMPLETED = [makeCompleted()];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → done
    expect(screen.getByText("review.step.done.perfect")).toBeInTheDocument();
  });

  it("shows great message for partial completion", () => {
    TASKS = [makeTask({ id: "t2", title: { en: "Remaining" }, today: true })];
    COMPLETED = [makeCompleted({ id: "c1" })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    fireEvent.click(screen.getByText("review.btn.next")); // → done
    // 1 completed out of 2 total = 50% → great
    expect(screen.getByText("review.step.done.great")).toBeInTheDocument();
  });

  it("shows ok message when less than 50% completed", () => {
    TASKS = [
      makeTask({ id: "t2", today: true }),
      makeTask({ id: "t3", today: true }),
      makeTask({ id: "t4", today: true }),
    ];
    COMPLETED = [makeCompleted({ id: "c1" })];
    render(<EveningReviewModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("review.btn.next")); // → unfinished
    fireEvent.click(screen.getByText("review.btn.next")); // → done
    // 1 of 4 = 25% → ok
    expect(screen.getByText("review.step.done.ok")).toBeInTheDocument();
  });

  it("shows step progress dots", () => {
    render(<EveningReviewModal onClose={vi.fn()} />);
    expect(screen.getByText("review.progress")).not.toBeNull();
  });
});
