import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuadrantBreakdown } from "../QuadrantBreakdown";
import type { QuadrantCount } from "@/utils/stats";

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

function makeBreakdown(overrides: Partial<Record<string, number>> = {}): QuadrantCount[] {
  const counts: Record<string, number> = {
    Q1: 0, Q2: 0, Q3: 0, Q4: 0, unclassified: 0, ...overrides,
  };
  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  return (["Q1", "Q2", "Q3", "Q4", "unclassified"] as const).map((q) => ({
    quadrant: q,
    count: counts[q],
    percent: total > 0 ? Math.round((counts[q] / total) * 100) : 0,
  }));
}

describe("QuadrantBreakdown", () => {
  it("renders all 5 quadrant rows", () => {
    render(<QuadrantBreakdown breakdown={makeBreakdown()} />);
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Q2")).toBeInTheDocument();
    expect(screen.getByText("Q3")).toBeInTheDocument();
    expect(screen.getByText("Q4")).toBeInTheDocument();
    expect(screen.getByText("stats.quadrant.unclassified")).toBeInTheDocument();
  });

  it("shows dash for zero-count rows", () => {
    render(<QuadrantBreakdown breakdown={makeBreakdown()} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(5);
  });

  it("shows count · percent for non-zero rows", () => {
    render(<QuadrantBreakdown breakdown={makeBreakdown({ Q1: 3, Q2: 1 })} />);
    expect(screen.getByText("3 · 75%")).toBeInTheDocument();
    expect(screen.getByText("1 · 25%")).toBeInTheDocument();
  });

  it("renders progress bars with ARIA attributes", () => {
    const breakdown = makeBreakdown({ Q1: 5 });
    render(<QuadrantBreakdown breakdown={breakdown} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars.length).toBe(5);
    const q1Bar = bars.find((b) => b.getAttribute("aria-label")?.startsWith("Q1"));
    expect(q1Bar).toBeDefined();
    expect(q1Bar?.getAttribute("aria-valuenow")).toBe("100");
    expect(q1Bar?.getAttribute("aria-valuemin")).toBe("0");
    expect(q1Bar?.getAttribute("aria-valuemax")).toBe("100");
  });

  it("does not show callout when total < 5", () => {
    render(<QuadrantBreakdown breakdown={makeBreakdown({ Q2: 4 })} />);
    expect(screen.queryByText(/stats\.quadrant\.callout/)).not.toBeInTheDocument();
  });

  it("shows q2good callout when Q2 >= 30%", () => {
    render(<QuadrantBreakdown breakdown={makeBreakdown({ Q1: 3, Q2: 3, Q3: 1, Q4: 1, unclassified: 2 })} />);
    expect(screen.getByText("stats.quadrant.callout.q2good")).toBeInTheDocument();
  });

  it("shows q1heavy callout when Q1 >= 60% and Q2 < 30%", () => {
    render(<QuadrantBreakdown breakdown={makeBreakdown({ Q1: 6, Q3: 2, Q4: 2 })} />);
    expect(screen.getByText("stats.quadrant.callout.q1heavy")).toBeInTheDocument();
  });

  it("shows q3q4high callout when Q3+Q4 >= 40%", () => {
    render(<QuadrantBreakdown breakdown={makeBreakdown({ Q1: 3, Q3: 3, Q4: 4 })} />);
    expect(screen.getByText("stats.quadrant.callout.q3q4high")).toBeInTheDocument();
  });
});
