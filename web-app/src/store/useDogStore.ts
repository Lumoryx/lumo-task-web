import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DogTier = "puppy" | "adult" | "wise" | "legendary";

export const XP_PER_TASK = 10;

export function getLevelFromXP(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export function getTierFromLevel(level: number): DogTier {
  if (level <= 15) return "puppy";
  if (level <= 30) return "adult";
  if (level <= 45) return "wise";
  return "legendary";
}

const TIER_NAMES: Record<DogTier, { en: string; zh: string }> = {
  puppy:     { en: "Puppy",     zh: "幼犬" },
  adult:     { en: "Adult",     zh: "成犬" },
  wise:      { en: "Wise",      zh: "智慧犬" },
  legendary: { en: "Legendary", zh: "传奇" },
};

export function getTierName(tier: DogTier, locale: "en" | "zh"): string {
  return TIER_NAMES[tier][locale];
}

interface DogState {
  xp: number;
  level: number;
  initialized: boolean;
  pendingLevelUp: number | null;
  addXP: (amount: number) => void;
  clearPendingLevelUp: () => void;
  initFromStats: (tasksCompleted: number, focusMinutes: number) => void;
}

export const useDogStore = create<DogState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      initialized: false,
      pendingLevelUp: null,

      addXP(amount: number) {
        const { xp, level } = get();
        const newXP = xp + amount;
        const newLevel = getLevelFromXP(newXP);
        set({
          xp: newXP,
          level: newLevel,
          pendingLevelUp: newLevel > level ? newLevel : get().pendingLevelUp,
        });
      },

      clearPendingLevelUp() {
        set({ pendingLevelUp: null });
      },

      initFromStats(tasksCompleted: number, focusMinutes: number) {
        if (get().initialized) return;
        const initialXP = tasksCompleted * XP_PER_TASK + focusMinutes;
        set({
          xp: initialXP,
          level: getLevelFromXP(initialXP),
          initialized: true,
        });
      },
    }),
    {
      name: "lumo.dog",
      partialize: (s) => ({ xp: s.xp, level: s.level, initialized: s.initialized }),
    }
  )
);
