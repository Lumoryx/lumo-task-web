import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/useT";
import { IconArrowRight, IconPlay } from "@/components/icons";

interface Props {
  /** Whether the capture is triggered by "Mark complete" (vs timer end / exit) */
  intent: "complete" | "timer" | "exit";
  onSubmit: (data: { whatDone: string; nextStep: string }, action: "next_round" | "end") => Promise<void>;
  onSkip: () => void;
}

const SKIP_SECONDS = 5;

export function FocusExitCaptureCard({ intent, onSubmit, onSkip }: Props) {
  const t = useT();
  const [whatDone, setWhatDone] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(SKIP_SECONDS);
  const countdownRef = useRef(SKIP_SECONDS);
  const hasInteractedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const whatDoneRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the first input on mount
  useEffect(() => {
    whatDoneRef.current?.focus();
  }, []);

  // Start skip countdown; pause it once the user interacts
  useEffect(() => {
    countdownRef.current = SKIP_SECONDS;
    intervalRef.current = setInterval(() => {
      if (hasInteractedRef.current) return;
      const next = countdownRef.current - 1;
      countdownRef.current = next;
      setCountdown(next);
      if (next <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onSkip();
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // onSkip is stable — no dep needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markInteracted() {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setCountdown(0); // hide countdown
    }
  }

  async function handleAction(action: "next_round" | "end") {
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit({ whatDone, nextStep }, action);
    } finally {
      setBusy(false);
    }
  }

  const skipLabel = t("focus.capture.btn.skip").replace("{n}", String(countdown));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={() => !busy && onSkip()}
      />

      {/* Card — bottom drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{ padding: "0 0 env(safe-area-inset-bottom, 0)" }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: "var(--bg-elevated)",
            borderTop: "1px solid var(--border-default)",
            borderRadius: "20px 20px 0 0",
            padding: "28px 28px 32px",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.35)",
            animation: "slideUp 0.28s var(--ease-default)",
          }}
          onMouseDown={markInteracted}
          onTouchStart={markInteracted}
          onKeyDown={markInteracted}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("focus.capture.title")}
            </h3>
            {!hasInteractedRef.current && countdown > 0 && (
              <button
                onClick={() => !busy && onSkip()}
                style={{
                  fontSize: 12,
                  color: "var(--text-faint)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                {skipLabel}
              </button>
            )}
          </div>

          {/* What done */}
          <div className="mb-4">
            <label
              style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}
            >
              {t("focus.capture.what_done")}
            </label>
            <textarea
              ref={whatDoneRef}
              value={whatDone}
              onChange={(e) => { markInteracted(); setWhatDone(e.target.value); }}
              placeholder={t("focus.capture.what_done.placeholder")}
              rows={2}
              style={{
                width: "100%",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                color: "var(--text-primary)",
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
                boxSizing: "border-box",
                transition: "border-color 150ms",
              }}
              onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--accent-primary)"; }}
              onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border-default)"; }}
              onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); (document.getElementById("focus-capture-nextstep") as HTMLInputElement)?.focus(); } }}
            />
          </div>

          {/* Next step */}
          <div className="mb-6">
            <label
              style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}
            >
              {t("focus.capture.next_step")}
            </label>
            <input
              id="focus-capture-nextstep"
              type="text"
              value={nextStep}
              onChange={(e) => { markInteracted(); setNextStep(e.target.value); }}
              placeholder={t("focus.capture.next_step.placeholder")}
              style={{
                width: "100%",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                color: "var(--text-primary)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 150ms",
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--accent-primary)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"; }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAction("end"); }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {intent !== "complete" && (
              <button
                disabled={busy}
                onClick={() => handleAction("next_round")}
                className="flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.6 : 1,
                  justifyContent: "center",
                }}
              >
                <IconPlay size={13} />
                {t("focus.capture.btn.next_round")}
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => handleAction("end")}
              className="flex items-center gap-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                flex: intent === "complete" ? 1 : undefined,
                padding: "10px 24px",
                background: "var(--accent-primary)",
                border: "1.5px solid var(--accent-primary)",
                color: "var(--bg-base)",
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
                boxShadow: "0 0 16px var(--accent-fog)",
                justifyContent: "center",
              }}
            >
              <IconArrowRight size={13} />
              {t("focus.capture.btn.end")}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
