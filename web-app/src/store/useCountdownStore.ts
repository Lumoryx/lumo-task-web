import { create } from "zustand";
import { countdownApi } from "@/api/client";
import type { CountdownColor, CountdownEvent, CountdownRepeat } from "@/types/task";
import { toast } from "@/store/useToastStore";
import { t } from "@/i18n/useT";

interface CountdownState {
  events: CountdownEvent[];
  load: (userId: string) => void;
  clear: () => void;
  create: (userId: string, input: {
    title: string;
    date: string;
    emoji?: string;
    color: CountdownColor;
    repeat: CountdownRepeat;
    note?: string;
  }) => CountdownEvent;
  update: (userId: string, id: string, patch: Partial<Omit<CountdownEvent, "id" | "createdAt">>) => void;
  remove: (userId: string, id: string) => void;
}

export const useCountdownStore = create<CountdownState>((set) => ({
  events: [],

  load(userId) {
    try {
      set({ events: countdownApi.list(userId) });
    } catch (e) {
      toast.error(t("countdown.error.load"), e instanceof Error ? e.message : String(e));
    }
  },

  clear() {
    set({ events: [] });
  },

  create(userId, input) {
    try {
      const event = countdownApi.create(userId, input);
      set((s) => ({ events: [...s.events, event] }));
      return event;
    } catch (e) {
      toast.error(t("countdown.error.create"), e instanceof Error ? e.message : String(e));
      throw e;
    }
  },

  update(userId, id, patch) {
    try {
      const updated = countdownApi.update(userId, id, patch);
      set((s) => ({ events: s.events.map((e) => (e.id === id ? updated : e)) }));
    } catch (e) {
      toast.error(t("countdown.error.update"), e instanceof Error ? e.message : String(e));
    }
  },

  remove(userId, id) {
    try {
      countdownApi.delete(userId, id);
      set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      toast.success(t("countdown.deleted"));
    } catch (e) {
      toast.error(t("countdown.error.delete"), e instanceof Error ? e.message : String(e));
    }
  },
}));
