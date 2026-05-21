import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

// Suppress expected console.error output from React during error boundary tests
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test explosion");
  return <div>Normal child</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    consoleError.mockClear();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Normal child")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByText("Normal child")).not.toBeInTheDocument();
    // Fallback should mention something went wrong
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not crash the entire tree — sibling components still render", () => {
    render(
      <div>
        <span>Outside</span>
        <ErrorBoundary>
          <Bomb shouldThrow={true} />
        </ErrorBoundary>
      </div>
    );
    expect(screen.getByText("Outside")).toBeInTheDocument();
  });
});
