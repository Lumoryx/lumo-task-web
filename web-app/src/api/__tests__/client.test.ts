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
    window.addEventListener("lumo:session-expired", (e) => dispatched.push(e));

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

    window.removeEventListener("lumo:session-expired", (e) => dispatched.push(e));
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
});
