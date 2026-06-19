import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Minimal fetch mock helpers
function mockFetch(status: number, body: unknown) {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
  } as Response;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  // Reset modules so the client's module-level "session expired notified"
  // guard starts fresh for every test.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client — 401 session-expired handling", () => {
  it("dispatches lumo:session-expired on 401 from a protected endpoint", async () => {
    // Arrange: simulate an expired-token 401 from /tasks
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Token expired" } });
    localStorage.setItem("lumo.token", "old-jwt");

    const dispatched: Event[] = [];
    const handler = (e: Event) => dispatched.push(e);
    window.addEventListener("lumo:session-expired", handler);

    // Act: import client *after* stubbing fetch so it picks up the stub
    const { api } = await import("../client");
    try {
      await api.listTasks();
    } catch {
      // expected to throw
    }

    expect(dispatched).toHaveLength(1);
    // Token must be wiped from localStorage
    expect(localStorage.getItem("lumo.token")).toBeNull();

    window.removeEventListener("lumo:session-expired", handler);
  });

  it("does NOT dispatch lumo:session-expired on 401 from /auth/signout", async () => {
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Token expired" } });
    localStorage.setItem("lumo.token", "old-jwt");

    const dispatched: Event[] = [];
    const handler = (e: Event) => dispatched.push(e);
    window.addEventListener("lumo:session-expired", handler);

    const { api } = await import("../client");
    // signOut swallows its own error via .catch(() => {})
    await api.signOut();

    expect(dispatched).toHaveLength(0);

    window.removeEventListener("lumo:session-expired", handler);
  });

  it("does NOT dispatch lumo:session-expired on 401 from /auth/signin (wrong credentials)", async () => {
    // No token in localStorage — this is a fresh login attempt, not an expiry.
    mockFetch(401, { error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } });

    const dispatched: Event[] = [];
    const handler = (e: Event) => dispatched.push(e);
    window.addEventListener("lumo:session-expired", handler);

    const { api } = await import("../client");
    await expect(api.signIn({ email: "a@b.com", password: "wrong" })).rejects.toThrow();

    expect(dispatched).toHaveLength(0);

    window.removeEventListener("lumo:session-expired", handler);
  });

  it("dispatches lumo:session-expired only once for a burst of parallel 401s", async () => {
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Token expired" } });
    localStorage.setItem("lumo.token", "old-jwt");

    const dispatched: Event[] = [];
    const handler = (e: Event) => dispatched.push(e);
    window.addEventListener("lumo:session-expired", handler);

    const { api } = await import("../client");
    // Mirrors the App bootstrap firing several authenticated loads at once.
    await Promise.allSettled([api.listTasks(), api.listPeople(), api.listTasks()]);

    expect(dispatched).toHaveLength(1);

    window.removeEventListener("lumo:session-expired", handler);
  });
});
