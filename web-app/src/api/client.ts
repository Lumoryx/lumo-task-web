/**
 * Real API client — talks to the local Hono/SQLite backend.
 *
 * Base URL is resolved once at startup:
 *  - Electron: port from Electron IPC (injected by main.cjs)
 *  - Dev/web:  VITE_API_BASE env var, or http://localhost:47291/v1
 *
 * JWT token is stored in localStorage and attached to every request.
 */

import type { AppSettings, CompletedEntry, Person, PetChatMessage, Task, User } from "@/types/task";

// ── Base URL ─────────────────────────────────────────────────────────────────

let resolvedBase: string | null = null;

async function getBase(): Promise<string> {
  if (resolvedBase) return resolvedBase;
  if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
    const port = await window.electronAPI.getApiPort();
    resolvedBase = `http://127.0.0.1:${port}/v1`;
  } else {
    resolvedBase = ((import.meta as any).env?.VITE_API_BASE as string | undefined) ?? "http://localhost:47291/v1";
  }
  return resolvedBase;
}

// ── Token ─────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "lumo.token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function req<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const base = await getBase();
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Type adapters (backend snake_case → frontend camelCase where needed) ──────

function adaptTask(raw: any): Task {
  return {
    id: raw.id,
    assignee_ids: raw.assignee_ids ?? [],
    title: raw.title,
    desc: raw.desc ?? undefined,
    quadrant: raw.quadrant,
    today: raw.today,
    due: raw.due ?? null,
    duration: raw.duration,
    pomos_done: raw.pomos_done,
    pomos_total: raw.pomos_total,
    conviction: raw.conviction ?? undefined,
    next_step: raw.next_step ?? undefined,
    reason: raw.reason ?? undefined,
    ai_suggest: raw.ai_suggest ?? undefined,
    completed: raw.completed,
    not_now: raw.not_now ?? [],
  };
}

function adaptEntry(raw: any): CompletedEntry {
  return {
    id: raw.id,
    taskId: raw.task_id ?? undefined,
    title: raw.title,
    duration: raw.duration,
    quadrant: raw.quadrant ?? undefined,
    startedAt: raw.startedAt ?? undefined,
    completedAt: raw.completedAt ?? undefined,
  };
}

function adaptPerson(raw: any): Person {
  return {
    id: raw.id,
    name: raw.name,
    initials: raw.initials,
    color: raw.color,
    email: raw.email ?? undefined,
  };
}

// ── Local stand-in user (no-auth fallback) ────────────────────────────────────

const LOCAL_USER: User = {
  id: "local",
  name: "You",
  email: "",
  initials: "YO",
  local: true,
  plan: "free",
  stats: { tasks: 0, pomodoros: 0, syncOK: false },
};

// ── Public API ────────────────────────────────────────────────────────────────

export const api = {
  async getUser(): Promise<User> {
    return req<User>("GET", "/user");
  },

  async signIn(input: { email: string; password: string }): Promise<User> {
    const res = await req<{ token: string; user: User }>("POST", "/auth/signin", input);
    setToken(res.token);
    return res.user;
  },

  async signInWithProvider(_provider: "google" | "apple" | "github"): Promise<User> {
    throw new Error("OAuth providers are not yet supported in local mode.");
  },

  async register(input: {
    email: string;
    password: string;
    confirm: string;
    nickname?: string;
  }): Promise<User> {
    if (input.password !== input.confirm) throw new Error("Passwords don't match.");
    const res = await req<{ token: string; user: User }>("POST", "/auth/register", {
      email: input.email,
      password: input.password,
      name: input.nickname?.trim() || input.email.split("@")[0],
    });
    setToken(res.token);
    return res.user;
  },

  async signOut(): Promise<User> {
    await req("POST", "/auth/signout").catch(() => {});
    clearToken();
    return LOCAL_USER;
  },

  async listTasks(): Promise<Task[]> {
    const rows = await req<any[]>("GET", "/tasks");
    return rows.map(adaptTask);
  },

  async listToday(): Promise<Task[]> {
    const all = await this.listTasks();
    return all.filter((t) => t.today && !t.completed);
  },

  async listCompletedToday(): Promise<CompletedEntry[]> {
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rows = await req<any[]>("GET", `/completed?date=${date}`);
    return rows.map(adaptEntry);
  },

  async createTask(input: Omit<Task, "id">): Promise<Task> {
    const raw = await req<any>("POST", "/tasks", {
      title: input.title,
      desc: input.desc ?? null,
      quadrant: input.quadrant,
      today: input.today,
      due: input.due ?? null,
      duration: input.duration,
      pomos_total: input.pomos_total,
      assignee_ids: input.assignee_ids ?? [],
      conviction: input.conviction ?? null,
      next_step: input.next_step ?? null,
      reason: input.reason ?? null,
      ai_suggest: input.ai_suggest ?? null,
      not_now: input.not_now ?? [],
    });
    return adaptTask(raw);
  },

  async updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    const raw = await req<any>("PATCH", `/tasks/${id}`, {
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.desc !== undefined && { desc: patch.desc }),
      ...(patch.quadrant !== undefined && { quadrant: patch.quadrant }),
      ...(patch.today !== undefined && { today: patch.today }),
      ...(patch.due !== undefined && { due: patch.due }),
      ...(patch.duration !== undefined && { duration: patch.duration }),
      ...(patch.pomos_total !== undefined && { pomos_total: patch.pomos_total }),
      ...(patch.assignee_ids !== undefined && { assignee_ids: patch.assignee_ids }),
      ...(patch.conviction !== undefined && { conviction: patch.conviction }),
      ...(patch.next_step !== undefined && { next_step: patch.next_step }),
      ...(patch.reason !== undefined && { reason: patch.reason }),
      ...(patch.ai_suggest !== undefined && { ai_suggest: patch.ai_suggest }),
      ...(patch.not_now !== undefined && { not_now: patch.not_now }),
    });
    return adaptTask(raw);
  },

  async completeTask(id: string): Promise<void> {
    await req("POST", `/tasks/${id}/complete`);
  },

  async uncompleteTask(logId: string): Promise<void> {
    await req("POST", `/completed/${logId}/reopen`);
  },

  async deleteTask(id: string): Promise<void> {
    await req("DELETE", `/tasks/${id}`);
  },

  async listPeople(): Promise<Person[]> {
    const rows = await req<any[]>("GET", "/people");
    return rows.map(adaptPerson);
  },

  async createPerson(input: Omit<Person, "id">): Promise<Person> {
    const raw = await req<any>("POST", "/people", input);
    return adaptPerson(raw);
  },

  async updatePerson(id: string, patch: Partial<Omit<Person, "id">>): Promise<Person> {
    const raw = await req<any>("PATCH", `/people/${id}`, patch);
    return adaptPerson(raw);
  },

  async deletePerson(id: string): Promise<void> {
    await req("DELETE", `/people/${id}`);
  },

  async reset(): Promise<void> {
    // No-op in real API — data is persistent.
  },

  async getSettings(): Promise<AppSettings> {
    return req<AppSettings>("GET", "/settings");
  },

  async patchSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    return req<AppSettings>("PATCH", "/settings", patch);
  },

  async petChat(body: {
    messages: Pick<PetChatMessage, "role" | "content">[];
    context: {
      page?: string;
      todayTasks?: { id: string; title: string; quadrant: string }[];
      q1Count?: number;
      recentCompleted?: { title: string; completedAt: string }[];
      locale?: string;
      userName?: string;
    };
  }): Promise<{ reply: string; mood: "idle" | "happy" | "excited"; fallback: boolean }> {
    return req("POST", "/ai/chat", body);
  },
};

export type ApiClient = typeof api;
