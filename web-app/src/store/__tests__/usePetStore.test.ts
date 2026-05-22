import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { usePetStore } from "../usePetStore";

beforeEach(() => {
  usePetStore.setState({ activeMsg: null, mood: "idle" });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePetStore — celebrate", () => {
  it("sets mood to excited and activeMsg to the given key", () => {
    usePetStore.getState().celebrate("pet.celebrate.q1");
    expect(usePetStore.getState().mood).toBe("excited");
    expect(usePetStore.getState().activeMsg).toBe("pet.celebrate.q1");
  });

  it("resets mood and message after the duration", () => {
    usePetStore.getState().celebrate("pet.celebrate.q1", 8000);
    vi.advanceTimersByTime(8000);
    expect(usePetStore.getState().mood).toBe("idle");
    expect(usePetStore.getState().activeMsg).toBeNull();
  });

  it("does not reset before the duration elapses", () => {
    usePetStore.getState().celebrate("pet.celebrate.q1", 8000);
    vi.advanceTimersByTime(7999);
    expect(usePetStore.getState().mood).toBe("excited");
  });
});
