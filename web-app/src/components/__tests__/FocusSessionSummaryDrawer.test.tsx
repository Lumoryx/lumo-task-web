import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FocusSessionSummaryDrawer, saveFocusLog, getFocusLogs } from "../FocusSessionSummaryDrawer";
import type { Task } from "@/types/task";

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

const TASK: Task = {
  id: "task-1",
  title: { en: "Write tests" },
  quadrant: "Q1",
  today: true,
  week_focus: false,
  due: null,
  duration: 25,
  pomos_done: 0,
  pomos_total: 1,
  completed: false,
};

function renderDrawer(overrides?: Partial<Parameters<typeof FocusSessionSummaryDrawer>[0]>) {
  const props = {
    task: TASK,
    onStartAnother: vi.fn(),
    onEndFocus: vi.fn().mockResolvedValue(undefined),
    onSkip: vi.fn(),
    ...overrides,
  };
  return { ...render(<FocusSessionSummaryDrawer {...props} />), props };
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FocusSessionSummaryDrawer", () => {
  describe("rendering", () => {
    it("shows the section title", () => {
      renderDrawer();
      expect(screen.getByText("focus.session.title")).toBeInTheDocument();
    });

    it("shows accomplished and next-step labels", () => {
      renderDrawer();
      expect(screen.getByText("focus.session.accomplished")).toBeInTheDocument();
      expect(screen.getByText("focus.session.next_step")).toBeInTheDocument();
    });

    it("shows action buttons", () => {
      renderDrawer();
      expect(screen.getByText("focus.session.start_another")).toBeInTheDocument();
      expect(screen.getByText("focus.session.end_focus")).toBeInTheDocument();
    });

    it("shows skip countdown initially", () => {
      renderDrawer();
      expect(screen.getByText("focus.session.skip_in".replace("{n}", "5"))).toBeInTheDocument();
    });

    it("skip button is disabled while countdown is active", () => {
      renderDrawer();
      const skipBtn = screen.getByRole("button", { name: /focus\.session\.skip/ });
      expect(skipBtn).toBeDisabled();
    });

    it("skip button becomes enabled after countdown", async () => {
      renderDrawer();
      for (let i = 0; i < 5; i++) {
        await act(async () => { vi.advanceTimersByTime(1000); });
      }
      const skipBtn = screen.getByText("focus.session.skip");
      expect(skipBtn).not.toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("calls onSkip when skip button clicked after countdown", async () => {
      const { props } = renderDrawer();
      for (let i = 0; i < 5; i++) {
        await act(async () => { vi.advanceTimersByTime(1000); });
      }
      fireEvent.click(screen.getByText("focus.session.skip"));
      expect(props.onSkip).toHaveBeenCalledOnce();
    });

    it("calls onSkip on Escape key", () => {
      const { props } = renderDrawer();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(props.onSkip).toHaveBeenCalledOnce();
    });

    it("calls onEndFocus with input values when End focus clicked", async () => {
      const { props } = renderDrawer();
      const [accomplishedInput, nextStepInput] = screen.getAllByRole("textbox");
      fireEvent.change(accomplishedInput, { target: { value: "Fixed the bug" } });
      fireEvent.change(nextStepInput, { target: { value: "Write changelog" } });
      await act(async () => {
        fireEvent.click(screen.getByText("focus.session.end_focus"));
      });
      expect(props.onEndFocus).toHaveBeenCalledWith({
        accomplished: "Fixed the bug",
        nextStep: "Write changelog",
      });
    });

    it("calls onEndFocus on Enter key in accomplished field", async () => {
      const { props } = renderDrawer();
      const [accomplishedInput] = screen.getAllByRole("textbox");
      fireEvent.change(accomplishedInput, { target: { value: "Done" } });
      await act(async () => {
        fireEvent.keyDown(accomplishedInput, { key: "Enter" });
      });
      expect(props.onEndFocus).toHaveBeenCalledWith({ accomplished: "Done", nextStep: "" });
    });

    it("calls onStartAnother with accomplished text", () => {
      const { props } = renderDrawer();
      const [accomplishedInput] = screen.getAllByRole("textbox");
      fireEvent.change(accomplishedInput, { target: { value: "Reviewed PRs" } });
      fireEvent.click(screen.getByText("focus.session.start_another"));
      expect(props.onStartAnother).toHaveBeenCalledWith("Reviewed PRs");
    });

    it("calls onEndFocus with empty strings when no input", async () => {
      const { props } = renderDrawer();
      await act(async () => {
        fireEvent.click(screen.getByText("focus.session.end_focus"));
      });
      expect(props.onEndFocus).toHaveBeenCalledWith({ accomplished: "", nextStep: "" });
    });
  });

  describe("countdown", () => {
    it("decrements skip countdown each second", async () => {
      renderDrawer();
      expect(screen.getByText("focus.session.skip_in".replace("{n}", "5"))).toBeInTheDocument();
      await act(async () => { vi.advanceTimersByTime(1000); });
      expect(screen.getByText("focus.session.skip_in".replace("{n}", "4"))).toBeInTheDocument();
      await act(async () => { vi.advanceTimersByTime(1000); });
      expect(screen.getByText("focus.session.skip_in".replace("{n}", "3"))).toBeInTheDocument();
    });
  });
});

describe("saveFocusLog / getFocusLogs", () => {
  it("saves and retrieves a log entry", () => {
    saveFocusLog("task-1", "Finished the refactor");
    const logs = getFocusLogs("task-1");
    expect(logs).toHaveLength(1);
    expect(logs[0].text).toBe("Finished the refactor");
    expect(logs[0].ts).toBeTruthy();
  });

  it("ignores empty strings", () => {
    saveFocusLog("task-1", "   ");
    expect(getFocusLogs("task-1")).toHaveLength(0);
  });

  it("caps at 50 entries", () => {
    for (let i = 0; i < 55; i++) saveFocusLog("task-1", `entry ${i}`);
    expect(getFocusLogs("task-1")).toHaveLength(50);
  });

  it("keeps most recent 50 when over limit", () => {
    for (let i = 0; i < 52; i++) saveFocusLog("task-1", `entry ${i}`);
    const logs = getFocusLogs("task-1");
    expect(logs[0].text).toBe("entry 2");
    expect(logs[49].text).toBe("entry 51");
  });

  it("returns empty array for unknown task", () => {
    expect(getFocusLogs("unknown-task")).toEqual([]);
  });

  it("isolates logs per task", () => {
    saveFocusLog("task-1", "Task 1 done");
    saveFocusLog("task-2", "Task 2 done");
    expect(getFocusLogs("task-1")).toHaveLength(1);
    expect(getFocusLogs("task-2")).toHaveLength(1);
  });
});
