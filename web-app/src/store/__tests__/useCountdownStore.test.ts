import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useCountdownStore } from "../useCountdownStore";

// Keep localStorage clean between tests
beforeEach(() => {
  localStorage.clear();
  useCountdownStore.setState({ events: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const UID = "user_test_1";

describe("useCountdownStore", () => {
  it("load returns empty array for local (unauthenticated) user", () => {
    useCountdownStore.getState().load("local");
    expect(useCountdownStore.getState().events).toEqual([]);
    // Must not write anything to localStorage for local user
    expect(localStorage.getItem("lumo.countdowns.v1.local")).toBeNull();
  });

  it("load returns empty array for a new user with no stored data", () => {
    useCountdownStore.getState().load(UID);
    expect(useCountdownStore.getState().events).toEqual([]);
  });

  it("create adds an event and persists it", () => {
    useCountdownStore.getState().load(UID);
    const event = useCountdownStore.getState().create(UID, {
      title: "My Birthday",
      date: "2026-08-14",
      color: "amber",
      repeat: "yearly",
    });
    const events = useCountdownStore.getState().events;
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("My Birthday");
    expect(events[0].id).toBe(event.id);

    // Verify persistence
    const stored = JSON.parse(localStorage.getItem("lumo.countdowns.v1." + UID)!);
    expect(stored).toHaveLength(1);
  });

  it("update patches an existing event", () => {
    useCountdownStore.getState().load(UID);
    const ev = useCountdownStore.getState().create(UID, {
      title: "Old Title",
      date: "2026-08-14",
      color: "green",
      repeat: "none",
    });
    useCountdownStore.getState().update(UID, ev.id, { title: "New Title" });
    const events = useCountdownStore.getState().events;
    expect(events[0].title).toBe("New Title");
  });

  it("remove deletes an event", () => {
    useCountdownStore.getState().load(UID);
    const ev = useCountdownStore.getState().create(UID, {
      title: "To Delete",
      date: "2026-08-14",
      color: "red",
      repeat: "none",
    });
    expect(useCountdownStore.getState().events).toHaveLength(1);
    useCountdownStore.getState().remove(UID, ev.id);
    expect(useCountdownStore.getState().events).toHaveLength(0);
  });

  it("clear empties events regardless of userId", () => {
    useCountdownStore.getState().load(UID);
    useCountdownStore.getState().create(UID, {
      title: "Something",
      date: "2026-08-14",
      color: "cyan",
      repeat: "none",
    });
    useCountdownStore.getState().clear();
    expect(useCountdownStore.getState().events).toEqual([]);
  });

  it("two users do not share countdown data", () => {
    const uid2 = "user_test_2";
    useCountdownStore.getState().load(UID);
    useCountdownStore.getState().create(UID, {
      title: "User1 Event",
      date: "2026-08-14",
      color: "green",
      repeat: "none",
    });

    // Switch to user2 — should see empty list
    useCountdownStore.getState().load(uid2);
    expect(useCountdownStore.getState().events).toHaveLength(0);
  });
});
