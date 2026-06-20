import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { toISODate } from "@/lib/format";

const REMINDED_KEY_PREFIX = "lumo-reminded-";

function getRemindedKey(): string {
  return `${REMINDED_KEY_PREFIX}${toISODate(new Date())}`;
}

function hasRemindedToday(): boolean {
  try {
    return localStorage.getItem(getRemindedKey()) === "1";
  } catch {
    return false;
  }
}

function markRemindedToday(): void {
  try {
    localStorage.setItem(getRemindedKey(), "1");
  } catch {
    // ignore
  }
}

function msUntilTime(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
  const diff = target.getTime() - now.getTime();
  return diff > 0 ? diff : 0;
}

export function useDueReminderScheduler(): void {
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const reminderTime = useAppStore((s) => s.reminderTime);
  const locale = useAppStore((s) => s.locale);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!notificationsEnabled) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (hasRemindedToday()) return;

    const delay = msUntilTime(reminderTime);
    if (delay === 0) return;

    timerRef.current = setTimeout(() => {
      if (hasRemindedToday()) return;
      const tasks = useTasksStore.getState().tasks;
      const unfinishedToday = tasks.filter((t) => t.today && !t.completed);
      if (unfinishedToday.length === 0) return;

      const n = unfinishedToday.length;
      const body = locale === "zh"
        ? `今天还有 ${n} 个任务未完成，加油！`
        : `You have ${n} unfinished task${n > 1 ? "s" : ""} for today — let's get them done!`;

      new Notification("Lumo Task", { body, icon: "/favicon.ico" });
      markRemindedToday();
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [notificationsEnabled, reminderTime, locale]);
}
