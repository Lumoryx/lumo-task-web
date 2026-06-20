import { create } from "zustand";
import { countdownApi } from "@/api/client";
import type { CountdownColor, CountdownEvent, CountdownRepeat } from "@/types/task";
import { toast } from "@/store/useToastStore";
import { t } from "@/i18n/useT";

function migrationKey(userId: string) {
  return `lumo.countdowns.migrated.v1.${userId}`;
}

function readLocalCountdowns(userId: string): CountdownEvent[] {
  try {
    const raw = localStorage.getItem(`lumo.countdowns.v1.${userId}`);
    return raw ? (JSON.parse(raw) as CountdownEvent[]) : [];
  } catch {
    return [];
  }
}

interface CountdownState {
  events: CountdownEvent[];
  load: (userId: string) => Promise<void>;
  clear: () => void;
  create: (userId: string, input: {
    title: string;
    date: string;
    emoji?: string;
    color: CountdownColor;
    repeat: CountdownRepeat;
    note?: string;
  }) => Promise<CountdownEvent>;
  update: (userId: string, id: string, patch: Partial<Omit<CountdownEvent, "id" | "createdAt">>) => Promise<void>;
  remove: (userId: string, id: string) => Promise<void>;
}

export const useCountdownStore = create<CountdownState>((set) => ({
  events: [],

  async load(userId) {
    if (userId === "local") { set({ events: [] }); return; }

    // One-time migration from localStorage → server
    if (!localStorage.getItem(migrationKey(userId))) {
      const oldEvents = readLocalCountdowns(userId);
      try {
        await countdownApi.migrate(userId, oldEvents);
        localStorage.setItem(migrationKey(userId), "1");
        localStorage.removeItem(`lumo.countdowns.v1.${userId}`);
      } catch {
        // Keep localStorage data intact — will retry on next load
      }
    }

    try {
      const events = await countdownApi.list(userId);
      set({ events });
    } catch (e) {
      toast.error(t("countdown.error.load"), e instanceof Error ? e.message : String(e));
    }
  },

  clear() {
    set({ events: [] });
  },

  async create(userId, input) {
    try {
      const event = await countdownApi.create(userId, input);
      set((s) => ({ events: [...s.events, event] }));
      return event;
    } catch (e) {
      toast.error(t("countdown.error.create"), e instanceof Error ? e.message : String(e));
      throw e;
    }
  },

  async update(userId, id, patch) {
    try {
      const updated = await countdownApi.update(userId, id, patch);
      set((s) => ({ events: s.events.map((e) => (e.id === id ? updated : e)) }));
    } catch (e) {
      toast.error(t("countdown.error.update"), e instanceof Error ? e.message : String(e));
    }
  },

  async remove(userId, id) {
    try {
      await countdownApi.delete(userId, id);
      set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      toast.success(t("countdown.deleted"));
    } catch (e) {
      toast.error(t("countdown.error.delete"), e instanceof Error ? e.message : String(e));
    }
  },
}));
