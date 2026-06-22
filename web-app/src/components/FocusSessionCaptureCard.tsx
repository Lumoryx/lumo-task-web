import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/i18n/useT";

const SKIP_COUNTDOWN = 5;

interface Props {
  onSubmit: (params: {
    accomplished: string;
    nextStep: string;
    action: "next-round" | "end-focus";
  }) => void;
  onSkip: () => void;
  /** Hide "Start next round" when the session was triggered by completing the task. */
  showNextRound?: boolean;
}

export function FocusSessionCaptureCard({ onSubmit, onSkip, showNextRound = true }: Props) {
  const t = useT();
  const [accomplished, setAccomplished] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [countdown, setCountdown] = useState(SKIP_COUNTDOWN);
  const [busy, setBusy] = useState(false);
  const onSkipRef = useRef(onSkip);
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => { onSkipRef.current = onSkip; }, [onSkip]);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

  // 5-second auto-skip countdown
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          onSkipRef.current();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Esc = skip
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkipRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function handleAction(action: "next-round" | "end-focus") {
    setBusy(true);
    try {
      await onSubmitRef.current({ accomplished, nextStep, action });
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={() => onSkipRef.current()}
      />
      {/* Card — slides up from bottom */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("focus.capture.title")}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
        style={{ animation: "slideUpIn 220ms var(--ease-default) both" }}
      >
        <div
          className="w-full rounded-t-2xl"
          style={{
            maxWidth: 560,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderBottom: "none",
            padding: "28px 28px 36px",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2
              className="font-semibold"
              style={{ fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
            >
              {t("focus.capture.title")}
            </h2>
            <button
              onClick={() => onSkipRef.current()}
              className="text-xs"
              style={{ color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer" }}
            >
              {countdown > 0
                ? t("focus.capture.skip.countdown").replace("{n}", String(countdown))
                : t("focus.capture.skip")}
            </button>
          </div>

          {/* Accomplished */}
          <div className="mb-4">
            <label
              htmlFor="capture-accomplished"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("focus.capture.accomplished.label")}
            </label>
            <input
              id="capture-accomplished"
              type="text"
              value={accomplished}
              onChange={(e) => setAccomplished(e.target.value)}
              placeholder={t("focus.capture.accomplished.placeholder")}
              maxLength={500}
              disabled={busy}
              autoFocus
              className="w-full text-sm"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
                padding: "9px 12px",
                color: "var(--text-primary)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-fog)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Next step */}
          <div className="mb-6">
            <label
              htmlFor="capture-nextstep"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {t("focus.capture.nextstep.label")}
            </label>
            <input
              id="capture-nextstep"
              type="text"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder={t("focus.capture.nextstep.placeholder")}
              maxLength={500}
              disabled={busy}
              className="w-full text-sm"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 8,
                padding: "9px 12px",
                color: "var(--text-primary)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-fog)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAction("end-focus");
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {showNextRound && (
              <button
                onClick={() => handleAction("next-round")}
                disabled={busy}
                className="flex-1 btn btn-secondary text-sm font-medium"
                style={{ padding: "10px 0" }}
              >
                {t("focus.capture.nextround")}
              </button>
            )}
            <button
              onClick={() => handleAction("end-focus")}
              disabled={busy}
              className="flex-1 btn btn-primary text-sm font-semibold"
              style={{ padding: "10px 0" }}
            >
              {t("focus.capture.endfocus")}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
