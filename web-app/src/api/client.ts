/**
 * Mock API client.
 *
 * Public surface mimics what a real REST/RPC layer would expose. All
 * functions are async + return Promises so callers don't change when you
 * swap this out for `fetch()` against a real backend.
 *
 * Persistence: state is held in-memory and snapshotted to
 * `localStorage["lumo.tasks.v1"]` after every mutation, so the demo feels
 * stateful across reloads. Clear that key to reset.
 *
 * Latency: every call awaits `delay(...)` so loading states actually show.
 * Tune via `LATENCY_MS`.
 */

import type { CompletedEntry, Task, User } from "@/types/task";
import { SEED_COMPLETED_TODAY, SEED_TASKS } from "@/mocks/tasks";
import { LOCAL_USER, SEED_USER } from "@/mocks/user";

const STORAGE_KEY = "lumo.tasks.v1";
const LATENCY_MS = 120;

interface PersistedShape {
  tasks: Task[];
  completed: CompletedEntry[];
}

function load(): PersistedShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedShape;
  } catch {
    /* ignore parse errors — fall through to seed */
  }
  return { tasks: structuredClone(SEED_TASKS), completed: structuredClone(SEED_COMPLETED_TODAY) };
}

function save(state: PersistedShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — silently noop in demo */
  }
}

let state: PersistedShape = load();

const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

/* ── Public API ───────────────────────────────────────────────────── */

export const api = {
  /** Current user (mock single-user). */
  async getUser(): Promise<User> {
    await delay(60);
    return SEED_USER;
  },

  /** Sign in with email + password. Mock: any non-empty values pass. */
  async signIn(input: { email: string; password: string }): Promise<User> {
    await delay(400);
    if (!input.email || !input.password) {
      throw new Error("Email and password are required.");
    }
    if (input.password.length < 4) {
      throw new Error("Password must be at least 4 characters.");
    }
    return {
      ...SEED_USER,
      email: input.email,
      name: input.email.split("@")[0] || SEED_USER.name,
      initials: (input.email.slice(0, 2) || "AS").toUpperCase(),
    };
  },

  /** Sign in via an OAuth provider (mock). */
  async signInWithProvider(provider: "google" | "apple" | "github"): Promise<User> {
    await delay(450);
    return { ...SEED_USER, name: `${SEED_USER.name} (${provider})` };
  },

  /** Register a new account. Mock returns a user assembled from the form. */
  async register(input: {
    email: string;
    password: string;
    confirm: string;
    nickname?: string;
  }): Promise<User> {
    await delay(500);
    if (!input.email.includes("@")) throw new Error("Enter a valid email.");
    if (input.password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (input.password !== input.confirm) throw new Error("Passwords don't match.");
    const name = input.nickname?.trim() || input.email.split("@")[0];
    return {
      id: `u${Date.now()}`,
      email: input.email,
      name,
      initials: (name.slice(0, 2) || "U").toUpperCase(),
      local: false,
      plan: "free",
      stats: { tasks: 0, pomodoros: 0, syncOK: true },
    };
  },

  /** Sign out — returns the local-only stand-in. */
  async signOut(): Promise<User> {
    await delay(120);
    return LOCAL_USER;
  },

  /** Full task list. */
  async listTasks(): Promise<Task[]> {
    await delay();
    return structuredClone(state.tasks);
  },

  /** Tasks marked for today's plan. */
  async listToday(): Promise<Task[]> {
    await delay();
    return structuredClone(state.tasks.filter((t) => t.today && !t.completed));
  },

  /** Completed-today log entries. */
  async listCompletedToday(): Promise<CompletedEntry[]> {
    await delay();
    return structuredClone(state.completed);
  },

  /** Create a new task. ID is generated server-side (here: timestamp). */
  async createTask(input: Omit<Task, "id">): Promise<Task> {
    await delay();
    const task: Task = { ...input, id: `t${Date.now()}` };
    state = { ...state, tasks: [task, ...state.tasks] };
    save(state);
    return structuredClone(task);
  },

  /** Patch any subset of fields on an existing task. */
  async updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    await delay();
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx < 0) throw new Error(`Task ${id} not found`);
    const next = { ...state.tasks[idx], ...patch };
    state = {
      ...state,
      tasks: state.tasks.map((t, i) => (i === idx ? next : t)),
    };
    save(state);
    return structuredClone(next);
  },

  /** Mark a task complete; also creates a completed-today log entry. */
  async completeTask(id: string): Promise<void> {
    await delay();
    const task = state.tasks.find((t) => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    const log: CompletedEntry = {
      id: `c${Date.now()}`,
      title: task.title,
      duration: task.duration,
    };
    state = {
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: true, today: false } : t
      ),
      completed: [log, ...state.completed],
    };
    save(state);
  },

  /** Hard-delete a task. */
  async deleteTask(id: string): Promise<void> {
    await delay();
    state = { ...state, tasks: state.tasks.filter((t) => t.id !== id) };
    save(state);
  },

  /** Reset to seed data. Useful in dev. */
  async reset(): Promise<void> {
    await delay(40);
    state = { tasks: structuredClone(SEED_TASKS), completed: structuredClone(SEED_COMPLETED_TODAY) };
    save(state);
  },
};

export type ApiClient = typeof api;
