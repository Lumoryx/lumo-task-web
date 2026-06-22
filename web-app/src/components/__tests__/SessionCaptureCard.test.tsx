import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SessionCaptureCard } from "../SessionCaptureCard";

// Silence act() warnings from the countdown timer
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("SessionCaptureCard", () => {
  it("renders both input fields and action buttons", () => {
    render(
      <SessionCaptureCard
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(screen.getByText(/session wrap-up/i)).toBeInTheDocument();
    expect(screen.getByText(/what did you complete/i)).toBeInTheDocument();
    expect(screen.getByText(/what's next/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /end focus/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start next round/i })).toBeInTheDocument();
  });

  it("hides 'Start next round' when hideNextRound=true", () => {
    render(
      <SessionCaptureCard
        hideNextRound
        onSubmit={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /start next round/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /end focus/i })).toBeInTheDocument();
  });

  it("calls onSkip when ESC is pressed", () => {
    const onSkip = vi.fn();
    render(<SessionCaptureCard onSubmit={vi.fn()} onSkip={onSkip} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("calls onSkip automatically after 5 seconds", () => {
    const onSkip = vi.fn();
    render(<SessionCaptureCard onSubmit={vi.fn()} onSkip={onSkip} />);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("pauses countdown when user focuses an input", () => {
    const onSkip = vi.fn();
    render(<SessionCaptureCard onSubmit={vi.fn()} onSkip={onSkip} />);
    const textareas = screen.getAllByRole("textbox");
    fireEvent.focus(textareas[0]);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("calls onSubmit with whatDone + nextStep when End focus is clicked", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SessionCaptureCard onSubmit={onSubmit} onSkip={vi.fn()} />);

    const [whatDoneInput, nextStepInput] = screen.getAllByRole("textbox");
    fireEvent.change(whatDoneInput, { target: { value: "Finished the intro" } });
    fireEvent.change(nextStepInput, { target: { value: "Write the conclusion" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /end focus/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith({
      whatDone: "Finished the intro",
      nextStep: "Write the conclusion",
      action: "end_focus",
    });
  });

  it("calls onSubmit with action=next_round when Start next round is clicked", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SessionCaptureCard onSubmit={onSubmit} onSkip={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /start next round/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith({
      whatDone: "",
      nextStep: "",
      action: "next_round",
    });
  });

  it("calls onSkip when backdrop is clicked", () => {
    const onSkip = vi.fn();
    render(<SessionCaptureCard onSubmit={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId("session-capture-backdrop"));
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
