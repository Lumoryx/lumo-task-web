import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PetSpecies } from "@/components/PetSvg";

export type PetMood = "idle" | "happy" | "excited";

interface PetStore {
  pos: { x: number; y: number };
  visible: boolean;
  activeMsg: string | null;
  mood: PetMood;
  species: PetSpecies;
  petName: string;
  setPos: (pos: { x: number; y: number }) => void;
  setMsg: (key: string | null) => void;
  setMood: (mood: PetMood) => void;
  toggleVisible: () => void;
  celebrate: (msgKey: string, durationMs?: number) => void;
  setSpecies: (species: PetSpecies) => void;
  setPetName: (name: string) => void;
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
      species: "dog",
      petName: "",
      setPos: (pos) => set({ pos }),
      setMsg: (activeMsg) => set({ activeMsg }),
      setMood: (mood) => set({ mood }),
      toggleVisible: () => set((s) => ({ visible: !s.visible })),
      celebrate: (msgKey, durationMs = 8000) => {
        set({ activeMsg: msgKey, mood: "excited" });
        setTimeout(() => set({ activeMsg: null, mood: "idle" }), durationMs);
      },
      setSpecies: (species) => set({ species }),
      setPetName: (petName) => set({ petName }),
    }),
    {
      name: "lumo-pet",
      partialize: (s) => ({ pos: s.pos, visible: s.visible, species: s.species, petName: s.petName }),
    }
  )
);
