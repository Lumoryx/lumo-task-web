// matrix.jsx — Eisenhower Matrix + 3 layout variants

const Q_META = {
  Q1: { key: "q1", subKey: "q1sub", color: "var(--q1-color)", bg: "rgba(255, 107, 107, 0.04)" },
  Q2: { key: "q2", subKey: "q2sub", color: "var(--q2-color)", bg: "rgba(168, 230, 75, 0.03)" },
  Q3: { key: "q3", subKey: "q3sub", color: "var(--q3-color)", bg: "rgba(91, 200, 212, 0.03)" },
  Q4: { key: "q4", subKey: "q4sub", color: "var(--q4-color)", bg: "rgba(107, 126, 120, 0.03)" }
};

function MatrixCard({ task, lang, dim = false, dragging = false }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: "var(--bg-elevated)",
      border: "1px solid " + (dragging ? "var(--accent-edge)" : "var(--border-default)"),
      borderRadius: 8,
      cursor: "default",
      opacity: dim ? 0.7 : 1,
      transition: "all 120ms var(--ease-default)",
      transform: dragging ? "rotate(-2deg) scale(1.02)" : "none",
      boxShadow: dragging ? "var(--shadow-lifted), 0 0 0 1px var(--accent-edge)" : "none",
      position: dragging ? "relative" : "static",
      zIndex: dragging ? 50 : "auto"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <button style={{
          width: 14, height: 14, borderRadius: "50%",
          border: "1.5px solid var(--border-strong)",
          background: "transparent", marginTop: 2,
          flexShrink: 0, cursor: "default"
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, color: "var(--text-primary)",
            fontWeight: 500, lineHeight: 1.4,
            textWrap: "pretty"
          }}>{window.getTaskTitle(task, lang)}</div>
          <div style={{
            display: "flex", gap: 10, marginTop: 6, alignItems: "center",
            fontSize: 11, color: "var(--text-muted)",
            fontVariantNumeric: "tabular-nums"
          }}>
            {task.due && <span>{window.getDueLabel(task.due, lang)}</span>}
            {task.duration && <span>· {window.fmtDuration(task.duration, lang)}</span>}
            <span style={{ marginLeft: "auto" }} className="pip">
              {Array.from({ length: task.pomos_total }).map((_, i) =>
              <i key={i} className={i < task.pomos_done ? "on" : ""} />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>);

}

function QuadrantBox({ q, lang, t, tasks, dragOver = false, big = false, ghostCard = null, onAdd }) {
  const meta = Q_META[q];
  const overload = q === "Q1" && tasks.length >= 4;
  const [addHovered, setAddHovered] = React.useState(false);
  const [addPressed, setAddPressed] = React.useState(false);
  return (
    <div style={{
      background: dragOver ? "rgba(61, 255, 160, 0.05)" : meta.bg,
      border: `1px solid ${dragOver ? "var(--accent-primary)" : "var(--border-default)"}`,
      boxShadow: dragOver ? "inset 0 0 0 1px var(--accent-edge), 0 0 24px var(--accent-fog)" : "none",
      borderRadius: 10,
      padding: 14,
      display: "flex", flexDirection: "column",
      minHeight: big ? 0 : 200,
      position: "relative",
      transition: "all 160ms var(--ease-default)"
    }}>
      {/* Quadrant accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 14, right: 14, height: 2,
        background: meta.color, opacity: 0.7, borderRadius: 2
      }} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: meta.color, letterSpacing: "0.01em" }}>
          {t("matrix." + meta.key)}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
          {tasks.length}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
        {t("matrix." + meta.subKey)}
      </div>

      {overload &&
      <div style={{
        fontSize: 11, color: "var(--status-warning)",
        padding: "8px 10px", marginBottom: 10,
        background: "rgba(255, 179, 71, 0.06)",
        border: "1px solid rgba(255, 179, 71, 0.25)",
        borderRadius: 6,
        lineHeight: 1.4
      }}>{t("matrix.overload")}</div>
      }

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 0, overflow: "auto" }}>
        {tasks.map((task) => <MatrixCard key={task.id} task={task} lang={lang} />)}
        {ghostCard &&
        <div style={{
          padding: "10px 12px",
          background: "transparent",
          border: "1.5px dashed var(--accent-edge)",
          borderRadius: 8,
          fontSize: 12, color: "var(--accent-primary)",
          display: "flex", alignItems: "center", gap: 8
        }}>
            <span style={{
            width: 14, height: 14, borderRadius: "50%",
            border: "1.5px solid var(--accent-primary)",
            flexShrink: 0
          }} />
            <span style={{ flex: 1, color: "var(--accent-primary)" }}>{window.getTaskTitle(ghostCard, lang)}</span>
            <span style={{ fontSize: 10, color: "var(--accent-primary)", opacity: 0.7 }}>
              {lang === "zh" ? "放到这里" : "Drop here"}
            </span>
          </div>
        }
      </div>
      <button
        onClick={() => onAdd && onAdd(q)}
        onMouseEnter={() => setAddHovered(true)}
        onMouseLeave={() => { setAddHovered(false); setAddPressed(false); }}
        onMouseDown={() => setAddPressed(true)}
        onMouseUp={() => setAddPressed(false)}
        style={{
          marginTop: 8,
          background: addHovered ? "var(--accent-fog)" : "transparent",
          border: "1px dashed " + (addHovered ? "var(--accent-edge)" : "var(--border-default)"),
          color: addHovered ? "var(--accent-primary)" : "var(--text-muted)",
          fontSize: 12, fontWeight: addHovered ? 500 : 400,
          padding: "8px 10px", borderRadius: 6,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          cursor: "default",
          fontFamily: "inherit",
          transform: addPressed ? "scale(0.98)" : (addHovered ? "translateY(-1px)" : "translateY(0)"),
          boxShadow: addHovered && !addPressed ? "0 4px 12px rgba(0,0,0,0.25), 0 0 16px var(--accent-fog)" : "none",
          transition: "all 160ms var(--ease-default)"
        }}>
        <span style={{
          width: 14, height: 14, display: "inline-flex",
          transform: addHovered ? "rotate(90deg)" : "rotate(0)",
          transition: "transform 220ms var(--ease-spring)"
        }}>{ICON.plus}</span>
        {t("matrix.addtask")}
      </button>
    </div>);

}

// ── Variant A: Classic 2×2 grid ──────────────────────────────────────────
function MatrixClassic({ lang, t, byQuadrant, dragOver, dragGhostTask, onAddTask }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      gap: 12,
      flex: 1,
      minHeight: 0,
      position: "relative"
    }}>
      <QuadrantBox q="Q1" lang={lang} t={t} tasks={byQuadrant.Q1} dragOver={dragOver === "Q1"} onAdd={onAddTask}
      ghostCard={dragOver === "Q1" ? dragGhostTask : null} />
      <QuadrantBox q="Q2" lang={lang} t={t} tasks={byQuadrant.Q2} dragOver={dragOver === "Q2"} onAdd={onAddTask}
      ghostCard={dragOver === "Q2" ? dragGhostTask : null} />
      <QuadrantBox q="Q3" lang={lang} t={t} tasks={byQuadrant.Q3} dragOver={dragOver === "Q3"} onAdd={onAddTask}
      ghostCard={dragOver === "Q3" ? dragGhostTask : null} />
      <QuadrantBox q="Q4" lang={lang} t={t} tasks={byQuadrant.Q4} dragOver={dragOver === "Q4"} onAdd={onAddTask}
      ghostCard={dragOver === "Q4" ? dragGhostTask : null} />
    </div>);

}

// ── Variant B: Compact list (all quadrants vertically) ──────────────────
function MatrixList({ lang, t, byQuadrant }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "auto", paddingRight: 8 }}>
      {["Q1", "Q2", "Q3", "Q4"].map((q) => {
        const meta = Q_META[q];
        const items = byQuadrant[q];
        return (
          <div key={q} style={{ marginBottom: 18 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", borderBottom: "1px solid var(--border-faint)",
              position: "sticky", top: 0, background: "var(--bg-base)", zIndex: 1
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>{t("matrix." + meta.key)}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("matrix." + meta.subKey)}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>
                {items.length}
              </span>
            </div>
            {items.map((task) =>
            <div key={task.id} style={{ paddingLeft: 18 }}>
                <TaskRow task={task} lang={lang} compact />
              </div>
            )}
            {items.length === 0 &&
            <div style={{
              paddingLeft: 18, padding: "12px 0 12px 18px",
              fontSize: 12, color: "var(--text-faint)"
            }}>{lang === "zh" ? "暂无任务" : "Empty"}</div>
            }
          </div>);

      })}
    </div>);

}

// ── Variant C: Hybrid (Q1 big main column + Q2/Q3/Q4 side stack) ────────
function MatrixHybrid({ lang, t, byQuadrant, onAddTask }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: 12, flex: 1, minHeight: 0
    }}>
      <QuadrantBox q="Q1" lang={lang} t={t} tasks={byQuadrant.Q1} big onAdd={onAddTask} />
      <div style={{ display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: 12, minHeight: 0 }}>
        <QuadrantBox q="Q2" lang={lang} t={t} tasks={byQuadrant.Q2} big onAdd={onAddTask} />
        <QuadrantBox q="Q3" lang={lang} t={t} tasks={byQuadrant.Q3} big onAdd={onAddTask} />
        <QuadrantBox q="Q4" lang={lang} t={t} tasks={byQuadrant.Q4} big onAdd={onAddTask} />
      </div>
    </div>);

}

// ── Classify Confirm dialog ──────────────────────────────────────────────
// User reviews AI's per-task suggestions and applies them all at once.
function ClassifyConfirmDialog({ lang, t, tasks, onClose, onApply }) {
  // Build initial assignments, lifted from each task's ai_suggest or a deterministic fallback.
  const fallback = (id) => {
    const map = { Q2: ["t9", "t10"], Q3: ["t11"], Q4: ["t12"] };
    for (const k of Object.keys(map)) if (map[k].includes(id)) return k;
    return "Q2";
  };
  const [assign, setAssign] = React.useState(() => {
    const m = {};
    tasks.forEach((task) => { m[task.id] = task.ai_suggest || fallback(task.id); });
    return m;
  });

  const reasonFor = (q) => {
    const map = lang === "zh" ? {
      Q1: "时间敏感、影响大",
      Q2: "对长线目标重要",
      Q3: "紧急但可以委派",
      Q4: "可考虑直接放弃"
    } : {
      Q1: "Time-sensitive & high impact",
      Q2: "Anchors a long-term goal",
      Q3: "Urgent but delegate-able",
      Q4: "Consider dropping"
    };
    return map[q];
  };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = ["Q1", "Q2", "Q3", "Q4"].reduce((acc, q) => {
    acc[q] = tasks.filter((task) => assign[task.id] === q).length;
    return acc;
  }, {});

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0,
      background: "rgba(8, 11, 10, 0.65)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 120, padding: 32,
      animation: "fadeIn 200ms var(--ease-default) both"
    }}>
      <div onClick={(e) => e.stopPropagation()} className="float-up" style={{
        width: "100%", maxWidth: 560,
        maxHeight: "calc(100% - 0px)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--accent-edge)",
        borderRadius: 14,
        boxShadow: "var(--shadow-lifted), 0 0 50px var(--accent-fog)",
        display: "flex", flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 18px",
          borderBottom: "1px solid var(--border-faint)",
          display: "flex", alignItems: "flex-start", gap: 12
        }}>
          <span style={{
            width: 16, height: 16, marginTop: 1, position: "relative", flexShrink: 0
          }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "var(--accent-glow)", animation: "lumoBreath 3s ease-in-out infinite reverse"
            }} />
            <span style={{
              position: "absolute", inset: 5, borderRadius: "50%",
              background: "var(--accent-primary)", boxShadow: "0 0 10px var(--accent-primary)",
              animation: "lumoBreath 3s ease-in-out infinite"
            }} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              {lang === "zh" ? `我建议这样分类 ${tasks.length} 项任务` : `I'd classify these ${tasks.length} tasks like this`}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
              {lang === "zh" ? "看一下,可以单个改象限,确认后一次性应用。" : "Review and override any quadrant. We'll apply all changes at once."}
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

        {/* Summary bar */}
        <div style={{
          padding: "10px 18px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-faint)",
          display: "flex", gap: 14,
          fontSize: 11, color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums",
          alignItems: "center"
        }}>
          {["Q1", "Q2", "Q3", "Q4"].map((q) =>
            <span key={q} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: `var(--${q.toLowerCase()}-color)`
              }} />
              <span style={{ color: "var(--text-secondary)" }}>{q}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{counts[q]}</span>
            </span>
          )}
        </div>

        {/* Task list */}
        <div style={{
          padding: "8px 6px", overflowY: "auto", flex: 1, minHeight: 0
        }}>
          {tasks.map((task) =>
            <div key={task.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", margin: "2px 4px",
              borderRadius: 6
            }}>
              <span className="qdot qdot-un" />
              <div style={{
                flex: 1, fontSize: 13, color: "var(--text-primary)",
                lineHeight: 1.4, minWidth: 0,
                whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden"
              }}>{window.getTaskTitle(task, lang)}</div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", flexShrink: 0 }}>→</span>
              {/* Quadrant picker — 4 mini chips */}
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                {["Q1", "Q2", "Q3", "Q4"].map((q) => {
                  const active = assign[task.id] === q;
                  const qVar = `var(--${q.toLowerCase()}-color)`;
                  return (
                    <button key={q}
                      onClick={() => setAssign((a) => ({ ...a, [task.id]: q }))}
                      title={reasonFor(q)}
                      style={{
                        height: 24, minWidth: 30, padding: "0 7px",
                        borderRadius: 4,
                        background: active ? "var(--bg-elevated)" : "transparent",
                        border: "1px solid " + (active ? qVar : "var(--border-default)"),
                        color: active ? qVar : "var(--text-muted)",
                        fontSize: 11, fontWeight: active ? 600 : 500,
                        fontFamily: "inherit", cursor: "default",
                        fontVariantNumeric: "tabular-nums",
                        boxShadow: active ? "inset 0 0 0 0.5px " + qVar : "none",
                        transition: "all 120ms var(--ease-default)"
                      }}>{q}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reasoning footer */}
        <div style={{
          padding: "10px 18px",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-faint)",
          fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5
        }}>
          <span style={{ color: "var(--accent-primary)" }}>✦</span>{" "}
          {lang === "zh" ?
            "依据任务关键词、截止时间、与已有目标的关系做的初步判断。可以全部覆盖。" :
            "Suggestions based on keywords, due-dates, and your stated goals. Feel free to override."}
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: "12px 18px",
          background: "var(--bg-deep)",
          borderTop: "1px solid var(--border-faint)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)" }}>
            {lang === "zh" ?
              `应用后 ${tasks.length} 项将被移入对应象限` :
              `Will move ${tasks.length} task${tasks.length === 1 ? "" : "s"} into their quadrants`}
          </span>
          <button onClick={onClose} className="btn btn-ghost" style={{ height: 32, padding: "0 12px", fontSize: 12 }}>
            {lang === "zh" ? "取消" : "Cancel"}
          </button>
          <button onClick={() => onApply(assign)} className="btn btn-primary" style={{ height: 32, padding: "0 14px", fontSize: 12 }}>
            {lang === "zh" ? `应用 ${tasks.length} 项` : `Apply all ${tasks.length}`}
          </button>
        </div>
      </div>
    </div>);

}

// ── Unclassified strip ───────────────────────────────────────────────────
function UnclassifiedStrip({ lang, t, tasks, aiClassifyOn, aiVariant, onAddTask, onClassifyAll }) {
  const [addHovered, setAddHovered] = React.useState(false);
  return (
    <div style={{
      flexShrink: 0,
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: 10,
      padding: "12px 16px",
      marginTop: 12,
      position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)" }}>
          {t("matrix.unclassified")}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{tasks.length}</span>
        <span style={{ flex: 1 }} />
        {aiClassifyOn && <LumoStatus variant={aiVariant} text={t("matrix.contextupdated")} />}
        <button
          onClick={() => onClassifyAll && onClassifyAll()}
          className="btn btn-secondary"
          style={{ height: 30 }}>
          <span style={{ width: 12, height: 12, display: "inline-flex" }}>{ICON.sparkle}</span>
          {t("matrix.classifyall")}
        </button>
      </div>
      {/* Pills — just titles now; per-task suggestion chips removed in favor of the confirm dialog */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tasks.map((task) =>
          <div key={task.id} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 999,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            fontSize: 12, color: "var(--text-primary)"
          }}>
            <span className="qdot qdot-un" />
            {window.getTaskTitle(task, lang)}
          </div>
        )}
        <button
          onClick={() => onAddTask && onAddTask(null)}
          onMouseEnter={() => setAddHovered(true)}
          onMouseLeave={() => setAddHovered(false)}
          style={{
            padding: "6px 12px", borderRadius: 999,
            background: addHovered ? "var(--accent-fog)" : "transparent",
            border: "1px dashed " + (addHovered ? "var(--accent-edge)" : "var(--border-default)"),
            color: addHovered ? "var(--accent-primary)" : "var(--text-muted)",
            fontSize: 12, cursor: "default", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 6,
            transform: addHovered ? "translateY(-1px)" : "none",
            transition: "all 160ms var(--ease-default)"
          }}>
          <span style={{
            width: 12, height: 12, display: "inline-flex",
            transform: addHovered ? "rotate(90deg)" : "none",
            transition: "transform 220ms var(--ease-spring)"
          }}>{ICON.plus}</span>
          {t("matrix.addtask")}
        </button>
      </div>
    </div>);

}

// ── Matrix screen ────────────────────────────────────────────────────────
function MatrixScreen({ lang, t, layout, aiVariant, aiClassifyOn, dragState, overload, tasks, onAddTask }) {
  const [classifyOpen, setClassifyOpen] = React.useState(false);
  // Inject extra Q1 cards when overload is forced on, so the UI shows the warning naturally.
  const extraQ1 = overload ? [
  { id: "o1", title: { en: "Patch deploy script for staging", zh: "修 patch staging 部署脚本" },
    quadrant: "Q1", due: "today", duration: 30, pomos_done: 0, pomos_total: 2 },
  { id: "o2", title: { en: "Confirm contract with vendor", zh: "与供应商确认合同" },
    quadrant: "Q1", due: "today", duration: 20, pomos_done: 0, pomos_total: 1 },
  { id: "o3", title: { en: "Prep Friday demo deck — first 5 slides", zh: "准备周五 demo—前 5 页" },
    quadrant: "Q1", due: "Fri", duration: 60, pomos_done: 0, pomos_total: 3 },
  { id: "o4", title: { en: "Sync with Maya on auth changes", zh: "与 Maya 同步 auth 变更" },
    quadrant: "Q1", due: "today", duration: 25, pomos_done: 0, pomos_total: 1 },
  { id: "o5", title: { en: "Review Q3 budget revisions", zh: "复查 Q3 预算调整" },
    quadrant: "Q1", due: "tomorrow", duration: 40, pomos_done: 0, pomos_total: 2 }] :
  [];

  const allTasks = [...tasks, ...extraQ1];

  const byQuadrant = {
    Q1: allTasks.filter((x) => x.quadrant === "Q1"),
    Q2: allTasks.filter((x) => x.quadrant === "Q2"),
    Q3: allTasks.filter((x) => x.quadrant === "Q3"),
    Q4: allTasks.filter((x) => x.quadrant === "Q4")
  };
  const unclassified = allTasks.filter((x) => x.quadrant === "unclassified");

  // Drag visualization
  const dragOn = dragState && dragState !== "off";
  const draggedTask = dragOn ? allTasks.find((x) => x.id === "t7") || unclassified[0] : null;
  const dragTarget = dragState === "to-q2" ? "Q2" : null;
  if (dragOn && draggedTask) {
    // Hide from source
    Object.keys(byQuadrant).forEach((k) => {
      byQuadrant[k] = byQuadrant[k].filter((x) => x.id !== draggedTask.id);
    });
  }
  const visibleUnclassified = dragOn ? unclassified.filter((x) => x.id !== draggedTask.id) : unclassified;

  return (
    <div className="fade-in" style={{
      padding: "16px 28px 24px",
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0,
      position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <LumoStatus variant={aiVariant} text={
        dragOn ? lang === "zh" ? "拖动中…放到 Q2 将进入下周计划。" : "Dragging… drop in Q2 to schedule for next week." :
        overload ? lang === "zh" ? "Q1 有点多了。要拆几件出去吗?" : "Q1 is getting heavy. Want me to split a few out?" :
        aiClassifyOn ? lang === "zh" ? "我帮你给未分类任务标了象限。" : "I've tagged your unclassified tasks." : t("lumo.sorted")
        } />
      </div>

      {/* Overload banner */}
      {overload &&
      <div style={{
        padding: "10px 14px", marginBottom: 12,
        background: "rgba(255, 179, 71, 0.06)",
        border: "1px solid rgba(255, 179, 71, 0.30)",
        borderRadius: 8,
        display: "flex", alignItems: "center", gap: 12,
        fontSize: 12, color: "var(--text-secondary)"
      }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-warning)", boxShadow: "0 0 6px var(--status-warning)" }} />
          <span style={{ flex: 1 }}>
            <span style={{ color: "var(--status-warning)", fontWeight: 500 }}>
              {lang === "zh" ? `Q1 现有 ${byQuadrant.Q1.length} 个任务` : `Q1 has ${byQuadrant.Q1.length} tasks`}
            </span>
            <span style={{ marginLeft: 8 }}>· {t("matrix.overload")}</span>
          </span>
          <button className="btn btn-ghost" style={{ height: 28, padding: "0 12px", fontSize: 12 }}>
            {lang === "zh" ? "帮我拆分" : "Help me split"}
          </button>
          <button className="btn btn-ghost" style={{ height: 28, padding: "0 8px", fontSize: 12, color: "var(--text-faint)" }}>✕</button>
        </div>
      }

      {layout === "list" && <MatrixList lang={lang} t={t} byQuadrant={byQuadrant} />}
      {layout === "hybrid" && <MatrixHybrid lang={lang} t={t} byQuadrant={byQuadrant} onAddTask={onAddTask} />}
      {(layout === "classic" || !layout) &&
      <MatrixClassic lang={lang} t={t} byQuadrant={byQuadrant}
      dragOver={dragTarget} dragGhostTask={draggedTask} onAddTask={onAddTask} />
      }
      {visibleUnclassified.length > 0 &&
      <UnclassifiedStrip lang={lang} t={t} tasks={visibleUnclassified}
      aiClassifyOn={aiClassifyOn} aiVariant={aiVariant}
      onAddTask={onAddTask}
      onClassifyAll={() => setClassifyOpen(true)} />
      }

      {classifyOpen &&
      <ClassifyConfirmDialog
        lang={lang} t={t}
        tasks={visibleUnclassified}
        onClose={() => setClassifyOpen(false)}
        onApply={() => setClassifyOpen(false)} />
      }

      {/* Floating dragged card */}
      {dragOn && draggedTask &&
      <div style={{
        position: "absolute",
        left: "50%", top: "55%",
        transform: "translate(-30%, -50%) rotate(-3deg)",
        zIndex: 100, pointerEvents: "none",
        width: 280
      }}>
          <div style={{
          padding: "12px 14px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--accent-edge)",
          borderRadius: 8,
          boxShadow: "var(--shadow-lifted), 0 0 32px var(--accent-fog)",
          opacity: 0.95
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }}>{ICON.drag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  {window.getTaskTitle(draggedTask, lang)}
                </div>
                <div style={{
                fontSize: 10, color: "var(--accent-primary)", marginTop: 4,
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 7px", borderRadius: 3,
                background: "var(--accent-fog)",
                border: "1px solid var(--accent-edge)",
                letterSpacing: "0.02em"
              }}>
                  {lang === "zh" ? "中" : "Dragging"} → Q2
                </div>
              </div>
            </div>
          </div>
          {/* Cursor */}
          <div style={{
          position: "absolute", top: -8, left: -8,
          width: 16, height: 16
        }}>
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M2 1l11 6-5 1-3 6z" fill="var(--text-primary)" stroke="var(--bg-base)" strokeWidth="1" />
            </svg>
          </div>
        </div>
      }
    </div>);

}

Object.assign(window, { MatrixScreen });