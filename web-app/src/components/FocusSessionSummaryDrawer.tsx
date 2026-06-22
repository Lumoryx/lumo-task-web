import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n/useT";
import type { Task } from "@/types/task";

// ── localStorage helpers ──────────────────────────────────────────────────────

const logKey = (taskId: string) => `lumo.focus.logs.${taskId}`;

export interface FocusLog {
  ts: string;
  text: string;
}

export function saveFocusLog(taskId: string, text: string): void {
  if (!text.trim()) return;
  try {
    const existing: FocusLog[] = JSON.parse(localStorage.getItem(logKey(taskId)) ?? "[]");
    const updated = [...existing, { ts: new Date().toISOString(), text: text.trim() }].slice(-50);
    localStorage.setItem(logKey(taskId), JSON.stringify(updated));
  } catch {
    // best-effort
  }
}

export function getFocusLogs(taskId: string): FocusLog[] {
  try {
    const raw = localStorage.getItem(logKey(taskId));
    return raw ? (JSON.parse(raw) as FocusLog[]) : [];
  } catch {
    return [];
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  task: Task;
  onStartAnother: (accomplished: string) => void;
  onEndFocus: (data: { accomplished: string; nextStep: string }) => Promise<void>;
  onSkip: () => void;
}

const SKIP_DELAY = 5;

export function FocusSessionSummaryDrawer({ task: _task, onStartAnother, onEndFocus, onSkip }: Props) {
  const t = useT();
  const [accomplished, setAccomplished] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipSeconds, setSkipSeconds] = useState(SKIP_DELAY);
  const [visible, setVisible] = useState(false);
  const accomplishedRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    accomplishedRef.current?.focus();
  }, []);

  useEffect(() => {
    if (skipSeconds <= 0) return;
    const timer = setTimeout(() => setSkipSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [skipSeconds]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSkip();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onSkip]);

  async function handleEndFocus() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onEndFocus({ accomplished, nextStep });
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartAnother() {
    onStartAnother(accomplished);
  }

  const canSkip = skipSeconds <= 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("focus.session.title")}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "20px 24px 28px",
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border-default)",
        boxShadow: "0 -12px 40px rgba(0,0,0,0.3)",
        borderRadius: "16px 16px 0 0",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="font-semibold"
          style={{ fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          {t("focus.session.title")}
        </h3>
        <button
          onClick={onSkip}
          disabled={!canSkip}
          aria-label={canSkip ? t("focus.session.skip") : t("focus.session.skip_in").replace("{n}", String(skipSeconds))}
          style={{
            fontSize: 11,
            color: canSkip ? "var(--text-secondary)" : "var(--text-faint)",
            background: "none",
            border: "1px solid var(--border-faint)",
            borderRadius: 8,
            padding: "3px 10px",
            cursor: canSkip ? "pointer" : "default",
            transition: "color 300ms, opacity 300ms",
            opacity: canSkip ? 1 : 0.6,
          }}
        >
          {canSkip
            ? t("focus.session.skip")
            : t("focus.session.skip_in").replace("{n}", String(skipSeconds))}
        </button>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3 mb-5">
        <div>
          <label
            className="block text-[11px] font-medium mb-1.5"
            style={{ color: "var(--text-faint)" }}
          >
            {t("focus.session.accomplished")}
          </label>
          <input
            ref={accomplishedRef}
            type="text"
            value={accomplished}
            onChange={(e) => setAccomplished(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEndFocus();
            }}
            placeholder={t("focus.session.accomplished.placeholder")}
            disabled={submitting}
            className="w-full rounded-lg px-3 py-2 outline-none"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: 13,
              opacity: submitting ? 0.6 : 1,
            }}
          />
        </div>
        <div>
          <label
            className="block text-[11px] font-medium mb-1.5"
            style={{ color: "var(--text-faint)" }}
          >
            {t("focus.session.next_step")}
          </label>
          <input
            type="text"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEndFocus();
            }}
            placeholder={t("focus.session.next_step.placeholder")}
            disabled={submitting}
            className="w-full rounded-lg px-3 py-2 outline-none"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: 13,
              opacity: submitting ? 0.6 : 1,
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleStartAnother}
          disabled={submitting}
          className="btn btn-secondary flex-1"
          style={{ opacity: submitting ? 0.5 : 1 }}
        >
          {t("focus.session.start_another")}
        </button>
        <button
          onClick={handleEndFocus}
          disabled={submitting}
          className="btn btn-primary flex-1"
          style={{ opacity: submitting ? 0.5 : 1 }}
        >
          {submitting ? "…" : t("focus.session.end_focus")}
        </button>
      </div>
    </div>
  );
}
