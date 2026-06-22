import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/useT";

export interface SessionCaptureResult {
  whatDone: string;
  nextStep: string;
  action: "next_round" | "end_focus";
}

interface Props {
  /** Hide the "Start next round" button (e.g. when triggered from "Mark complete"). */
  hideNextRound?: boolean;
  onSubmit: (result: SessionCaptureResult) => void;
  onSkip: () => void;
}

const SKIP_COUNTDOWN = 5;

export function SessionCaptureCard({ hideNextRound = false, onSubmit, onSkip }: Props) {
  const t = useT();
  const [whatDone, setWhatDone] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [countdown, setCountdown] = useState(SKIP_COUNTDOWN);
  const [saving, setSaving] = useState(false);
  const whatDoneRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-focus first input when card appears.
  useEffect(() => {
    whatDoneRef.current?.focus();
  }, []);

  // 5-second skip countdown.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onSkip]);

  function pauseCountdown() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setCountdown(SKIP_COUNTDOWN);
    }
  }

  // ESC key skips the card.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onSkip();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSkip]);

  async function handleAction(action: "next_round" | "end_focus") {
    setSaving(true);
    try {
      await onSubmit({ whatDone: whatDone.trim(), nextStep: nextStep.trim(), action });
    } finally {
      setSaving(false);
    }
  }

  const skipLabel = countdown > 0
    ? t("focus.capture.skip_in").replace("{n}", String(countdown))
    : t("focus.capture.skip");

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="session-capture-backdrop"
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)", zIndex: 40 }}
        onClick={onSkip}
      />

      {/* Card — bottom sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 flex flex-col"
        style={{
          zIndex: 50,
          background: "var(--bg-elevated)",
          borderTop: "1px solid var(--border-default)",
          borderRadius: "16px 16px 0 0",
          padding: "24px 28px 32px",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.28)",
          animation: "slideUpCard 0.22s var(--ease-default)",
          maxWidth: 560,
          margin: "0 auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center justify-between mb-5">
          <h3
            className="font-semibold"
            style={{ fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
          >
            {t("focus.capture.title")}
          </h3>
          <button
            onClick={onSkip}
            className="text-[11px] tabular-nums"
            style={{ color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {skipLabel}
          </button>
        </div>

        {/* What done */}
        <label className="flex flex-col gap-1.5 mb-4">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {t("focus.capture.what_done")}
          </span>
          <textarea
            ref={whatDoneRef}
            value={whatDone}
            onChange={(e) => { setWhatDone(e.target.value); pauseCountdown(); }}
            placeholder={t("focus.capture.what_done.placeholder")}
            rows={2}
            className="resize-none rounded-lg text-sm"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-faint)",
              color: "var(--text-primary)",
              padding: "8px 10px",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
            onFocus={pauseCountdown}
          />
        </label>

        {/* Next step */}
        <label className="flex flex-col gap-1.5 mb-6">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {t("focus.capture.next_step")}
          </span>
          <textarea
            value={nextStep}
            onChange={(e) => { setNextStep(e.target.value); pauseCountdown(); }}
            placeholder={t("focus.capture.next_step.placeholder")}
            rows={2}
            className="resize-none rounded-lg text-sm"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-faint)",
              color: "var(--text-primary)",
              padding: "8px 10px",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
            onFocus={pauseCountdown}
          />
        </label>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            disabled={saving}
            onClick={() => handleAction("end_focus")}
            className="flex-1 rounded-full font-semibold text-sm transition-all"
            style={{
              padding: "10px 0",
              background: "var(--accent-primary)",
              color: "var(--bg-base)",
              border: "1.5px solid var(--accent-primary)",
              boxShadow: "0 0 16px var(--accent-fog)",
              opacity: saving ? 0.6 : 1,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? t("focus.capture.saving") : t("focus.capture.end_focus")}
          </button>

          {!hideNextRound && (
            <button
              disabled={saving}
              onClick={() => handleAction("next_round")}
              className="flex-1 rounded-full font-semibold text-sm transition-all"
              style={{
                padding: "10px 0",
                background: "var(--bg-subtle)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
                opacity: saving ? 0.6 : 1,
                cursor: saving ? "default" : "pointer",
              }}
            >
              {t("focus.capture.start_next")}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpCard {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
