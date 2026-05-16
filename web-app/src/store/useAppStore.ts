/**
 * App-level UI state: route, language, theme, density, reduced motion.
 *
 * Task data lives in `useTasksStore.ts` to keep server-state and UI-state
 * separate.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/types/task";

export type Accent = "green" | "cyan" | "amber" | "graphite";
export type Density = "comfortable" | "compact";
export type Route = "today" | "matrix" | "focus" | "settings";

const ACCENT_THEMES: Record<Accent, {
  primary: string; dim: string; glow: string; fog: string; edge: string;
}> = {
  green: {
    primary: "#3DFFA0", dim: "#1A7A4A",
    glow: "rgba(61, 255, 160, 0.25)", fog: "rgba(61, 255, 160, 0.10)", edge: "rgba(61, 255, 160, 0.50)",
  },
  cyan: {
    primary: "#38D4D4", dim: "#1F6E73",
    glow: "rgba(56, 212, 212, 0.25)", fog: "rgba(56, 212, 212, 0.10)", edge: "rgba(56, 212, 212, 0.50)",
  },
  amber: {
    primary: "#FFAA44", dim: "#9F6420",
    glow: "rgba(255, 170, 68, 0.22)", fog: "rgba(255, 170, 68, 0.10)", edge: "rgba(255, 170, 68, 0.50)",
  },
  graphite: {
    primary: "#A0ADB0", dim: "#52605E",
    glow: "rgba(160, 173, 176, 0.20)", fog: "rgba(160, 173, 176, 0.10)", edge: "rgba(160, 173, 176, 0.40)",
  },
};

export function applyAccentTheme(accent: Accent) {
  const t = ACCENT_THEMES[accent];
  const r = document.documentElement;
  r.style.setProperty("--accent-primary", t.primary);
  r.style.setProperty("--accent-dim", t.dim);
  r.style.setProperty("--accent-glow", t.glow);
  r.style.setProperty("--accent-fog", t.fog);
  r.style.setProperty("--accent-edge", t.edge);
}

interface AppState {
  locale: Locale;
  accent: Accent;
  density: Density;
  reducedMotion: boolean;
  /** Whether the user has completed (or skipped) onboarding. */
  onboarded: boolean;
  setLocale: (l: Locale) => void;
  setAccent: (a: Accent) => void;
  setDensity: (d: Density) => void;
  setReducedMotion: (b: boolean) => void;
  setOnboarded: (b: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: "en",
      accent: "green",
      density: "comfortable",
      reducedMotion: false,
      onboarded: false,
      setLocale: (locale) => set({ locale }),
      setAccent: (accent) => {
        applyAccentTheme(accent);
        set({ accent });
      },
      setDensity: (density) => set({ density }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    { name: "lumo.app.v1" }
  )
);
