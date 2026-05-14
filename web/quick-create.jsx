// quick-create.jsx — Quick create task modal (focused, simple)

// ── Inline calendar picker ──────────────────────────────────────────────
function CalendarPopover({ value, onChange, lang, onClose }) {
  const [view, setView] = React.useState(() => {
    const d = value || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  React.useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") onClose && onClose();};
    const onClick = (e) => {if (!e.target.closest("[data-cal-pop]")) onClose && onClose();};
    window.addEventListener("keydown", onKey);
    setTimeout(() => window.addEventListener("mousedown", onClick), 0);
    return () => {window.removeEventListener("keydown", onKey);window.removeEventListener("mousedown", onClick);};
  }, []);

  const monthNames = lang === "zh" ?
  ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] :
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = lang === "zh" ?
  ["日", "一", "二", "三", "四", "五", "六"] :
  ["S", "M", "T", "W", "T", "F", "S"];

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d) => value && d === value.getDate() &&
  view.month === value.getMonth() && view.year === value.getFullYear();
  const isToday = (d) => d === today.getDate() &&
  view.month === today.getMonth() && view.year === today.getFullYear();

  const navMonth = (delta) => {
    let m = view.month + delta,y = view.year;
    if (m < 0) {m = 11;y--;}if (m > 11) {m = 0;y++;}
    setView({ year: y, month: m });
  };

  return (
    <div data-cal-pop style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 60,
      width: 264, padding: 12,
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: 10,
      boxShadow: "var(--shadow-lifted)",
      animation: "fadeIn 140ms var(--ease-default) both"
    }}>
      {/* Month nav */}
      <div style={{
        display: "flex", alignItems: "center", marginBottom: 10
      }}>
        <button onClick={() => navMonth(-1)} style={navBtnStyle}>
          <span style={{ width: 12, height: 12, display: "inline-flex" }}>{ICON.arrowLeft}</span>
        </button>
        <div style={{
          flex: 1, textAlign: "center",
          fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
          letterSpacing: "0.01em"
        }}>{monthNames[view.month]} {view.year}</div>
        <button onClick={() => navMonth(1)} style={navBtnStyle}>
          <span style={{ width: 12, height: 12, display: "inline-flex" }}>{ICON.arrowRight}</span>
        </button>
      </div>
      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {dayNames.map((n, i) =>
        <div key={i} style={{
          textAlign: "center", fontSize: 10, color: "var(--text-faint)",
          fontWeight: 600, letterSpacing: "0.05em", padding: "4px 0"
        }}>{n}</div>
        )}
      </div>
      {/* Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((d, i) => d === null ? <div key={i} /> :
        <button key={i}
        onClick={() => {onChange(new Date(view.year, view.month, d));onClose && onClose();}}
        style={{
          height: 30, borderRadius: 6, cursor: "default",
          border: "1px solid " + (isSelected(d) ? "var(--accent-primary)" : "transparent"),
          background: isSelected(d) ? "var(--accent-fog)" : "transparent",
          color: isSelected(d) ? "var(--accent-primary)" :
          isToday(d) ? "var(--text-primary)" : "var(--text-secondary)",
          fontFamily: "inherit", fontSize: 12,
          fontWeight: isSelected(d) || isToday(d) ? 600 : 400,
          fontVariantNumeric: "tabular-nums",
          transition: "background 120ms var(--ease-default)",
          position: "relative"
        }}
        onMouseEnter={(e) => {if (!isSelected(d)) e.currentTarget.style.background = "var(--bg-subtle)";}}
        onMouseLeave={(e) => {if (!isSelected(d)) e.currentTarget.style.background = "transparent";}}>
            {d}
            {isToday(d) && !isSelected(d) &&
          <span style={{
            position: "absolute", bottom: 4, left: "50%",
            transform: "translateX(-50%)",
            width: 3, height: 3, borderRadius: "50%",
            background: "var(--accent-primary)"
          }} />
          }
          </button>
        )}
      </div>
      {/* Footer shortcuts */}
      <div style={{
        display: "flex", gap: 6, marginTop: 10,
        paddingTop: 10, borderTop: "1px solid var(--border-faint)"
      }}>
        {[
        { k: "today", label: lang === "zh" ? "今天" : "Today", offset: 0 },
        { k: "tom", label: lang === "zh" ? "明天" : "Tomorrow", offset: 1 },
        { k: "wk", label: lang === "zh" ? "一周后" : "Next week", offset: 7 }].
        map((s) =>
        <button key={s.k}
        onClick={() => {
          const d = new Date();d.setDate(d.getDate() + s.offset);d.setHours(0, 0, 0, 0);
          onChange(d);onClose && onClose();
        }}
        style={{
          flex: 1, padding: "5px 6px", borderRadius: 5,
          background: "transparent",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
          fontFamily: "inherit", fontSize: 11, cursor: "default",
          transition: "all 120ms var(--ease-default)"
        }}
        onMouseEnter={(e) => {e.currentTarget.style.background = "var(--bg-subtle)";e.currentTarget.style.color = "var(--text-primary)";}}
        onMouseLeave={(e) => {e.currentTarget.style.background = "transparent";e.currentTarget.style.color = "var(--text-secondary)";}}>
            {s.label}
          </button>
        )}
      </div>
    </div>);

}

const navBtnStyle = {
  width: 28, height: 28, borderRadius: 6,
  background: "transparent", border: "none",
  color: "var(--text-secondary)",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "default", fontFamily: "inherit",
  transition: "background 120ms var(--ease-default)"
};

// ── Number stepper (duration in minutes) ────────────────────────────────
function NumberStepper({ value, onChange, min = 5, max = 480, step = 5, unit }) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const stepperBtn = (sign) => ({
    width: 32, height: 38, flexShrink: 0,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-secondary)",
    fontFamily: "inherit", fontSize: 16,
    cursor: "default", display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: sign < 0 ? "8px 0 0 8px" : "0 8px 8px 0",
    transition: "all 120ms var(--ease-default)"
  });
  return (
    <div style={{ display: "flex", alignItems: "stretch", height: 38 }}>
      <button onClick={() => onChange(clamp(value - step))} style={stepperBtn(-1)}
      onMouseEnter={(e) => {e.currentTarget.style.background = "var(--bg-subtle)";e.currentTarget.style.color = "var(--text-primary)";}}
      onMouseLeave={(e) => {e.currentTarget.style.background = "var(--bg-elevated)";e.currentTarget.style.color = "var(--text-secondary)";}}>
        −
      </button>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6,
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-default)",
        borderBottom: "1px solid var(--border-default)",
        color: "var(--text-primary)",
        fontFamily: "inherit", fontSize: 14, fontWeight: 500,
        fontVariantNumeric: "tabular-nums"
      }}>
        <input
          type="number" min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
          style={{
            width: 56, textAlign: "right", padding: 0,
            background: "transparent", border: "none", outline: "none",
            color: "inherit", fontFamily: "inherit", fontSize: 14, fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            MozAppearance: "textfield"
          }} />
        
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{unit}</span>
      </div>
      <button onClick={() => onChange(clamp(value + step))} style={stepperBtn(1)}
      onMouseEnter={(e) => {e.currentTarget.style.background = "var(--bg-subtle)";e.currentTarget.style.color = "var(--text-primary)";}}
      onMouseLeave={(e) => {e.currentTarget.style.background = "var(--bg-elevated)";e.currentTarget.style.color = "var(--text-secondary)";}}>
        +
      </button>
    </div>);

}

function ParsedField({ label, colSpan, children }) {
  return (
    <div style={{ gridColumn: colSpan === 2 ? "span 2" : "auto" }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--text-faint)",
        marginBottom: 6
      }}>{label}</div>
      {children}
    </div>);

}

function fmtDate(d, lang) {
  if (!d) return lang === "zh" ? "选择日期" : "Pick a date";
  const today = new Date();today.setHours(0, 0, 0, 0);
  const dd = new Date(d);dd.setHours(0, 0, 0, 0);
  const diff = Math.round((dd - today) / 86400000);
  if (diff === 0) return lang === "zh" ? "今天" : "Today";
  if (diff === 1) return lang === "zh" ? "明天" : "Tomorrow";
  if (diff === -1) return lang === "zh" ? "昨天" : "Yesterday";
  const months = lang === "zh" ?
  ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] :
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return lang === "zh" ?
  `${months[dd.getMonth()]}${dd.getDate()}日` :
  `${months[dd.getMonth()]} ${dd.getDate()}`;
}

function QuickCreate({ lang, t, onClose, aiVariant, initialQuadrant }) {
  const [title, setTitle] = React.useState(lang === "zh" ? "完成首页线框" : "Finish homepage wireframes");
  const [quadrant, setQuadrant] = React.useState(initialQuadrant || "Q2");
  const initialDue = new Date();initialDue.setDate(initialDue.getDate() + 2);initialDue.setHours(0, 0, 0, 0);
  const [due, setDue] = React.useState(initialDue);
  const [calOpen, setCalOpen] = React.useState(false);
  const [duration, setDuration] = React.useState(90);
  const titleRef = React.useRef(null);

  React.useEffect(() => {
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.focus();
        // Initial autosize for textarea
        const el = titleRef.current;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 180) + "px";
      }
    }, 30);
    const onKey = (e) => {if (e.key === "Escape" && !calOpen) onClose && onClose();};
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [calOpen]);

  const pomos = Math.max(1, Math.ceil(duration / 25));

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0,
        background: "rgba(8, 11, 10, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 100, paddingTop: 100,
        animation: "fadeIn 200ms var(--ease-default) both"
      }}>
      <div onClick={(e) => e.stopPropagation()} className="float-up" style={{
        width: 520,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: 14,
        overflow: "visible",
        boxShadow: "var(--shadow-lifted), 0 0 40px var(--accent-fog)"
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "16px 20px 14px",
          borderBottom: "1px solid var(--border-faint)"
        }}>
          <span style={{ width: 16, height: 16, display: "inline-flex", color: "var(--accent-primary)" }}>
            {ICON.plus}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            {lang === "zh" ? "新建任务" : "Create task"}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{
            padding: "1px 5px", borderRadius: 3, fontSize: 10,
            border: "1px solid var(--border-default)",
            background: "var(--bg-base)", fontFamily: "var(--font-mono)",
            color: "var(--text-faint)"
          }}>esc</span>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px 8px" }}>
          {/* Title — multi-line textarea (auto-grow) */}
          <ParsedField label={lang === "zh" ? "任务" : "Task"} colSpan={2}>
            <textarea
              ref={titleRef}
              className="input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // auto-grow
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
              }}
              onKeyDown={(e) => {
                // Cmd/Ctrl+Enter submits; plain Enter inserts newline
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  onClose && onClose();
                }
              }}
              rows={2}
              placeholder={lang === "zh" ? "想做什么?可以输入多行内容、子任务和备注…" : "What do you want to do? Multi-line — add sub-steps, notes…"}
              style={{
                height: "auto", minHeight: 64, maxHeight: 180,
                padding: "10px 14px",
                fontSize: 15, fontWeight: 500, lineHeight: 1.5,
                resize: "none", overflowY: "auto",
                fontFamily: "inherit"
              }} />
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginTop: 6, fontSize: 10, color: "var(--text-faint)"
            }}>
              <span>{lang === "zh" ? "Enter 换行 · ⌘↵ 添加" : "Enter for newline · ⌘↵ to add"}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{title.length} / 280</span>
            </div>
          </ParsedField>

          {/* Quadrant */}
          <div style={{ marginTop: 14 }}>
            <ParsedField label={lang === "zh" ? "象限" : "Quadrant"}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6
              }}>
                {[
                  { q: "Q1", title: lang === "zh" ? "立即做" : "Do first", sub: lang === "zh" ? "重要 · 紧急" : "Urgent · Important", fog: "rgba(255, 107, 107, 0.14)" },
                  { q: "Q2", title: lang === "zh" ? "安排做" : "Schedule", sub: lang === "zh" ? "重要 · 不紧急" : "Important · Later", fog: "rgba(168, 230, 75, 0.14)" },
                  { q: "Q3", title: lang === "zh" ? "委托做" : "Delegate", sub: lang === "zh" ? "紧急 · 不重要" : "Urgent · Minor", fog: "rgba(91, 200, 212, 0.14)" },
                  { q: "Q4", title: lang === "zh" ? "减少做" : "Drop", sub: lang === "zh" ? "不紧急 · 不重要" : "Not urgent · Minor", fog: "rgba(107, 126, 120, 0.14)" }
                ].map(({ q, title: qTitle, sub, fog }) => {
                  const active = q === quadrant;
                  const qVar = `var(--${q.toLowerCase()}-color)`;
                  return (
                    <button key={q}
                      onClick={() => setQuadrant(q)}
                      style={{
                        padding: "9px 10px 10px",
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3,
                        background: active ? "var(--bg-elevated)" : "transparent",
                        border: "1px solid " + (active ? qVar : "var(--border-default)"),
                        borderRadius: 8,
                        color: "var(--text-primary)",
                        cursor: "default", fontFamily: "inherit",
                        position: "relative", textAlign: "left",
                        transition: "all 120ms var(--ease-default)",
                        boxShadow: active ? `0 0 0 3px ${fog}` : "none",
                        overflow: "hidden"
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                      {/* Row 1 — Q-pill */}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "1px 6px 2px",
                        borderRadius: 3,
                        background: fog,
                        color: qVar,
                        fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.04em",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap"
                      }}>
                        <span style={{
                          width: 4, height: 4, borderRadius: "50%",
                          background: qVar,
                          boxShadow: active ? `0 0 5px ${qVar}` : "none"
                        }} />
                        {q}
                      </div>
                      {/* Row 2 — verb */}
                      <div style={{
                        fontSize: 12,
                        fontWeight: active ? 600 : 500,
                        color: active ? "var(--text-primary)" : "var(--text-secondary)",
                        letterSpacing: "-0.005em",
                        whiteSpace: "nowrap", textOverflow: "ellipsis",
                        overflow: "hidden", maxWidth: "100%"
                      }}>{qTitle}</div>
                      {/* Row 3 — subtitle */}
                      <div style={{
                        fontSize: 10, color: "var(--text-muted)",
                        lineHeight: 1.35, letterSpacing: "0.01em",
                        whiteSpace: "nowrap", textOverflow: "ellipsis",
                        overflow: "hidden", maxWidth: "100%"
                      }}>{sub}</div>
                    </button>
                  );
                })}
              </div>
            </ParsedField>
          </div>

          {/* Due + Duration */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14
          }}>
            <ParsedField label={lang === "zh" ? "截止日期" : "Due date"}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setCalOpen((v) => !v)}
                  style={{
                    width: "100%", height: 38,
                    padding: "0 12px",
                    background: calOpen ? "var(--bg-elevated)" : "var(--bg-surface)",
                    border: "1px solid " + (calOpen ? "var(--accent-edge)" : "var(--border-default)"),
                    boxShadow: calOpen ? "0 0 0 3px var(--accent-fog)" : "none",
                    borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 10,
                    color: "var(--text-primary)", fontSize: 14,
                    cursor: "default", fontFamily: "inherit",
                    transition: "all 120ms var(--ease-default)"
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M3 9h18M8 2v4M16 2v4" />
                  </svg>
                  <span style={{ flex: 1, textAlign: "left" }}>{fmtDate(due, lang)}</span>
                </button>
                {calOpen &&
                <CalendarPopover value={due} lang={lang}
                onChange={setDue}
                onClose={() => setCalOpen(false)} />
                }
              </div>
            </ParsedField>

            <ParsedField label={lang === "zh" ? "预计耗时" : "Estimated"}>
              <NumberStepper
                value={duration}
                onChange={setDuration}
                min={5} max={480} step={5}
                unit={lang === "zh" ? "分钟" : "min"} />
            </ParsedField>
          </div>

          {/* Pomodoros — compact visual derivative */}
          <div style={{
            marginTop: 14, padding: "10px 12px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-faint)",
            borderRadius: 8,
            display: "flex", alignItems: "center", gap: 10
          }}>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--text-faint)"
            }}>
              {lang === "zh" ? "约" : "≈"} {pomos} {lang === "zh" ? "个番茄" : "pomodoros"}
            </span>
            <span style={{ flex: 1 }} />
            <span className="pip">
              {Array.from({ length: Math.max(pomos, 4) }).map((_, i) =>
              <i key={i} className={i < pomos ? "on" : ""} style={{ width: 8, height: 8 }} />
              )}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-faint)",
          borderRadius: "0 0 14px 14px"
        }}>
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>
            {lang === "zh" ? "取消" : "Cancel"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            {lang === "zh" ? "添加并开始" : "Add & start"}
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            {lang === "zh" ? "添加" : "Add"}
            <span style={{
              padding: "1px 5px", borderRadius: 3, marginLeft: 6,
              background: "rgba(0,0,0,0.15)",
              fontFamily: "var(--font-mono)", fontSize: 10
            }}>↵</span>
          </button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { QuickCreate });