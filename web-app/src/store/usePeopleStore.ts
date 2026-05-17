import { create } from "zustand";
import { api } from "@/api/client";
import type { Person } from "@/types/task";

interface PeopleState {
  people: Person[];
  loading: boolean;
  // selectors
  byId: (id: string) => Person | undefined;
  // actions
  load: () => Promise<void>;
  create: (input: Omit<Person, "id">) => Promise<Person>;
  update: (id: string, patch: Partial<Omit<Person, "id">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  people: [],
  loading: false,

  byId: (id) => get().people.find((p) => p.id === id),

  async load() {
    set({ loading: true });
    try {
      const people = await api.listPeople();
      set({ people, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  async create(input) {
    const person = await api.createPerson(input);
    set({ people: [...get().people, person] });
    return person;
  },

  async update(id, patch) {
    const next = await api.updatePerson(id, patch);
    set({ people: get().people.map((p) => (p.id === id ? next : p)) });
  },

  async remove(id) {
    await api.deletePerson(id);
    set({ people: get().people.filter((p) => p.id !== id) });
  },
}));
