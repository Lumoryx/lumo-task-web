import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft, IconCheck, IconPause, IconPlay } from "@/components/icons";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { fmtDuration, fmtMMSS } from "@/lib/format";

const TOTAL = 25 * 60;

/**
 * Pomodoro focus session — full-bleed timer, top strip with the current
 * task. Pause/Resume + Mark complete.
 */
export function FocusPage() {
  const navigate = useNavigate();
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const tasks = useTasksStore((s) => s.tasks);
  const complete = useTasksStore((s) => s.complete);

  // Pick a Q1-today task as the active focus, fall back to the first today task.
  const task =
    tasks.find((x) => x.today && x.quadrant === "Q1" && !x.completed) ??
    tasks.find((x) => x.today && !x.completed);

  const [remaining, setRemaining] = useState(TOTAL);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || remaining === 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [paused, remaining]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-text-muted">
        <div className="text-sm">Nothing to focus on. Add a task first.</div>
        <button className="btn btn-secondary mt-4" onClick={() => navigate("/today")}>
          {t("focus.exit")}
        </button>
      </div>
    );
  }

  const progress = (TOTAL - remaining) / TOTAL;
  const turns = -90 + progress * 360;

  async function onComplete() {
    if (task) await complete(task.id);
    navigate("/today");
  }

  return (
    <div
      className="fade-in flex flex-col h-full relative"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 100%, rgba(61,255,160,0.05) 0%, transparent 70%), var(--bg-base)",
      }}
    >
      {/* Top strip */}
      <header className="flex items-center gap-3.5 px-8 py-5 border-b border-border-faint">
        <span className="chip chip-q1">{task.quadrant !== "unclassified" ? task.quadrant : "—"}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary leading-snug">{ls(task.title)}</div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {task.next_step ? ls(task.next_step) : t("focus.sub")}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-faint">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent-primary)", boxShadow: "0 0 8px var(--accent-primary)" }}
          />
          <span>{t("focus.dnd")}</span>
        </div>
        <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => navigate("/today")}>
          <IconArrowLeft size={14} />
          {t("focus.exit")}
        </button>
      </header>

      {/* Atmosphere + countdown */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        <div className="relative" style={{ width: 380, height: 380 }}>
          <div
            className="absolute rounded-full"
            style={{
              inset: -20,
              background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
              opacity: paused ? 0.3 : 0.9,
              transition: "opacity 600ms var(--ease-default)",
            }}
          />
          <div className="absolute inset-0 rounded-full" style={{ border: "0.5px solid var(--accent-edge)" }} />
          <svg viewBox="0 0 380 380" className="absolute inset-0">
            <defs>
              <linearGradient id="progGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="var(--accent-dim)" />
              </linearGradient>
            </defs>
            <circle cx="190" cy="190" r="160" fill="none" stroke="var(--border-default)" strokeWidth="2" opacity="0.6" />
            <circle
              cx="190"
              cy="190"
              r="160"
              fill="none"
              stroke="url(#progGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 160}
              strokeDashoffset={(1 - progress) * 2 * Math.PI * 160}
              transform="rotate(-90 190 190)"
              style={{
                filter: "drop-shadow(0 0 8px var(--accent-primary))",
                transition: "stroke-dashoffset 1s linear",
              }}
            />
            <circle
              cx={190 + 160 * Math.cos((turns * Math.PI) / 180)}
              cy={190 + 160 * Math.sin((turns * Math.PI) / 180)}
              r="5"
              fill="var(--accent-primary)"
              style={{ filter: "drop-shadow(0 0 6px var(--accent-primary))" }}
            />
          </svg>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-faint">
            {t("focus.round")} {task.pomos_done + 1} {t("focus.of")} {task.pomos_total}
          </div>
          <div
            className="font-mono text-text-primary tabular-nums"
            style={{ fontSize: 88, fontWeight: 200, lineHeight: 1, letterSpacing: "-0.04em", margin: "8px 0" }}
          >
            {fmtMMSS(remaining)}
          </div>
          <div className="flex items-center gap-3 mt-2 pointer-events-auto">
            <button
              className="btn btn-primary btn-lg"
              onClick={onComplete}
              style={{ minWidth: 180, fontWeight: 600 }}
            >
              <IconCheck size={16} />
              {t("focus.complete")}
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              title={paused ? t("focus.resume") : t("focus.pause")}
              className="flex items-center justify-center rounded-full bg-elevated text-text-primary border border-border-default hover:bg-subtle transition-colors"
              style={{ width: 44, height: 44 }}
            >
              {paused ? <IconPlay size={16} /> : <IconPause size={16} />}
            </button>
          </div>
          <div className="mt-3.5 flex gap-5 text-[11px] text-text-muted tabular-nums">
            <span>
              {locale === "zh" ? "预估 " : "Est. "}
              {fmtDuration(task.duration, locale)}
            </span>
            <span>
              {locale === "zh" ? "实际 " : "Actual "}
              {fmtMMSS(TOTAL - remaining)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
