import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock useAIStore so forceSignOut doesn't blow up in jsdom
vi.mock("@/store/useAIStore", () => ({
  useAIStore: {
    getState: () => ({
      closeChat: vi.fn(),
      clearHistory: vi.fn(),
    }),
    persist: { clearStorage: vi.fn() },
  },
}));

// Import after mocking
import { useAuthStore } from "../useAuthStore";

const SIGNED_IN_USER = {
  id: "user_abc",
  name: "Alice",
  email: "alice@example.com",
  initials: "AL",
  local: false,
  plan: "free" as const,
  stats: { tasks: 0, pomodoros: 0, syncOK: false },
};

beforeEach(() => {
  useAuthStore.setState({ user: SIGNED_IN_USER, loading: false, error: null });
});

describe("useAuthStore.forceSignOut", () => {
  it("resets user to the local stand-in", () => {
    useAuthStore.getState().forceSignOut();
    const user = useAuthStore.getState().user;
    expect(user.local).toBe(true);
    expect(user.id).toBe("local");
  });

  it("clears loading and error state", () => {
    useAuthStore.setState({ loading: true, error: "some error" });
    useAuthStore.getState().forceSignOut();
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
  });
});
