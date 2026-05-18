/**
 * Auth store — current user + sign-in / sign-out actions.
 *
 * The user is persisted to localStorage so the "signed in" state
 * survives reload. Token-based real auth would store the token here too
 * and replay it via `src/api/client.ts`.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/api/client";
import type { User } from "@/types/task";
import { toast } from "@/store/useToastStore";
import { t } from "@/i18n/useT";

const LOCAL_USER: User = {
  id: "local",
  name: "You",
  email: "",
  initials: "YO",
  local: true,
  plan: "free",
  stats: { tasks: 0, pomodoros: 0, syncOK: false },
};

interface AuthState {
  user: User;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: "google" | "apple" | "github") => Promise<void>;
  register: (input: { email: string; password: string; confirm: string; nickname?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: LOCAL_USER,
      loading: false,
      error: null,

      async signIn(email, password) {
        set({ loading: true, error: null });
        try {
          const user = await api.signIn({ email, password });
          set({ user, loading: false });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ loading: false, error: msg });
          toast.error(t("error.auth.signin"), msg);
          throw e;
        }
      },

      async signInWithProvider(provider) {
        set({ loading: true, error: null });
        try {
          const user = await api.signInWithProvider(provider);
          set({ user, loading: false });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ loading: false, error: msg });
          toast.error(t("error.auth.signin"), msg);
          throw e;
        }
      },

      async register(input) {
        set({ loading: true, error: null });
        try {
          const user = await api.register(input);
          set({ user, loading: false });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ loading: false, error: msg });
          toast.error(t("error.auth.register"), msg);
          throw e;
        }
      },

      async signOut() {
        set({ loading: true, error: null });
        try {
          const user = await api.signOut();
          set({ user, loading: false });
        } catch (e) {
          set({ loading: false });
          toast.error(t("error.auth.signout"), e instanceof Error ? e.message : String(e));
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "lumo.auth.v1",
      // Only persist the user — loading/error are transient.
      partialize: (s) => ({ user: s.user }),
    }
  )
);

/** Convenience selector: is the user signed in (not the local stand-in)? */
export const selectIsSignedIn = (s: AuthState) => !s.user.local && s.user.id !== "local";
