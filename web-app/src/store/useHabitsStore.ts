import { create } from "zustand";
import { habitApi } from "@/api/client";
import type { Habit, HabitColor, HabitFrequency, HabitLog } from "@/types/task";
import { toast } from "@/store/useToastStore";
import { t } from "@/i18n/useT";

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  load: (userId: string) => void;
  clear: () => void;
  create: (userId: string, input: {
    title: string;
    emoji?: string;
    color: HabitColor;
    frequency: HabitFrequency;
    note?: string;
  }) => Habit;
  update: (userId: string, id: string, patch: Partial<Omit<Habit, "id" | "createdAt">>) => void;
  remove: (userId: string, id: string) => void;
  log: (userId: string, habitId: string, date: string) => void;
  unlog: (userId: string, habitId: string, date: string) => void;
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  logs: [],

  load(userId) {
    if (userId === "local") { set({ habits: [], logs: [] }); return; }
    try {
      set({
        habits: habitApi.listHabits(userId),
        logs: habitApi.listLogs(userId),
      });
    } catch (e) {
      toast.error(t("habit.error.load"), e instanceof Error ? e.message : String(e));
    }
  },

  clear() {
    set({ habits: [], logs: [] });
  },

  create(userId, input) {
    try {
      const habit = habitApi.createHabit(userId, input);
      set((s) => ({ habits: [...s.habits, habit] }));
      return habit;
    } catch (e) {
      toast.error(t("habit.error.create"), e instanceof Error ? e.message : String(e));
      throw e;
    }
  },

  update(userId, id, patch) {
    try {
      const updated = habitApi.updateHabit(userId, id, patch);
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? updated : h)) }));
    } catch (e) {
      toast.error(t("habit.error.update"), e instanceof Error ? e.message : String(e));
    }
  },

  remove(userId, id) {
    try {
      habitApi.deleteHabit(userId, id);
      set((s) => ({
        habits: s.habits.filter((h) => h.id !== id),
        logs: s.logs.filter((l) => l.habitId !== id),
      }));
      toast.success(t("habit.deleted"));
    } catch (e) {
      toast.error(t("habit.error.delete"), e instanceof Error ? e.message : String(e));
    }
  },

  log(userId, habitId, date) {
    try {
      const entry = habitApi.logHabit(userId, habitId, date);
      set((s) => {
        const already = s.logs.some((l) => l.habitId === habitId && l.date === date);
        return already ? s : { logs: [...s.logs, entry] };
      });
    } catch (e) {
      toast.error(t("habit.error.log"), e instanceof Error ? e.message : String(e));
    }
  },

  unlog(userId, habitId, date) {
    try {
      habitApi.unlogHabit(userId, habitId, date);
      set((s) => ({ logs: s.logs.filter((l) => !(l.habitId === habitId && l.date === date)) }));
    } catch (e) {
      toast.error(t("habit.error.log"), e instanceof Error ? e.message : String(e));
    }
  },
}));
