import { useEffect, useMemo, useState } from "react";
import { IconClose, IconSparkle } from "@/components/icons";
import { useT, useLocaleString } from "@/i18n/useT";
import { useTasksStore } from "@/store/useTasksStore";
import type { Quadrant, Task } from "@/types/task";

interface AIClassifyModalProps {
  onClose: () => void;
}

const QUADRANTS: Quadrant[] = ["Q1", "Q2", "Q3", "Q4"];

/**
 * AI classify — review and adjust the quadrant for every active task.
 * Unclassified tasks show Lumo's AI suggestion; already-classified tasks
 * default to their current quadrant and can be moved freely.
 */
export function AIClassifyModal({ onClose }: AIClassifyModalProps) {
  const t = useT();
  const ls = useLocaleString();
  const tasks = useTasksStore((s) => s.tasks);
  const update = useTasksStore((s) => s.update);

  // All non-completed tasks — unclassified first, then by quadrant
  const candidates = useMemo(() => {
    const active = tasks.filter((x) => !x.completed);
    return [
      ...active.filter((x) => x.quadrant === "unclassified"),
      ...active.filter((x) => x.quadrant !== "unclassified"),
    ];
  }, [tasks]);

  // Local override map: taskId → chosen quadrant
  const [assign, setAssign] = useState<Record<string, Quadrant>>(() => {
    const m: Record<string, Quadrant> = {};
    candidates.forEach((task) => {
      if (task.quadrant === "unclassified") {
        m[task.id] = (task.ai_suggest as Quadrant) ?? "Q2";
      } else {
        m[task.id] = task.quadrant as Quadrant;
      }
    });
    return m;
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const counts = QUADRANTS.reduce<Record<Quadrant, number>>(
    (acc, q) => {
      acc[q] = Object.values(assign).filter((x) => x === q).length;
      return acc;
    },
    { Q1: 0, Q2: 0, Q3: 0, Q4: 0, unclassified: 0 }
  );

  // Only apply tasks whose quadrant actually changed
  async function applyAll() {
    setBusy(true);
    try {
      const changed = candidates.filter(
        (task) => assign[task.id] && assign[task.id] !== task.quadrant
      );
      await Promise.all(changed.map((task) => update(task.id, { quadrant: assign[task.id] })));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const changedCount = candidates.filter(
    (t) => assign[t.id] && assign[t.id] !== t.quadrant
  ).length;

  const unclassifiedCount = candidates.filter((t) => t.quadrant === "unclassified").length;

  return (
    <div
      onClick={onClose}
      className="fade-in absolute inset-0 z-[120] flex items-center justify-center"
      style={{
        background: "rgba(8, 11, 10, 0.65)",
        backdropFilter: "blur(6px)",
        padding: 32,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-full overflow-hidden border rounded-[14px] bg-elevated shadow-lifted"
        style={{
          maxWidth: 600,
          maxHeight: "100%",
          borderColor: "var(--accent-edge)",
          boxShadow: "var(--shadow-lifted), 0 0 50px var(--accent-fog)",
        }}
      >
        {/* Header */}
        <header className="flex items-start gap-3 px-[18px] py-4 border-b border-border-faint">
          <span className="lumo-glyph" style={{ width: 16, height: 16, marginTop: 1 }}>
            <span className="halo" />
            <span className="core" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary">
              {t("matrix.aiClassify.title")}
              <span className="ml-2 text-[11px] font-normal text-text-faint tabular-nums">
                {candidates.length} 个任务
                {unclassifiedCount > 0 && (
                  <span className="ml-1.5 text-text-muted">· {unclassifiedCount} 未分类</span>
                )}
              </span>
            </div>
            <div className="mt-1 text-xs text-text-muted leading-relaxed">
              {t("matrix.aiClassify.sub")}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("qc.close")}
            title={t("qc.close")}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-text-muted border border-border-default bg-transparent hover:bg-subtle hover:text-text-primary hover:border-border-strong transition-colors"
          >
            <IconClose size={12} />
          </button>
        </header>

        {/* Summary bar */}
        <div
          className="flex gap-3.5 px-[18px] py-2.5 border-b border-border-faint text-[11px] text-text-muted tabular-nums"
          style={{ background: "var(--bg-surface)" }}
        >
          {QUADRANTS.map((q) => (
            <span key={q} className="flex items-center gap-1.5">
              <span className={`qdot qdot-${q.toLowerCase()}`} />
              {q} · {counts[q as Quadrant]}
            </span>
          ))}
          {changedCount > 0 && (
            <span className="ml-auto text-accent-primary" style={{ color: "var(--accent-primary)" }}>
              {changedCount} 项待调整
            </span>
          )}
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 scroll-y px-[18px] py-3 flex flex-col gap-1.5">
          {candidates.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              {t("matrix.aiClassify.empty")}
            </div>
          ) : (
            candidates.map((task) => (
              <Row
                key={task.id}
                task={task}
                value={assign[task.id]}
                onChange={(q) => setAssign((m) => ({ ...m, [task.id]: q }))}
                titleStr={ls(task.title)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 px-[18px] py-3 border-t border-border-faint">
          <div className="text-[11px] text-text-faint flex items-center gap-1.5">
            <IconSparkle size={12} />
            {unclassifiedCount > 0 ? "Lumo's suggestions · tap any chip to override" : "Drag chips to reclassify · or tap to change"}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
              {t("qc.cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={applyAll}
              disabled={busy || changedCount === 0}
            >
              {t("matrix.aiClassify.apply")}
              {changedCount > 0 && <span className="ml-1">· {changedCount}</span>}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Row({
  task,
  value,
  onChange,
  titleStr,
}: {
  task: Task;
  value: Quadrant;
  onChange: (q: Quadrant) => void;
  titleStr: string;
}) {
  const isUnclassified = task.quadrant === "unclassified";
  const hint = isUnclassified
    ? task.ai_suggest
      ? `Lumo suggests ${task.ai_suggest}`
      : "No suggestion"
    : `Current: ${task.quadrant}`;

  return (
    <div
      className="flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface"
      style={{ border: "1px solid var(--border-faint)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!isUnclassified && (
            <span className={`chip chip-${task.quadrant.toLowerCase()} flex-shrink-0`}>
              {task.quadrant}
            </span>
          )}
          <div className="text-[13px] text-text-primary truncate">{titleStr}</div>
        </div>
        <div className="text-[10.5px] text-text-faint mt-0.5">{hint}</div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {QUADRANTS.map((q) => {
          const on = value === q;
          return (
            <button
              key={q}
              onClick={() => onChange(q)}
              title={q}
              className="flex items-center justify-center rounded transition-all"
              style={{
                width: 28,
                height: 26,
                border: on ? "1px solid var(--accent-edge)" : "1px solid var(--border-default)",
                background: on ? "var(--accent-fog)" : "var(--bg-surface)",
                color: on ? "var(--accent-primary)" : "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "inherit",
                gap: 4,
              }}
            >
              <span className={`qdot qdot-${q.toLowerCase()}`} />
              {q}
            </button>
          );
        })}
      </div>
    </div>
  );
}
