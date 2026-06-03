import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconArrowLeft, IconCheck, IconPause, IconPlay } from "@/components/icons";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { usePetStore } from "@/store/usePetStore";
import { computeAllTimeStats } from "@/utils/stats";
import { fmtDuration, fmtMMSS } from "@/lib/format";
import { DogSvg } from "@/components/DogSvg";

const DEFAULT_DURATION = 25 * 60;

/**
 * Pomodoro focus session — full-bleed timer, top strip with the current
 * task. Pause/Resume + Mark complete.
 */
export function FocusPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const tasks = useTasksStore((s) => s.tasks);
  const complete = useTasksStore((s) => s.complete);

  // Use the task the user explicitly started focus on (passed via router state).
  // Fall back to priority order only when navigating to /focus directly.
  const requestedId = (location.state as { taskId?: string } | null)?.taskId;
  const task = requestedId
    ? (tasks.find((x) => x.id === requestedId && !x.completed) ??
        tasks.find((x) => x.today && x.quadrant === "Q1" && !x.completed) ??
        tasks.find((x) => x.today && !x.completed) ??
        tasks.find((x) => x.quadrant === "Q1" && !x.completed) ??
        tasks.find((x) => !x.completed))
    : (tasks.find((x) => x.today && x.quadrant === "Q1" && !x.completed) ??
        tasks.find((x) => x.today && !x.completed) ??
        tasks.find((x) => x.quadrant === "Q1" && !x.completed) ??
        tasks.find((x) => !x.completed));

  const isFallbackTask = !!task && !task.today;

  // Task duration in seconds — only computed once the task is known.
  const taskDuration = task && task.duration > 0 ? task.duration * 60 : DEFAULT_DURATION;

  const [remaining, setRemaining] = useState(DEFAULT_DURATION);
  const [paused, setPaused] = useState(false);
  const [compact, setCompact] = useState(false);
  const [petBounce, setPetBounce] = useState(false);
  // Track whether the timer has been started with the correct task duration.
  const timerStartedForRef = useRef<string | null>(null);
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;
  const workerRef = useRef<Worker | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  // ── Create worker once on mount; tear it down on unmount ─────────────────
  useEffect(() => {
    const worker = new Worker("/timer-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<{ type: string; remaining?: number }>) => {
      if (e.data.type === "tick" && typeof e.data.remaining === "number") {
        setRemaining(e.data.remaining);
      }
      if (e.data.type === "done") {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Lumo · Pomodoro done", {
            body: localeRef.current === "zh"
              ? "专注时间结束！去休息一下 ☕"
              : "Time's up! Take a well-earned break ☕",
            icon: "/favicon.ico",
          });
        }
        setPetBounce(true);
        setTimeout(() => setPetBounce(false), 1200);
        useTasksStore.getState().fetchAllCompleted().then((entries) => {
          const { currentStreak } = computeAllTimeStats(entries);
          if (currentStreak === 7 || currentStreak === 14 || currentStreak === 30) {
            usePetStore.getState().celebrate(`pet.streak.${currentStreak}`);
          }
        }).catch(() => {});
      }
    };

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // ── Start/restart timer when the task (and its duration) becomes known ────
  // This runs after tasks load from the API, ensuring the correct duration.
  useEffect(() => {
    if (!task || !workerRef.current) return;
    // Avoid restarting if we already started for this exact task+duration.
    const key = `${task.id}:${taskDuration}`;
    if (timerStartedForRef.current === key) return;
    timerStartedForRef.current = key;

    setRemaining(taskDuration);
    workerRef.current.postMessage({ type: "start", duration: taskDuration });
  }, [task?.id, taskDuration]);

  // ── Sync pause/resume ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: paused ? "pause" : "resume" });
  }, [paused]);

  function enterCompact() {
    setCompact(true);
    window.electronAPI?.enterFocusMode();
  }

  function exitCompact() {
    setCompact(false);
    window.electronAPI?.exitFocusMode();
  }

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

  const progress = taskDuration > 0 ? (taskDuration - remaining) / taskDuration : 0;
  const turns = -90 + progress * 360;

  async function onComplete() {
    if (compact) exitCompact();
    if (task) await complete(task.id);
    navigate("/today");
  }

  // ── Compact pet overlay (Electron only) ─────────────────────────────────────
  if (compact) {
    const petMood = paused ? "idle" : remaining < 60 ? "excited" : "happy";
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "var(--bg-elevated)",
          WebkitAppRegion: "drag",
          userSelect: "none",
          overflow: "hidden",
        }}
      >
        {/* Drag handle strip */}
        <div
          style={{
            width: "100%",
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 36, height: 3, borderRadius: 2, background: "var(--border-strong)", opacity: 0.5 }} />
          <button
            onClick={exitCompact}
            style={{
              WebkitAppRegion: "no-drag",
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              color: "var(--text-muted)",
              fontSize: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
            title={t("focus.compact.restore")}
          >
            ✕
          </button>
        </div>

        {/* Pet */}
        <div
          style={{
            marginTop: 4,
            flexShrink: 0,
            animation: petBounce ? "petBounce 0.4s ease-in-out 3" : undefined,
          }}
        >
          <DogSvg mood={petMood} size={72} />
        </div>

        {/* Timer */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 42,
            fontWeight: 200,
            letterSpacing: "-0.04em",
            color: remaining < 60 ? "var(--accent-primary)" : "var(--text-primary)",
            lineHeight: 1,
            margin: "10px 0 4px",
          }}
        >
          {fmtMMSS(remaining)}
        </div>

        {/* Task title */}
        {task && (
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              maxWidth: 190,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
              padding: "0 8px",
            }}
          >
            {ls(task.title)}
          </div>
        )}

        {/* Pause indicator */}
        {paused && (
          <div style={{ fontSize: 9, color: "var(--accent-primary)", marginTop: 3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {t("focus.pause")}d
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 12,
            WebkitAppRegion: "no-drag",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setPaused((p) => !p)}
            style={{
              height: 28,
              padding: "0 12px",
              borderRadius: 14,
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              color: "var(--text-secondary)",
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {paused ? <IconPlay size={10} /> : <IconPause size={10} />}
            {paused ? t("focus.resume") : t("focus.pause")}
          </button>
          <button
            onClick={onComplete}
            style={{
              height: 28,
              padding: "0 12px",
              borderRadius: 14,
              border: "none",
              background: "var(--accent-primary)",
              color: "var(--bg-base)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconCheck size={10} />
            {t("focus.compact.done")}
          </button>
        </div>

        {/* Restore link */}
        <button
          onClick={exitCompact}
          style={{
            WebkitAppRegion: "no-drag",
            marginTop: 8,
            fontSize: 10,
            color: "var(--text-faint)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {t("focus.compact.restore")}
        </button>
      </div>
    );
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
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-text-primary leading-snug">{ls(task.title)}</div>
            {isFallbackTask && (
              <span
                className="text-[10px] rounded-full flex-shrink-0"
                style={{
                  padding: "1px 7px",
                  background: "var(--bg-subtle)",
                  color: "var(--text-faint)",
                  border: "1px solid var(--border-faint)",
                }}
              >
                {t("focus.fallback.badge")}
              </span>
            )}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5">
            {task.next_step
              ? ls(task.next_step)
              : task.duration > 0
              ? `${t("focus.sub.prefix")} ${fmtDuration(task.duration, locale)}`
              : t("focus.sub")}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-faint">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent-primary)", boxShadow: "0 0 8px var(--accent-primary)" }}
          />
          <span>{t("focus.dnd")}</span>
        </div>
        {isElectron && (
          <button
            className="btn btn-ghost"
            style={{ height: 30 }}
            onClick={enterCompact}
            title={t("focus.compact.enter")}
          >
            🐕 {t("focus.compact.enter")}
          </button>
        )}
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
            {/* Primary: Mark complete */}
            <button
              onClick={onComplete}
              className="flex items-center gap-2 rounded-full transition-all text-sm font-semibold"
              style={{
                padding: "11px 36px",
                background: "var(--accent-primary)",
                color: "var(--bg-base)",
                border: "1.5px solid var(--accent-primary)",
                boxShadow: "0 0 24px var(--accent-fog)",
              }}
            >
              <IconCheck size={15} />
              {t("focus.complete")}
            </button>
            {/* Secondary: Pause / Resume */}
            <button
              onClick={() => setPaused((p) => !p)}
              title={paused ? t("focus.resume") : t("focus.pause")}
              className="focus-complete-btn flex items-center gap-1.5 rounded-full text-xs font-medium transition-colors"
              style={{ padding: "6px 18px" }}
            >
              {paused ? <IconPlay size={12} /> : <IconPause size={12} />}
              {paused ? t("focus.resume") : t("focus.pause")}
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
