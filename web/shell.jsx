// shell.jsx — Lumo Task app shell (window, sidebar, topbar, icons)

// ── Icons (Lucide-style, 1.5px stroke) ───────────────────────────────────
const ICON = {
  today:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>,

  matrix:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>,

  settings:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>,

  plus:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>,

  search:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>,

  arrowRight:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>,

  arrowLeft:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 5l-7 7 7 7" />
    </svg>,

  check:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5 11-11" />
    </svg>,

  more:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" />
    </svg>,

  pause:
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>,

  play:
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M7 5v14l12-7z" />
    </svg>,

  skip:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4l10 8-10 8V4zM19 5v14" />
    </svg>,

  bell:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>,

  sparkle:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>,

  lock:
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>,

  drag:
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
    </svg>

};

// ── Lumo logo glyph ──────────────────────────────────────────────────────
function LumoGlyph({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id="lumoGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-primary)" />
          <stop offset="100%" stopColor="var(--accent-dim)" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--accent-primary)" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="12" cy="12" r="4.5" fill="url(#lumoGrad)" />
      <circle cx="12" cy="12" r="2" fill="var(--bg-base)" />
    </svg>);

}

// ── Window chrome ────────────────────────────────────────────────────────
function Window({ children, pulse = "default" }) {
  return (
    <div className="stage">
      <div className="page-bg" />
      <div className="win">
        <div className="win-titlebar">
          <div className="traffic"><i /><i /><i /></div>
          <div className="title">Lumo Task</div>
        </div>
        <div className={"lumo-pulse " + (pulse === "reduced" ? "lumo-pulse-reduced" : "")} />
        <div className="win-body">{children}</div>
      </div>
    </div>);

}

// ── Lumo status — three variants ─────────────────────────────────────────
function LumoStatus({ variant = "dot", text }) {
  if (variant === "orb") {
    return (
      <div className="lumo-bar">
        <div className="lumo-orb">
          <div className="ring" /><div className="ring" /><div className="ring" />
        </div>
        <span>{text}</span>
      </div>);

  }
  if (variant === "text") {
    return (
      <div className="lumo-bar">
        <span className="lumo-text" style={{
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--accent-primary)", fontWeight: 500
        }}>LUMO</span>
        <span style={{ color: "var(--text-faint)" }}>·</span>
        <span className="lumo-text">{text}</span>
      </div>);

  }
  return (
    <div className="lumo-bar">
      <span className="lumo-glyph">
        <span className="halo" />
        <span className="core" />
      </span>
      <span>{text}</span>
    </div>);

}

// ── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ route, setRoute, t, taskCount }) {
  const items = [
  { key: "today", label: t("nav.today"), icon: ICON.today, badge: 5 },
  { key: "matrix", label: t("nav.matrix"), icon: ICON.matrix, badge: taskCount },
  { key: "settings", label: t("nav.settings"), icon: ICON.settings }];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="glyph"><LumoGlyph /></span>
        <span>{t("brand.name")} <span style={{ color: "var(--text-faint)", fontWeight: 400, marginLeft: 4 }}>Task</span></span>
      </div>
      <div className="sidebar-section">{t("nav.section.workspace")}</div>
      {items.map((it) =>
      <div key={it.key}
      className={"nav-item " + (route === it.key ? "active" : "")}
      onClick={() => setRoute(it.key)}>
          {it.icon}
          <span>{it.label}</span>
          {it.badge != null && <span className="badge">{it.badge}</span>}
        </div>
      )}
      <div className="sidebar-foot">
        <div className="local-status">
          <span className="dot" />
          <span>{t("status.local")}</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
          {t("status.local.alone")}
        </div>
      </div>
    </div>);

}

// ── Topbar ───────────────────────────────────────────────────────────────
function Topbar({ title, sub, t, onLogin, onQuickAdd }) {
  return (
    <div className="topbar">
      <div>
        <span className="page-title">{title}</span>
        {sub && <span className="page-sub">{sub}</span>}
      </div>
      <div className="spacer" />
      <div className="topbar-search">
        <span className="topbar-search-icon">{ICON.search}</span>
        <input
          type="text"
          placeholder={t("topbar.search")}
          className="topbar-search-input"
        />
        <span className="topbar-search-kbd">⌘K</span>
      </div>
      <button className="icon-btn" title={t("topbar.quickadd")} onClick={onQuickAdd}>{ICON.plus}</button>
      <div className="avatar" onClick={onLogin}>AS</div>
    </div>);

}

// ── Task actions popover (Edit / Move / Snooze / Delete) ─────────────────
// Defined here in shell.jsx so TaskRow can use it; exported to window for today.jsx etc.
function TaskActions({ lang, onClose, align = "right" }) {
  React.useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") onClose();};
    const onClick = (e) => {if (!e.target.closest("[data-task-actions]")) onClose();};
    window.addEventListener("keydown", onKey);
    setTimeout(() => window.addEventListener("mousedown", onClick), 0);
    return () => {window.removeEventListener("keydown", onKey);window.removeEventListener("mousedown", onClick);};
  }, []);
  const items = [
    { key: "edit", label: lang === "zh" ? "编辑" : "Edit", hint: "E", icon:
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg> },
    { key: "move", label: lang === "zh" ? "移动象限" : "Move quadrant", hint: "M", icon:
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l4-4 4 4"/><path d="M9 5v14"/><path d="M19 15l-4 4-4-4"/><path d="M15 19V5"/></svg> },
    { key: "snooze", label: lang === "zh" ? "稍后提醒" : "Snooze", icon:
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M5 4l3 2M19 4l-3 2"/></svg> },
    { key: "duplicate", label: lang === "zh" ? "复制" : "Duplicate", icon:
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg> },
    { key: "divider" },
    { key: "delete", label: lang === "zh" ? "删除" : "Delete", danger: true, icon:
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg> }
  ];

  return (
    <div data-task-actions style={{
      position: "absolute", top: "calc(100% + 6px)",
      [align]: 0, zIndex: 200,
      width: 208, padding: 4,
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: 8,
      boxShadow: "var(--shadow-lifted)",
      animation: "fadeIn 140ms var(--ease-default) both"
    }}>
      {items.map((it) => it.key === "divider" ?
        <div key="d" style={{ height: 1, background: "var(--border-faint)", margin: "4px 6px" }} /> :
        <button key={it.key}
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", width: "100%", gap: 10,
            padding: "7px 10px", borderRadius: 6,
            background: "transparent", border: "none",
            color: it.danger ? "var(--status-urgent)" : "var(--text-primary)",
            fontFamily: "inherit", fontSize: 13, textAlign: "left",
            cursor: "default",
            transition: "background 120ms var(--ease-default)"
          }}
          onMouseEnter={(e) => {e.currentTarget.style.background = it.danger ? "rgba(255, 107, 107, 0.08)" : "var(--bg-subtle)";}}
          onMouseLeave={(e) => {e.currentTarget.style.background = "transparent";}}>
          {it.icon && <span style={{ width: 14, height: 14, display: "inline-flex", flexShrink: 0, opacity: 0.8 }}>{it.icon}</span>}
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.hint && <span style={{
            fontSize: 10, color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
            padding: "1px 5px", borderRadius: 3,
            border: "1px solid var(--border-default)"
          }}>{it.hint}</span>}
        </button>
      )}
    </div>);

}

// ── Generic task row (used in Today list + Matrix list view) ─────────────
function TaskRow({ task, lang, onComplete, compact = false }) {
  const q = task.quadrant === "unclassified" ? "un" : task.quadrant.toLowerCase();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="row-task"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: compact ? "10px 0 10px 8px" : "14px 0 14px 8px",
        borderBottom: "1px solid var(--border-faint)",
        marginLeft: -8, paddingRight: 8, marginRight: -8,
        borderRadius: 6,
        background: hovered || menuOpen ? "var(--bg-subtle)" : "transparent",
        transition: "background 120ms var(--ease-default)",
        position: "relative"
      }}>
      <button
        onClick={() => onComplete && onComplete(task.id)}
        style={{
          width: 18, height: 18, borderRadius: "50%",
          border: "1.5px solid var(--border-strong)",
          background: "transparent",
          flexShrink: 0, cursor: "default",
          display: "flex", alignItems: "center", justifyContent: "center"
        }} />
      <span className={"qdot qdot-" + q} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
          {window.getTaskTitle(task, lang)}
        </div>
        <div style={{
          display: "flex", gap: 12, marginTop: 4,
          fontSize: 12, color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums"
        }}>
          {task.due && <span>{window.getDueLabel(task.due, lang)}</span>}
          {task.duration && <span>{window.fmtDuration(task.duration, lang)}</span>}
          <span className="pip">
            {Array.from({ length: task.pomos_total }).map((_, i) =>
            <i key={i} className={i < task.pomos_done ? "on" : ""} />
            )}
          </span>
        </div>
      </div>
      {task.quadrant !== "unclassified" &&
      <span className={"chip chip-" + task.quadrant.toLowerCase()}>{task.quadrant}</span>
      }
      <div style={{ position: "relative" }} data-task-actions>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          style={{
            width: 28, height: 28, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: menuOpen ? "var(--bg-elevated)" : "transparent",
            border: "none",
            // Default tone matches the row's muted content color; lifts on row hover / menu open
            color: menuOpen ? "var(--text-primary)" : (hovered ? "var(--text-secondary)" : "var(--text-faint)"),
            cursor: "default", fontFamily: "inherit",
            transition: "all 120ms var(--ease-default)",
            opacity: hovered || menuOpen ? 1 : 0.55
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = hovered ? "var(--text-secondary)" : "var(--text-faint)"; } }}>
          <span style={{ width: 16, height: 16, display: "inline-flex" }}>{ICON.more}</span>
        </button>
        {menuOpen && <TaskActions lang={lang} onClose={() => setMenuOpen(false)} />}
      </div>
    </div>);

}

Object.assign(window, {
  ICON, LumoGlyph, Window, LumoStatus, Sidebar, Topbar, TaskRow, TaskActions
});