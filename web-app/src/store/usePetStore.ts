import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PetMood = "idle" | "happy" | "excited";

interface PetStore {
  pos: { x: number; y: number };
  visible: boolean;
  activeMsg: string | null;
  mood: PetMood;
  setPos: (pos: { x: number; y: number }) => void;
  setMsg: (key: string | null) => void;
  setMood: (mood: PetMood) => void;
  toggleVisible: () => void;
}

function defaultPos() {
  if (typeof window === "undefined") return { x: 900, y: 600 };
  return { x: window.innerWidth - 110, y: window.innerHeight - 180 };
}

export const usePetStore = create<PetStore>()(
  persist(
    (set) => ({
      pos: defaultPos(),
      visible: true,
      activeMsg: null,
      mood: "idle",
      setPos: (pos) => set({ pos }),
      setMsg: (activeMsg) => set({ activeMsg }),
      setMood: (mood) => set({ mood }),
      toggleVisible: () => set((s) => ({ visible: !s.visible })),
    }),
    {
      name: "lumo-pet",
      partialize: (s) => ({ pos: s.pos, visible: s.visible }),
    }
  )
);
