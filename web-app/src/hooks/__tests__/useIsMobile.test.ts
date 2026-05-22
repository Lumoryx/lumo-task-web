import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";

import { useIsMobile } from "../useIsMobile";

function mockMatchMedia(matches: boolean) {
  const listeners: ((e: { matches: boolean }) => void)[] = [];
  const mq = {
    matches,
    addEventListener: vi.fn((_: string, cb: any) => listeners.push(cb)),
    removeEventListener: vi.fn((_: string, cb: any) => {
      const i = listeners.indexOf(cb);
      if (i !== -1) listeners.splice(i, 1);
    }),
    _fire(m: boolean) {
      listeners.forEach((cb) => cb({ matches: m }));
    },
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => mq),
  });
  return mq;
}

describe("useIsMobile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when viewport is wide (≥640px)", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when viewport is narrow (<640px)", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when viewport changes", () => {
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    act(() => mq._fire(true));
    expect(result.current).toBe(true);
  });
});
