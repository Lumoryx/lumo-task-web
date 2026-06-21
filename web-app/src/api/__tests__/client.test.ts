import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client — 401 session-expired handling", () => {
  it("dispatches lumo:session-expired on 401 from a protected endpoint", async () => {
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Token expired" } });
    localStorage.setItem("lumo.token", "old-jwt");

    const dispatched: Event[] = [];
    const handler = (e: Event) => dispatched.push(e);
    window.addEventListener("lumo:session-expired", handler);

    const { api } = await import("../client");
    try { await api.listTasks(); } catch { /* expected */ }

    expect(dispatched).toHaveLength(1);
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
    await api.signOut(); // swallows error internally

    expect(dispatched).toHaveLength(0);

    window.removeEventListener("lumo:session-expired", handler);
  });

  it("does NOT dispatch lumo:session-expired on 401 with no token (e.g. wrong password)", async () => {
    mockFetch(401, { error: { code: "INVALID_CREDENTIALS", message: "Wrong password" } });
    // No token in localStorage — simulates the login page scenario

    const dispatched: Event[] = [];
    const handler = (e: Event) => dispatched.push(e);
    window.addEventListener("lumo:session-expired", handler);

    const { api } = await import("../client");
    try {
      await api.signIn({ email: "a@b.com", password: "wrong" });
    } catch { /* expected */ }

    expect(dispatched).toHaveLength(0);

    window.removeEventListener("lumo:session-expired", handler);
  });

  it("dispatches lumo:session-expired only once when concurrent requests all return 401", async () => {
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Token expired" } });
    localStorage.setItem("lumo.token", "old-jwt");

    const dispatched: Event[] = [];
    const handler = (e: Event) => dispatched.push(e);
    window.addEventListener("lumo:session-expired", handler);

    const { api } = await import("../client");
    await Promise.allSettled([api.listTasks(), api.listTasks(), api.listTasks()]);

    expect(dispatched).toHaveLength(1);

    window.removeEventListener("lumo:session-expired", handler);
  });
});
