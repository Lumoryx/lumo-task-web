import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FocusSessionCaptureCard } from "../FocusSessionCaptureCard";

vi.mock("@/i18n/useT", () => ({
  useT: () => (key: string) => key,
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, createPortal: (node: unknown) => node };
});

const onSubmit = vi.fn().mockResolvedValue(undefined);
const onSkip = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FocusSessionCaptureCard", () => {
  it("renders dialog, labels, inputs, and action buttons", () => {
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("focus.capture.accomplished.label")).toBeInTheDocument();
    expect(screen.getByLabelText("focus.capture.nextstep.label")).toBeInTheDocument();
    expect(screen.getByText("focus.capture.nextround")).toBeInTheDocument();
    expect(screen.getByText("focus.capture.endfocus")).toBeInTheDocument();
  });

  it("hides 'Start next round' when showNextRound=false", () => {
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} showNextRound={false} />);
    expect(screen.queryByText("focus.capture.nextround")).not.toBeInTheDocument();
    expect(screen.getByText("focus.capture.endfocus")).toBeInTheDocument();
  });

  it("calls onSubmit with 'end-focus' and typed values", async () => {
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} />);

    fireEvent.change(screen.getByLabelText("focus.capture.accomplished.label"), {
      target: { value: "wrote tests" },
    });
    fireEvent.change(screen.getByLabelText("focus.capture.nextstep.label"), {
      target: { value: "deploy to prod" },
    });
    fireEvent.click(screen.getByText("focus.capture.endfocus"));

    expect(onSubmit).toHaveBeenCalledWith({
      accomplished: "wrote tests",
      nextStep: "deploy to prod",
      action: "end-focus",
    });
  });

  it("calls onSubmit with 'next-round' action", () => {
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} />);
    fireEvent.click(screen.getByText("focus.capture.nextround"));
    expect(onSubmit).toHaveBeenCalledWith({
      accomplished: "",
      nextStep: "",
      action: "next-round",
    });
  });

  it("calls onSkip when Escape key is pressed", () => {
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onSkip).toHaveBeenCalled();
  });

  it("calls onSkip when skip button is clicked", () => {
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} />);
    // Skip button shows countdown key or plain skip key
    const skipBtn = screen.getByText(/focus\.capture\.skip/);
    fireEvent.click(skipBtn);
    expect(onSkip).toHaveBeenCalled();
  });

  it("submits on Enter in next step input", () => {
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} />);
    fireEvent.keyDown(screen.getByLabelText("focus.capture.nextstep.label"), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith({
      accomplished: "",
      nextStep: "",
      action: "end-focus",
    });
  });

  it("auto-skips after 5 seconds", async () => {
    vi.useFakeTimers();
    render(<FocusSessionCaptureCard onSubmit={onSubmit} onSkip={onSkip} />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onSkip).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
