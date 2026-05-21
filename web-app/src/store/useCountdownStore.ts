import { create } from "zustand";
import { countdownApi } from "@/api/client";
import type { CountdownColor, CountdownEvent, CountdownRepeat } from "@/types/task";
import { toast } from "@/store/useToastStore";
import { t } from "@/i18n/useT";

interface CountdownState {
  events: CountdownEvent[];
  load: () => void;
  create: (input: {
    title: string;
    date: string;
    emoji?: string;
    color: CountdownColor;
    repeat: CountdownRepeat;
    note?: string;
  }) => CountdownEvent;
  update: (id: string, patch: Partial<Omit<CountdownEvent, "id" | "createdAt">>) => void;
  remove: (id: string) => void;
}

export const useCountdownStore = create<CountdownState>((set) => ({
  events: [],

  load() {
    try {
      set({ events: countdownApi.list() });
    } catch (e) {
      toast.error(t("countdown.error.load"), e instanceof Error ? e.message : String(e));
    }
  },

  create(input) {
    try {
      const event = countdownApi.create(input);
      set((s) => ({ events: [...s.events, event] }));
      return event;
    } catch (e) {
      toast.error(t("countdown.error.create"), e instanceof Error ? e.message : String(e));
      throw e;
    }
  },

  update(id, patch) {
    try {
      const updated = countdownApi.update(id, patch);
      set((s) => ({ events: s.events.map((e) => (e.id === id ? updated : e)) }));
    } catch (e) {
      toast.error(t("countdown.error.update"), e instanceof Error ? e.message : String(e));
    }
  },

  remove(id) {
    try {
      countdownApi.delete(id);
      set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      toast.success(t("countdown.deleted"));
    } catch (e) {
      toast.error(t("countdown.error.delete"), e instanceof Error ? e.message : String(e));
    }
  },
}));
