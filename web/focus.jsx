// focus.jsx — Pomodoro focus page (active + complete settlement)

function fmtMMSS(secs) {
  const m = Math.max(0, Math.floor(secs / 60));
  const s = Math.max(0, Math.floor(secs % 60));
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function FocusAtmosphere({ progress, paused }) {
  // Progress 0..1 - large breathing ambient sphere
  const turns = -90 + progress * 360;
  return (
    <div style={{
      position: "relative",
      width: 380, height: 380,
      flexShrink: 0
    }}>
      {/* Outer halo */}
      <div style={{
        position: "absolute", inset: -20, borderRadius: "50%",
        background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
        opacity: paused ? 0.3 : 0.9,
        transition: "opacity 600ms var(--ease-default)",
        animation: paused ? "none" : "atmoBreath 5s ease-in-out infinite"
      }} />
      {/* Ambient rings */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        border: "0.5px solid var(--accent-edge)",
        animation: paused ? "none" : "atmoBreath 5s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", inset: 30, borderRadius: "50%",
        border: "0.5px solid rgba(61, 255, 160, 0.15)"
      }} />
      {/* Progress ring */}
      <svg viewBox="0 0 380 380" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="progGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-dim)" />
          </linearGradient>
        </defs>
        <circle cx="190" cy="190" r="160" fill="none"
        stroke="var(--border-default)" strokeWidth="2" opacity="0.6" />
        <circle cx="190" cy="190" r="160" fill="none"
        stroke="url(#progGrad)" strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * 160}
        strokeDashoffset={(1 - progress) * 2 * Math.PI * 160}
        transform="rotate(-90 190 190)"
        style={{
          filter: "drop-shadow(0 0 8px var(--accent-primary))",
          transition: "stroke-dashoffset 1s linear"
        }} />
        {/* Tick at current position */}
        <circle
          cx={190 + 160 * Math.cos(turns * Math.PI / 180)}
          cy={190 + 160 * Math.sin(turns * Math.PI / 180)}
          r="5" fill="var(--accent-primary)"
          style={{ filter: "drop-shadow(0 0 6px var(--accent-primary))" }} />
        
      </svg>
      {/* Center: time content placeholder, actual countdown rendered by parent */}
    </div>);

}

function FocusScreen({ lang, t, task, aiVariant, onExit, onComplete }) {
  const TOTAL = 25 * 60; // 25 minutes
  const [remaining, setRemaining] = React.useState(18 * 60 + 42); // mocked state mid-session
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setRemaining((r) => r <= 0 ? 0 : r - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [paused]);

  const [done, setDone] = React.useState(false);
  React.useEffect(() => {if (remaining === 0) setDone(true);}, [remaining]);

  const progress = (TOTAL - remaining) / TOTAL;
  const title = task ? window.getTaskTitle(task, lang) :
  lang === "zh" ? "完成客户评审用的首页线框" : "Finish homepage wireframes for client review";

  return (
    <div className="fade-in" style={{
      flex: 1, display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0,
      background: `
        radial-gradient(60% 50% at 50% 100%, rgba(61, 255, 160, 0.05) 0%, transparent 70%),
        var(--bg-base)`,
      position: "relative"
    }}>
      {/* Top strip: task + exit */}
      <div style={{
        padding: "20px 32px", display: "flex", alignItems: "center", gap: 14,
        borderBottom: "1px solid var(--border-faint)"
      }}>
        <span className="chip chip-q1">Q1</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {t("focus.goal")} · {lang === "zh" ? "完成 Hero 区版式" : "Finish hero layout draft"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-faint)", fontSize: 11 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--accent-primary)",
            boxShadow: "0 0 8px var(--accent-primary)",
            animation: "lumoBreath 3s ease-in-out infinite"
          }} />
          <span>{t("focus.dnd")}</span>
        </div>
        <button className="btn btn-ghost" onClick={onExit} style={{ height: 30 }}>
          {ICON.arrowLeft} {t("focus.done.back")}
        </button>
      </div>

      {/* Center */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", minHeight: 0
      }}>
        <FocusAtmosphere progress={progress} paused={paused} />
        {/* Centered text — overlaid */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--text-faint)"
          }}>
            {t("focus.round")} 2 {t("focus.of")} 4
          </div>
          <div style={{
            fontSize: 88, fontWeight: 200, lineHeight: 1,
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.04em",
            fontFamily: "var(--font-mono)",
            marginTop: 8, marginBottom: 8
          }}>
            {fmtMMSS(remaining)}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center" }}>
            <button className="btn btn-primary btn-lg" onClick={onComplete}
                    style={{ minWidth: 180, justifyContent: "center", fontWeight: 600 }}>
              <span style={{ width: 16, height: 16, display: "inline-flex" }}>{ICON.check}</span>
              {t("focus.complete")}
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              title={paused ? t("focus.resume") : t("focus.pause")}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "default", fontFamily: "inherit",
                transition: "all 120ms var(--ease-default)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}>
              <span style={{ width: 16, height: 16, display: "inline-flex" }}>
                {paused ? ICON.play : ICON.pause}
              </span>
            </button>
          </div>
          <div style={{
            marginTop: 14, fontSize: 11, color: "var(--text-muted)",
            display: "flex", gap: 20, fontVariantNumeric: "tabular-nums"
          }}>
            <span>{t("focus.est")} {window.fmtDuration(90, lang)}</span>
            <span>{t("focus.actual")} {window.fmtDuration(31, lang)}</span>
            <span>{t("focus.todaytotal")} {window.fmtDuration(72, lang)}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes atmoBreath {
          0%, 100% { transform: scale(0.98); opacity: 0.85; }
          50% { transform: scale(1.02); opacity: 1; }
        }
      `}</style>

      {/* Settlement overlay */}
      {done && <FocusComplete lang={lang} t={t} onAgain={() => {setRemaining(TOTAL);setDone(false);}}
      onBack={onExit} onTaskDone={onComplete} />}
    </div>);

}

function FocusComplete({ lang, t, onAgain, onBack, onTaskDone }) {
  return (
    <div className="fade-in" style={{
      position: "absolute", inset: 0,
      background: "rgba(8, 11, 10, 0.78)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 5
    }}>
      <div style={{
        width: 460,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: 12,
        padding: "28px 28px 22px",
        boxShadow: "var(--shadow-lifted)"
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--accent-fog)",
          border: "1px solid var(--accent-edge)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent-primary)",
          marginBottom: 14
        }}><span style={{ width: 18, height: 18, display: "inline-flex" }}>{ICON.check}</span></div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {t("focus.done.h")}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>
          {t("focus.done.sub")}
        </div>
        <div style={{
          display: "flex", flexDirection: "column", gap: 8, marginTop: 20
        }}>
          <button className="btn btn-primary" onClick={onTaskDone} style={{ justifyContent: "space-between", width: "100%" }}>
            <span>{t("focus.done.task")}</span>{ICON.arrowRight}
          </button>
          <button className="btn btn-secondary" onClick={onAgain} style={{ justifyContent: "space-between", width: "100%" }}>
            <span>{t("focus.done.again")}</span>{ICON.arrowRight}
          </button>
          <button className="btn btn-ghost" onClick={onBack} style={{ justifyContent: "space-between", width: "100%" }}>
            <span>{t("focus.done.back")}</span>{ICON.arrowRight}
          </button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { FocusScreen });