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
      <div
        className="fade-in flex flex-col items-center justify-center h-full relative"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 100%, rgba(61,255,160,0.04) 0%, transparent 70%), var(--bg-base)",
        }}
      >
        {/* Ghost atmosphere ring — dimmed, no progress arc */}
        <div className="relative mb-10" style={{ width: 280, height: 280 }}>
          {/* Ambient glow — breathing softly */}
          <div
            className="absolute rounded-full"
            style={{
              inset: -20,
              background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
              opacity: 0.35,
              animation: "lumoBreath 5s ease-in-out infinite",
            }}
          />
          {/* Ghost SVG ring */}
          <svg viewBox="0 0 280 280" className="absolute inset-0" style={{ opacity: 0.18 }}>
            <circle cx="140" cy="140" r="120" fill="none" stroke="var(--accent-primary)" strokeWidth="2" />
          </svg>
          {/* Outer border ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "0.5px solid var(--accent-edge)", opacity: 0.3 }}
          />

          {/* Center — Lumo waiting state */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {/* Breathing triple orb */}
            <div className="relative" style={{ width: 56, height: 56 }}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                  animation: "lumoBreath 4s ease-in-out infinite",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: 10,
                  border: "1px solid var(--accent-edge)",
                  animation: "lumoBreath 4s ease-in-out infinite reverse",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: 20,
                  background: "var(--accent-primary)",
                  boxShadow: "0 0 14px var(--accent-primary)",
                  animation: "lumoBreath 4s ease-in-out infinite",
                }}
              />
            </div>

            {/* Ghost time display */}
            <div
              className="font-mono tabular-nums"
              style={{
                fontSize: 38,
                fontWeight: 200,
                letterSpacing: "-0.04em",
                color: "var(--text-faint)",
                lineHeight: 1,
              }}
            >
              25:00
            </div>
          </div>
        </div>

        {/* Text */}
        <h2
          className="font-semibold mb-2.5 text-center"
          style={{ fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          {t("focus.empty.title")}
        </h2>
        <p
          className="text-sm leading-relaxed text-center mb-8"
          style={{ color: "var(--text-secondary)", maxWidth: 300 }}
        >
          {t("focus.empty.sub")}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/today")}>
            {t("focus.empty.cta")}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/matrix")}>
            {t("focus.empty.matrix")}
          </button>
        </div>
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
          <div className="flex flex-col items-center gap-2 mt-3 pointer-events-auto">
            {/* Primary: Pause / Resume */}
            <button
              onClick={() => setPaused((p) => !p)}
              title={paused ? t("focus.resume") : t("focus.pause")}
              className="flex items-center gap-2 rounded-full transition-all text-sm font-semibold"
              style={{
                padding: "11px 36px",
                background: paused ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: paused ? "var(--bg-base)" : "var(--text-primary)",
                border: "1.5px solid",
                borderColor: paused ? "var(--accent-primary)" : "var(--border-strong)",
                boxShadow: paused ? "0 0 24px var(--accent-fog)" : "none",
              }}
            >
              {paused ? <IconPlay size={15} /> : <IconPause size={15} />}
              {paused ? t("focus.resume") : t("focus.pause")}
            </button>
            {/* Secondary: Mark complete */}
            <button
              onClick={onComplete}
              className="focus-complete-btn flex items-center gap-1.5 rounded-full text-xs font-medium transition-colors"
              style={{ padding: "6px 18px" }}
            >
              <IconCheck size={12} />
              {t("focus.complete")}
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
