// today.jsx — Today screen + 3 recommendation card variants
// (TaskActions popover lives in shell.jsx — used here via window.TaskActions)

// ── Mock natural-language parser ─────────────────────────────────────────
// Returns { title, quadrant, quadrantReason, due, duration, dueLabel }
function parseNaturalLanguage(input, lang) {
  const text = input.trim();
  const lower = text.toLowerCase();

  // Duration
  let duration = 30;
  const dm = lower.match(/(\d+)\s*(min|mins|minutes|分|分钟)/);
  const hm = lower.match(/(\d+(?:\.\d+)?)\s*(hour|hr|h|小时|h)/);
  if (dm) duration = Math.max(5, Math.min(480, parseInt(dm[1])));
  else if (hm) duration = Math.max(5, Math.min(480, Math.round(parseFloat(hm[1]) * 60)));

  // Due
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let due = today;
  let dueLabel = lang === "zh" ? "今天" : "Today";
  if (/(tomorrow|tmrw|明天|明日)/.test(lower)) {
    due = new Date(today); due.setDate(due.getDate() + 1);
    dueLabel = lang === "zh" ? "明天" : "Tomorrow";
  } else if (/(friday|fri|周五|星期五)/.test(lower)) {
    due = new Date(today);
    const offset = (5 - due.getDay() + 7) % 7 || 7;
    due.setDate(due.getDate() + offset);
    dueLabel = lang === "zh" ? "周五" : "Friday";
  } else if (/(next week|下周|下星期)/.test(lower)) {
    due = new Date(today); due.setDate(due.getDate() + 7);
    dueLabel = lang === "zh" ? "下周" : "Next week";
  } else if (/(this afternoon|下午)/.test(lower)) {
    dueLabel = lang === "zh" ? "今天下午" : "This afternoon";
  } else if (/(tonight|今晚|今天晚上)/.test(lower)) {
    dueLabel = lang === "zh" ? "今晚" : "Tonight";
  }

  // Quadrant heuristic
  let quadrant = "Q2";
  let quadrantReason = lang === "zh" ? "重要,但不急 — 安排到这周。" : "Important, not urgent — schedule it.";
  if (/(urgent|asap|now|critical|紧急|马上|立刻|今晚|tonight|today)/.test(lower)) {
    quadrant = "Q1";
    quadrantReason = lang === "zh" ? "时间敏感且重要 — 今天处理。" : "Time-sensitive and important — handle today.";
  } else if (/(invest|okr|roadmap|strategy|deep work|review|战略|投资|路线图|计划)/.test(lower)) {
    quadrant = "Q2";
    quadrantReason = lang === "zh" ? "重要的深度工作 — 安排专注时段。" : "Important deep work — book a focus block.";
  } else if (/(reply|email|message|sync|催|回复|邮件|消息|同步)/.test(lower)) {
    quadrant = "Q3";
    quadrantReason = lang === "zh" ? "紧急但不深度 — 一波处理掉。" : "Urgent but shallow — batch it.";
  }

  // Title — strip parsed phrases
  let title = text
    .replace(/(\d+)\s*(min|mins|minutes|分钟|分|hour|hr|h|小时)/gi, "")
    .replace(/(tomorrow|tmrw|tonight|明天|今晚|周五|下周|this afternoon|下午|today|今天)/gi, "")
    .replace(/[,，、。\.]+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title) title = text;
  // Capitalize first letter for en
  if (lang !== "zh" && title) title = title[0].toUpperCase() + title.slice(1);

  return { title, quadrant, quadrantReason, due, duration, dueLabel };
}

// ── Parse Confirm dialog (shown after Enter on compose bar) ─────────────
function ParseConfirmDialog({ lang, t, originalInput, onClose, onConfirm, onOpenEditor }) {
  const initial = React.useMemo(() => parseNaturalLanguage(originalInput, lang), [originalInput, lang]);
  const [title, setTitle] = React.useState(initial.title);
  const [quadrant, setQuadrant] = React.useState(initial.quadrant);
  const [addToToday, setAddToToday] = React.useState(true);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const quadrants = [
    { q: "Q1", title: lang === "zh" ? "立即做" : "Do first" },
    { q: "Q2", title: lang === "zh" ? "安排做" : "Schedule" },
    { q: "Q3", title: lang === "zh" ? "委托做" : "Delegate" },
    { q: "Q4", title: lang === "zh" ? "减少做" : "Drop" }
  ];

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0,
      background: "rgba(8, 11, 10, 0.55)",
      backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 150, padding: "0 32px 32px",
      animation: "fadeIn 180ms var(--ease-default) both"
    }}>
      <div onClick={(e) => e.stopPropagation()} className="float-up" style={{
        width: "100%", maxWidth: 520,
        background: "var(--bg-elevated)",
        border: "1px solid var(--accent-edge)",
        borderRadius: 14,
        boxShadow: "var(--shadow-lifted), 0 0 50px var(--accent-fog)",
        overflow: "hidden"
      }}>
        {/* Header — Lumo confirms the parse */}
        <div style={{
          padding: "16px 18px 12px",
          borderBottom: "1px solid var(--border-faint)",
          display: "flex", alignItems: "flex-start", gap: 12
        }}>
          <span style={{
            width: 14, height: 14, marginTop: 3, position: "relative", flexShrink: 0
          }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "var(--accent-glow)", animation: "lumoBreath 3s ease-in-out infinite reverse"
            }} />
            <span style={{
              position: "absolute", inset: 4, borderRadius: "50%",
              background: "var(--accent-primary)",
              boxShadow: "0 0 10px var(--accent-primary)",
              animation: "lumoBreath 3s ease-in-out infinite"
            }} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
              letterSpacing: "-0.005em"
            }}>
              {lang === "zh" ? "我来帮你创建,确认一下:" : "Got it. Here's what I'll create:"}
            </div>
            <div style={{
              marginTop: 4, fontSize: 11, color: "var(--text-muted)",
              fontStyle: "italic", lineHeight: 1.45,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}>
              "{originalInput}"
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={lang === "zh" ? "关闭" : "Close"}
            title={lang === "zh" ? "关闭" : "Close"}
            style={{
              width: 24, height: 24, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
              cursor: "default", fontFamily: "inherit",
              transition: "all 120ms var(--ease-default)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}>
            <span style={{ width: 12, height: 12, display: "inline-flex" }}>{ICON.close}</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 18px" }}>
          {/* Editable title */}
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--text-faint)",
            marginBottom: 6
          }}>{lang === "zh" ? "任务" : "Task"}</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            style={{ height: 40, fontSize: 14, fontWeight: 500 }} />

          {/* Parsed chips row */}
          <div style={{
            marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6
          }}>
            {/* Quadrant chip */}
            <div style={{ position: "relative" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 6,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                fontFamily: "inherit", fontSize: 12, cursor: "default"
              }}>
                <span className={"qdot qdot-" + quadrant.toLowerCase()} />
                {quadrant} · {quadrants.find((x) => x.q === quadrant).title}
                <span style={{ color: "var(--text-faint)", fontSize: 10 }}>▾</span>
              </button>
            </div>
            {/* Due chip */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 6,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: 12
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M3 9h18M8 2v4M16 2v4" />
              </svg>
              {initial.dueLabel}
            </div>
            {/* Duration chip */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 6,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: 12, fontVariantNumeric: "tabular-nums"
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
              {window.fmtDuration(initial.duration, lang)}
            </div>
          </div>

          {/* Quadrant reasoning — UCD: visibility of system status */}
          <div style={{
            marginTop: 14, padding: "10px 12px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-faint)",
            borderRadius: 8,
            display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            <span style={{
              width: 14, height: 14, marginTop: 1, flexShrink: 0,
              display: "inline-flex", color: "var(--accent-primary)", opacity: 0.85
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
              </svg>
            </span>
            <div style={{ flex: 1, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
              {initial.quadrantReason}
              <button onClick={onOpenEditor} style={{
                marginLeft: 6, padding: 0,
                background: "transparent", border: "none",
                color: "var(--accent-primary)", fontFamily: "inherit",
                fontSize: 12, cursor: "default", textDecoration: "underline",
                textUnderlineOffset: 2, textDecorationColor: "var(--accent-edge)"
              }}>
                {lang === "zh" ? "换一个" : "Change"}
              </button>
            </div>
          </div>

          {/* Add-to-today toggle */}
          <div style={{
            marginTop: 12,
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0"
          }}>
            <button
              onClick={() => setAddToToday((v) => !v)}
              style={{
                width: 30, height: 18, borderRadius: 9, padding: 2,
                background: addToToday ? "var(--accent-primary)" : "var(--border-strong)",
                border: "none", display: "flex", alignItems: "center",
                cursor: "default",
                transition: "background 160ms var(--ease-default)"
              }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                background: addToToday ? "var(--text-inverse)" : "var(--bg-elevated)",
                transform: addToToday ? "translateX(12px)" : "translateX(0)",
                transition: "transform 180ms var(--ease-spring)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
              }} />
            </button>
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
              {lang === "zh" ? "加入今天的清单" : "Add to today's list"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 18px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-faint)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <button onClick={onOpenEditor} className="btn btn-ghost" style={{ height: 32, padding: "0 10px", fontSize: 12 }}>
            {lang === "zh" ? "详细编辑…" : "More details…"}
          </button>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} className="btn btn-ghost" style={{ height: 32, padding: "0 12px", fontSize: 12 }}>
            {lang === "zh" ? "取消" : "Cancel"}
          </button>
          <button onClick={onConfirm} className="btn btn-primary" style={{ height: 32, padding: "0 14px", fontSize: 12 }}>
            {lang === "zh" ? "创建" : "Create task"}
            <span style={{
              padding: "1px 5px", borderRadius: 3, marginLeft: 6,
              background: "rgba(0,0,0,0.18)",
              fontFamily: "var(--font-mono)", fontSize: 10
            }}>⌘↵</span>
          </button>
        </div>
      </div>
    </div>);

}

// ── Compose bar (natural-language task input on Today) ──────────────────
function ComposeBar({ lang, t, placeholder, onOpenEditor }) {
  const [value, setValue] = React.useState("");
  const [dialog, setDialog] = React.useState(null); // string | null
  const inputRef = React.useRef(null);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    setDialog(v);
  };

  const close = () => {
    setDialog(null);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
  };

  const confirm = () => {
    // In a real app we'd persist the new task. Here we just clear and close.
    setValue("");
    close();
  };

  const openEditor = () => {
    setDialog(null);
    setValue("");
    onOpenEditor && onOpenEditor();
  };

  const hasText = value.trim().length > 0;

  return (
    <div style={{ marginTop: 32, position: "relative" }}>
      <div className="compose-bar">
        <span className="compose-dot" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && hasText) { e.preventDefault(); submit(); } }}
          placeholder={placeholder} />
        <span className="compose-kbd">↵</span>
        <button
          className={"compose-send " + (hasText ? "active" : "")}
          onClick={submit}
          disabled={!hasText}
          title={lang === "zh" ? "创建任务" : "Send"}
          aria-label={lang === "zh" ? "创建任务" : "Send"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={hasText ? "2" : "1.6"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
      <div style={{
        fontSize: 11, color: "var(--text-faint)",
        marginTop: 8, paddingLeft: 16,
        display: "flex", alignItems: "center", gap: 6
      }}>
        <span style={{ opacity: 0.7 }}>✦</span>
        <span>{t("today.input.example")}</span>
      </div>

      {dialog &&
        <ParseConfirmDialog
          lang={lang} t={t}
          originalInput={dialog}
          onClose={close}
          onConfirm={confirm}
          onOpenEditor={openEditor} />
      }
    </div>);

}

// ── Variant A: Classic Hero (UCD standard) ───────────────────────────────
function CardClassic({ task, lang, t, aiVariant, onStart, onSkip, onLater }) {
  const title = window.getTaskTitle(task, lang);
  const desc = window.getTaskField(task, "desc", lang);
  const reason = window.getTaskField(task, "reason", lang);
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="float-up" style={{
      position: "relative",
      background: "linear-gradient(180deg, var(--bg-surface) 0%, #161D19 100%)",
      border: "1px solid var(--border-default)",
      borderRadius: 12,
      padding: 28,
      overflow: "visible"
    }}>
      {/* Halo — clipped to card by its own overflow-hidden wrapper so the action menu can escape */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 12,
        overflow: "hidden", pointerEvents: "none"
      }}>
        <div style={{
          position: "absolute", top: -120, right: -80, width: 320, height: 320,
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)"
        }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
        <span className="chip chip-ai">
          <span style={{
            width: 4, height: 4, borderRadius: "50%",
            background: "var(--accent-primary)",
            boxShadow: "0 0 6px var(--accent-primary)"
          }} />
          {t("today.recommended")}
        </span>
        <span className={"chip chip-" + task.quadrant.toLowerCase()}>{task.quadrant}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {window.getDueLabel(task.due, lang)} · {window.fmtDuration(task.duration, lang)} · <span className="pip" style={{ verticalAlign: "middle" }}>
            {Array.from({ length: task.pomos_total }).map((_, i) =>
            <i key={i} className={i < task.pomos_done ? "on" : ""} />
            )}
          </span>
        </span>
      </div>
      <div style={{
        fontSize: 26, fontWeight: 600, color: "var(--text-primary)",
        lineHeight: 1.25, marginTop: 18, letterSpacing: "-0.01em",
        textWrap: "pretty", maxWidth: 620, position: "relative"
      }}>{title}</div>
      <div style={{
        fontSize: 14, color: "var(--text-secondary)",
        marginTop: 10, lineHeight: 1.6, maxWidth: 620, position: "relative"
      }}>{desc}</div>
      <div style={{
        marginTop: 20, padding: "12px 14px",
        background: "rgba(61, 255, 160, 0.025)",
        border: "1px solid rgba(61, 255, 160, 0.18)",
        borderRadius: 8,
        display: "flex", gap: 12, alignItems: "center",
        position: "relative"
      }}>
        <LumoStatus variant={aiVariant} text="" />
        <div style={{
          fontSize: 13, color: "var(--text-secondary)",
          lineHeight: 1.55, flex: 1, marginLeft: aiVariant === "orb" ? -4 : -10
        }}>{reason}</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 22, position: "relative", alignItems: "center" }}>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          {ICON.play} {t("today.start")}
        </button>
        <button className="btn btn-ghost" onClick={onSkip}>{t("today.skip")}</button>
        <button className="btn btn-ghost" onClick={onLater}>{t("today.later")}</button>
        <span style={{ flex: 1 }} />
        <div style={{ position: "relative" }} data-task-actions>
          <button
            onClick={(e) => {e.stopPropagation();setMenuOpen((v) => !v);}}
            style={{
              width: 34, height: 34, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              // Default = same neutral tone as surrounding card text (no contrasting bg)
              background: menuOpen ? "var(--bg-elevated)" : "transparent",
              border: "none",
              color: menuOpen ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "default", fontFamily: "inherit",
              transition: "all 120ms var(--ease-default)"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={(e) => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; } }}>
            <span style={{ width: 16, height: 16, display: "inline-flex" }}>{ICON.more}</span>
          </button>
          {menuOpen && window.TaskActions && <window.TaskActions lang={lang} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
    </div>);

}

// ── Variant B: Conviction Letter (bold) ──────────────────────────────────
function CardConviction({ task, lang, t, aiVariant, allTasks, onStart, onSkip }) {
  const title = window.getTaskTitle(task, lang);
  const reason = window.getTaskField(task, "reason", lang);
  const conviction = task.conviction || 0.9;
  const notNow = task.not_now || [];

  return (
    <div className="float-up" style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: 12,
      padding: 0,
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: "1fr 240px"
    }}>
      {/* Main column */}
      <div style={{ padding: "28px 28px 22px", borderRight: "1px solid var(--border-faint)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LumoStatus variant={aiVariant} text={t("today.recommended")} />
          <span style={{ flex: 1 }} />
          <span className={"chip chip-" + task.quadrant.toLowerCase()}>{task.quadrant}</span>
        </div>
        <div style={{
          fontSize: 13, color: "var(--text-secondary)", marginTop: 16,
          fontStyle: "italic", lineHeight: 1.6
        }}>
          "{reason}"
        </div>
        <div style={{
          fontSize: 24, fontWeight: 600, color: "var(--text-primary)",
          lineHeight: 1.25, marginTop: 18, letterSpacing: "-0.01em",
          textWrap: "pretty", maxWidth: 540
        }}>{title}</div>
        <div style={{
          display: "flex", gap: 18, marginTop: 16,
          fontSize: 12, color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums"
        }}>
          <span><span style={{ color: "var(--text-faint)" }}>{t("today.due")}</span> · {window.getDueLabel(task.due, lang)}</span>
          <span><span style={{ color: "var(--text-faint)" }}>{t("today.est")}</span> · {window.fmtDuration(task.duration, lang)}</span>
          <span>
            <span style={{ color: "var(--text-faint)" }}>{t("today.poms")}</span> · <span className="pip" style={{ verticalAlign: "middle" }}>
              {Array.from({ length: task.pomos_total }).map((_, i) =>
              <i key={i} className={i < task.pomos_done ? "on" : ""} />
              )}
            </span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          <button className="btn btn-primary btn-lg" onClick={onStart}>
            {ICON.play} {t("today.start")}
          </button>
          <button className="btn btn-ghost" onClick={onSkip}>{t("today.skip")}</button>
          <button className="btn btn-ghost">{t("today.details")}</button>
        </div>
      </div>
      {/* Conviction sidecar */}
      <div style={{
        padding: "28px 22px 22px",
        background: "linear-gradient(180deg, rgba(61, 255, 160, 0.04) 0%, transparent 100%)",
        display: "flex", flexDirection: "column", gap: 18
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-faint)", marginBottom: 10
          }}>{t("today.conviction")}</div>
          <div style={{
            fontSize: 32, fontWeight: 600, color: "var(--accent-primary)",
            fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
            display: "flex", alignItems: "baseline", gap: 2
          }}>
            {Math.round(conviction * 100)}<span style={{ fontSize: 16, color: "var(--text-muted)" }}>%</span>
          </div>
          {/* Bar */}
          <div style={{
            marginTop: 8, height: 3, background: "var(--bg-deep)",
            borderRadius: 2, overflow: "hidden"
          }}>
            <div style={{
              width: conviction * 100 + "%", height: "100%",
              background: "linear-gradient(90deg, var(--accent-dim), var(--accent-primary))",
              boxShadow: "0 0 8px var(--accent-primary)"
            }} />
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-faint)", marginBottom: 10
          }}>{t("today.notnow")}</div>
          {notNow.map((nn) => {
            const ref = allTasks.find((x) => x.id === nn.id);
            if (!ref) return null;
            return (
              <div key={nn.id} style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 12, color: "var(--text-secondary)", fontWeight: 500,
                  lineHeight: 1.35
                }}>{window.getTaskTitle(ref, lang)}</div>
                <div style={{
                  fontSize: 11, color: "var(--text-muted)", marginTop: 3,
                  lineHeight: 1.45
                }}>{window.getTaskField({ reason: nn.reason }, "reason", lang)}</div>
              </div>);

          })}
        </div>
      </div>
    </div>);

}

// ── Variant C: Focus Path (timeline) ─────────────────────────────────────
function CardPath({ task, lang, t, aiVariant, onStart, onSkip }) {
  const title = window.getTaskTitle(task, lang);
  const reason = window.getTaskField(task, "reason", lang);
  const nextStep = window.getTaskField(task, "next_step", lang);

  return (
    <div className="float-up" style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: 12,
      padding: "28px 28px 22px",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, var(--accent-primary), transparent)",
        opacity: 0.6
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <LumoStatus variant={aiVariant} text={t("lumo.recommend")} />
      </div>

      {/* Timeline path */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        rowGap: 0, columnGap: 16,
        position: "relative"
      }}>
        {/* Line */}
        <div style={{
          position: "absolute", left: 9, top: 8, bottom: 8,
          width: 1, background: "var(--border-default)"
        }} />

        {/* Now */}
        <div style={{ position: "relative", paddingTop: 4 }}>
          <span style={{
            width: 18, height: 18, borderRadius: "50%",
            background: "var(--accent-primary)",
            boxShadow: "0 0 0 4px rgba(61, 255, 160, 0.18)",
            display: "block"
          }} />
        </div>
        <div style={{ paddingBottom: 22 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent-primary)",
            marginBottom: 6
          }}>{lang === "zh" ? "现在" : "Now"} · {task.quadrant}</div>
          <div style={{
            fontSize: 22, fontWeight: 600, color: "var(--text-primary)",
            lineHeight: 1.3, letterSpacing: "-0.01em", textWrap: "pretty", maxWidth: 540
          }}>{title}</div>
          <div style={{
            fontSize: 13, color: "var(--text-secondary)",
            marginTop: 8, lineHeight: 1.55, maxWidth: 580
          }}>{reason}</div>
          <div style={{
            display: "flex", gap: 16, marginTop: 12,
            fontSize: 12, color: "var(--text-muted)",
            fontVariantNumeric: "tabular-nums"
          }}>
            <span>{window.getDueLabel(task.due, lang)}</span>
            <span>{window.fmtDuration(task.duration, lang)}</span>
            <span className="pip">
              {Array.from({ length: task.pomos_total }).map((_, i) =>
              <i key={i} className={i < task.pomos_done ? "on" : ""} />
              )}
            </span>
          </div>
        </div>

        {/* Next step */}
        <div style={{ position: "relative", paddingTop: 4 }}>
          <span style={{
            width: 12, height: 12, borderRadius: "50%",
            background: "var(--bg-elevated)",
            border: "1.5px solid var(--border-strong)",
            display: "block", margin: "3px 0 0 3px"
          }} />
        </div>
        <div style={{ paddingBottom: 18 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--text-faint)",
            marginBottom: 4
          }}>{t("today.next")}</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {nextStep}
          </div>
        </div>

        {/* After */}
        <div style={{ position: "relative" }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--border-strong)",
            display: "block", margin: "6px 0 0 5px"
          }} />
        </div>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--text-faint)",
            marginBottom: 4
          }}>{t("today.after")}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {lang === "zh" ? "回复投资人邮件(20 分钟)→ Q3 OKR 起草" : "Reply to investor email (20m) → Draft Q3 OKRs"}
          </div>
        </div>
      </div>

      <div style={{
        display: "flex", gap: 8, marginTop: 24,
        paddingTop: 20, borderTop: "1px solid var(--border-faint)"
      }}>
        <button className="btn btn-primary btn-lg" onClick={onStart}>
          {ICON.play} {t("today.start")}
        </button>
        <button className="btn btn-ghost" onClick={onSkip}>{t("today.skip")}</button>
        <button className="btn btn-ghost">{t("today.details")}</button>
      </div>
    </div>);

}

// ── Today empty state ────────────────────────────────────────────────────
function TodayEmpty({ lang, t, aiVariant }) {
  return (
    <div className="fade-in" style={{
      maxWidth: 600, margin: "60px auto 0", padding: "0 32px",
      textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 24
    }}>
      {/* Big ambient orb */}
      <div style={{
        position: "relative", width: 140, height: 140
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
          animation: "lumoBreath 4s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute", inset: 30, borderRadius: "50%",
          border: "1px solid var(--accent-edge)",
          animation: "lumoBreath 4s ease-in-out infinite reverse"
        }} />
        <div style={{
          position: "absolute", inset: 55, borderRadius: "50%",
          background: "var(--accent-primary)",
          boxShadow: "0 0 20px var(--accent-primary)",
          animation: "lumoBreath 4s ease-in-out infinite"
        }} />
      </div>

      <div>
        <div style={{
          fontSize: 24, fontWeight: 600, color: "var(--text-primary)",
          letterSpacing: "-0.01em", lineHeight: 1.3,
          textWrap: "pretty"
        }}>{t("today.empty.h")}</div>
        <div style={{
          fontSize: 14, color: "var(--text-secondary)", marginTop: 10,
          lineHeight: 1.6, maxWidth: 460, margin: "10px auto 0"
        }}>{t("today.empty.sub")}</div>
      </div>

      {/* Input */}
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 18px", height: 56,
          background: "var(--bg-surface)",
          border: "1px solid var(--accent-edge)",
          borderRadius: 12,
          boxShadow: "0 0 24px var(--accent-fog)"
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--accent-primary)",
            boxShadow: "0 0 8px var(--accent-primary)",
            animation: "lumoBreath 3s ease-in-out infinite",
            flexShrink: 0
          }} />
          <input className="input" placeholder={t("today.input.example")} style={{
            background: "transparent", border: "none", height: "auto", padding: 0,
            fontSize: 15, textAlign: "left"
          }} />
          <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>↵</span>
        </div>
        <div style={{
          marginTop: 14,
          display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap"
        }}>
          {(lang === "zh" ?
          ["写一份产品介绍", "回邮件", "运动 30 分钟", "学一节课"] :
          ["Write a product intro", "Reply to emails", "30-min workout", "Take one lesson"]).
          map((chip) =>
          <span key={chip} style={{
            padding: "5px 10px", borderRadius: 999,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            fontSize: 11, color: "var(--text-secondary)",
            cursor: "default"
          }}>{chip}</span>
          )}
        </div>
      </div>
    </div>);

}

// ── In-progress banner (focus session active, shown on Today) ────────────
function TodayInProgress({ lang, t, task, aiVariant, tasks, onResume }) {
  const others = tasks.filter((x) => x.today && x.id !== task.id);
  return (
    <div className="fade-in" style={{ maxWidth: 880, margin: "0 auto", padding: "20px 32px 40px" }}>
      <LumoStatus variant={aiVariant} text={t("lumo.focus")} />

      <div className="float-up" style={{
        marginTop: 16,
        position: "relative",
        background: "linear-gradient(135deg, rgba(61, 255, 160, 0.06) 0%, var(--bg-surface) 60%)",
        border: "1px solid var(--accent-edge)",
        borderRadius: 12,
        padding: 24,
        overflow: "hidden",
        display: "flex", alignItems: "center", gap: 22
      }}>
        {/* Mini progress ring */}
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <svg viewBox="0 0 80 80" style={{ position: "absolute", inset: 0 }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-default)" strokeWidth="2" />
            <circle cx="40" cy="40" r="34" fill="none"
            stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 34}
            strokeDashoffset={(1 - 0.75) * 2 * Math.PI * 34}
            transform="rotate(-90 40 40)"
            style={{ filter: "drop-shadow(0 0 6px var(--accent-primary))" }} />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column"
          }}>
            <div style={{
              fontSize: 18, fontWeight: 500, fontFamily: "var(--font-mono)",
              color: "var(--text-primary)", letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums", lineHeight: 1
            }}>18:42</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              2 / 4
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent-primary)",
            marginBottom: 6, display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent-primary)",
              boxShadow: "0 0 8px var(--accent-primary)",
              animation: "lumoBreath 3s ease-in-out infinite"
            }} />
            {lang === "zh" ? "正在专注" : "In a focus session"}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 600, color: "var(--text-primary)",
            letterSpacing: "-0.01em", lineHeight: 1.3,
            textWrap: "pretty"
          }}>{window.getTaskTitle(task, lang)}</div>
          <div style={{
            display: "flex", gap: 14, marginTop: 6,
            fontSize: 11, color: "var(--text-muted)",
            fontVariantNumeric: "tabular-nums"
          }}>
            <span>{t("focus.est")} {window.fmtDuration(90, lang)}</span>
            <span>{t("focus.actual")} {window.fmtDuration(31, lang)}</span>
            <span>{t("focus.todaytotal")} {window.fmtDuration(72, lang)}</span>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={onResume} style={{ flexShrink: 0 }}>
          {ICON.arrowRight} {lang === "zh" ? "回到专注" : "Resume Focus"}
        </button>
      </div>

      {/* Others dimmed */}
      <div style={{ marginTop: 36, opacity: 0.5, pointerEvents: "none" }}>
        <div className="section-h">{t("today.list")}</div>
        {others.map((task) =>
        <TaskRow key={task.id} task={task} lang={lang} />
        )}
      </div>
    </div>);

}

// ── Today screen ─────────────────────────────────────────────────────────
function TodayScreen({ lang, t, cardVariant, aiVariant, state, tasks, completed, onStart, onResume, onOpenQuickCreate }) {
  if (state === "empty") return <TodayEmpty lang={lang} t={t} aiVariant={aiVariant} />;

  const recommended = tasks.find((x) => x.quadrant === "Q1" && x.today) || tasks[0];

  if (state === "inprogress") {
    return <TodayInProgress lang={lang} t={t} task={recommended} aiVariant={aiVariant}
    tasks={tasks} onResume={onResume} />;
  }

  const todayTasks = tasks.filter((x) => x.today && x.id !== recommended.id);

  let card;
  if (cardVariant === "conviction") {
    card = <CardConviction task={recommended} lang={lang} t={t} aiVariant={aiVariant}
    allTasks={tasks} onStart={onStart} />;
  } else if (cardVariant === "path") {
    card = <CardPath task={recommended} lang={lang} t={t} aiVariant={aiVariant} onStart={onStart} />;
  } else {
    card = <CardClassic task={recommended} lang={lang} t={t} aiVariant={aiVariant} onStart={onStart} />;
  }

  return (
    <div className="fade-in" style={{ maxWidth: 880, margin: "0 auto", padding: "20px 32px 40px" }}>
      {/* Lumo status header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <LumoStatus variant={aiVariant} text={t("lumo.sorted")} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-faint)" }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--status-success)"
          }} />
          <span>{t("status.local").split(" · ")[0]}</span>
        </div>
      </div>

      {card}

      {/* Today list */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div className="section-h" style={{ margin: 0 }}>{t("today.list")}</div>
          <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{todayTasks.length} {lang === "zh" ? "项" : "tasks"}</span>
        </div>
        <div>
          {todayTasks.map((task) =>
          <TaskRow key={task.id} task={task} lang={lang} />
          )}
        </div>
      </div>

      {/* Completed today */}
      {completed && completed.length > 0 &&
      <div style={{ marginTop: 32 }}>
          <div className="section-h">{t("today.completed")}</div>
          {completed.map((c) =>
        <div key={c.id} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 0", borderBottom: "1px solid var(--border-faint)",
          opacity: 0.55
        }}>
              <span style={{
            width: 18, height: 18, borderRadius: "50%",
            background: "var(--accent-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--bg-base)"
          }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5 11-11" />
                </svg>
              </span>
              <div style={{
            fontSize: 13, color: "var(--text-secondary)",
            textDecoration: "line-through", textDecorationColor: "var(--text-faint)",
            flex: 1
          }}>{window.getTaskTitle(c, lang)}</div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>
                {window.fmtDuration(c.duration, lang)}
              </span>
            </div>
        )}
        </div>
      }

      {/* Natural language input */}
      <ComposeBar
        lang={lang} t={t}
        placeholder={t("today.input")}
        onOpenEditor={onOpenQuickCreate} />
    </div>);

}

Object.assign(window, { TodayScreen });