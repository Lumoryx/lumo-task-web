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
 * AI classify — review Lumo's suggested quadrant for each unclassified
 * task, override per-row, then apply all in one go.
 *
 * Per design convention: dismissed via a real ✕ button in the header.
 */
export function AIClassifyModal({ onClose }: AIClassifyModalProps) {
  const t = useT();
  const ls = useLocaleString();
  const tasks = useTasksStore((s) => s.tasks);
  const update = useTasksStore((s) => s.update);

  const unclassified = useMemo(
    () => tasks.filter((x) => x.quadrant === "unclassified" && !x.completed),
    [tasks]
  );

  // Local override map: taskId → chosen quadrant (defaulting to ai_suggest, then Q2).
  const [assign, setAssign] = useState<Record<string, Quadrant>>(() => {
    const m: Record<string, Quadrant> = {};
    unclassified.forEach((t) => {
      m[t.id] = (t.ai_suggest as Quadrant) ?? "Q2";
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

  async function applyAll() {
    setBusy(true);
    try {
      await Promise.all(
        unclassified.map((task) => update(task.id, { quadrant: assign[task.id] }))
      );
      onClose();
    } finally {
      setBusy(false);
    }
  }

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
          maxWidth: 580,
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
              {t("matrix.aiClassify.title")} · {unclassified.length}
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
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 scroll-y px-[18px] py-3 flex flex-col gap-1.5">
          {unclassified.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              {t("matrix.aiClassify.empty")}
            </div>
          ) : (
            unclassified.map((task) => (
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
            Lumo's suggestions · tap any chip to override
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
              {t("qc.cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={applyAll}
              disabled={busy || unclassified.length === 0}
            >
              {t("matrix.aiClassify.apply")} · {unclassified.length}
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
  return (
    <div
      className="flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-surface"
      style={{ border: "1px solid var(--border-faint)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-primary truncate">{titleStr}</div>
        <div className="text-[10.5px] text-text-faint mt-0.5">
          {task.ai_suggest ? `Lumo suggests ${task.ai_suggest}` : "No suggestion"}
        </div>
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
