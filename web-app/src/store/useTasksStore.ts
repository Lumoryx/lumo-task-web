/**
 * Task store — backed by the mock API client.
 *
 * Holds an in-memory cache plus loading flags so components can render
 * skeletons / show errors. Mutations call the API then update local
 * state from the response, which keeps the cache in sync with whatever
 * the (real or mock) backend says is canonical.
 */

import { create } from "zustand";
import { api } from "@/api/client";
import type { CompletedEntry, Task } from "@/types/task";

interface TasksState {
  tasks: Task[];
  completed: CompletedEntry[];
  loading: boolean;
  error: string | null;
  // selectors
  byQuadrant: (q: Task["quadrant"]) => Task[];
  todayTasks: () => Task[];
  // actions
  load: () => Promise<void>;
  create: (input: Omit<Task, "id">) => Promise<Task>;
  update: (id: string, patch: Partial<Task>) => Promise<void>;
  complete: (id: string) => Promise<void>;
  reopen: (logId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  completed: [],
  loading: false,
  error: null,

  byQuadrant: (q) => get().tasks.filter((t) => t.quadrant === q && !t.completed),
  todayTasks: () => get().tasks.filter((t) => t.today && !t.completed),

  async load() {
    set({ loading: true, error: null });
    try {
      const [tasks, completed] = await Promise.all([api.listTasks(), api.listCompletedToday()]);
      set({ tasks, completed, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  async create(input) {
    const task = await api.createTask(input);
    set({ tasks: [task, ...get().tasks] });
    return task;
  },

  async update(id, patch) {
    const next = await api.updateTask(id, patch);
    set({ tasks: get().tasks.map((t) => (t.id === id ? next : t)) });
  },

  async complete(id) {
    await api.completeTask(id);
    const [tasks, completed] = await Promise.all([api.listTasks(), api.listCompletedToday()]);
    set({ tasks, completed });
  },

  async reopen(logId) {
    await api.uncompleteTask(logId);
    const [tasks, completed] = await Promise.all([api.listTasks(), api.listCompletedToday()]);
    set({ tasks, completed });
  },

  async remove(id) {
    await api.deleteTask(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },

  async reset() {
    await api.reset();
    await get().load();
  },
}));
