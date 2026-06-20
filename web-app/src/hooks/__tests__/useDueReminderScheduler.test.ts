import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";

import { useDueReminderScheduler } from "../useDueReminderScheduler";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { Task } from "@/types/task";

function makeTask(override: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: { en: "Task 1" },
    quadrant: "Q1",
    today: false,
    completed: false,
    duration: 30,
    pomos_done: 0,
    pomos_total: 1,
    due: null,
    ...override,
  };
}

const HOUR = 60 * 60 * 1000;

let NotificationMock: ReturnType<typeof vi.fn> & { permission: string };

function installNotification(permission: NotificationPermission) {
  NotificationMock = Object.assign(vi.fn(), { permission }) as typeof NotificationMock;
  vi.stubGlobal("Notification", NotificationMock);
}

describe("useDueReminderScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 13:00 local → reminder at 14:00 is one hour away
    vi.setSystemTime(new Date("2026-06-20T13:00:00"));
    localStorage.clear();
    useAppStore.setState({ notificationsEnabled: true, reminderTime: "14:00", locale: "en" });
    useTasksStore.setState({ tasks: [makeTask({ today: true, completed: false })] });
    installNotification("granted");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fires a notification at the reminder time when there are unfinished today tasks", () => {
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).toHaveBeenCalledTimes(1);
    const [title, opts] = NotificationMock.mock.calls[0];
    expect(title).toBe("Lumo Task");
    expect(opts.body).toContain("1 unfinished task");
  });

  it("marks the day as reminded so it never fires twice", () => {
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("lumo-reminded-2026-06-20")).toBe("1");
  });

  it("does not fire when notifications are disabled", () => {
    useAppStore.setState({ notificationsEnabled: false });
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("does not fire when permission is not granted", () => {
    installNotification("denied");
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("does not fire when there are no unfinished today tasks", () => {
    useTasksStore.setState({ tasks: [makeTask({ today: true, completed: true })] });
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("does not fire when already reminded today", () => {
    localStorage.setItem("lumo-reminded-2026-06-20", "1");
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("does not fire when the reminder time has already passed today", () => {
    // 15:00 is after the 14:00 reminder → delay is 0, scheduler is a no-op
    vi.setSystemTime(new Date("2026-06-20T15:00:00"));
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it("uses the localized notification body for zh", () => {
    useAppStore.setState({ locale: "zh" });
    renderHook(() => useDueReminderScheduler());
    act(() => vi.advanceTimersByTime(HOUR));

    expect(NotificationMock).toHaveBeenCalledTimes(1);
    const [, opts] = NotificationMock.mock.calls[0];
    expect(opts.body).toContain("1");
    expect(opts.body).toContain("加油");
  });
});
