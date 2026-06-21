import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/api/client";

interface NotificationStore {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
  dueAlertsEnabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setEnabled: (v: boolean) => void;
  setMorningTime: (v: string) => void;
  setEveningTime: (v: string) => void;
  setDueAlertsEnabled: (v: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      enabled: false,
      morningTime: "09:00",
      eveningTime: "18:00",
      dueAlertsEnabled: true,
      loaded: false,

      async load() {
        try {
          const s = await api.getSettings();
          set({
            enabled: s.notifications_enabled,
            morningTime: s.morning_reminder_time ?? "09:00",
            eveningTime: s.evening_reminder_time ?? "18:00",
            loaded: true,
          });
        } catch {}
      },

      setEnabled: (enabled) => set({ enabled }),
      setMorningTime: (morningTime) => set({ morningTime }),
      setEveningTime: (eveningTime) => set({ eveningTime }),
      setDueAlertsEnabled: (dueAlertsEnabled) => set({ dueAlertsEnabled }),
    }),
    { name: "lumo.notifications.v1" }
  )
);
