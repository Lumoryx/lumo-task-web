import { useState } from "react";
import { useTasksStore } from "@/store/useTasksStore";
import { useT, useLocaleString } from "@/i18n/useT";
import type { Quadrant, Task } from "@/types/task";
import { useAppStore } from "@/store/useAppStore";
import { fmtDuration } from "@/lib/format";
import { IconSparkle } from "@/components/icons";
import { AIClassifyModal } from "@/components/AIClassifyModal";

/**
 * Eisenhower 2×2. Each quadrant is a column with a header and a stack
 * of compact task cards. Unclassified tasks go in a bottom strip.
 *
 * Drag a card from one quadrant (or from the Unclassified strip) onto
 * another quadrant to reassign. The target quadrant highlights on
 * dragover. Reassignment goes through the tasks store, which persists
 * via the mock API.
 */
export function MatrixPage() {
  const t = useT();
  const tasks = useTasksStore((s) => s.tasks);
  const unclassified = tasks.filter((x) => x.quadrant === "unclassified" && !x.completed);
  const [classifyOpen, setClassifyOpen] = useState(false);

  const quadrants: Array<{ id: Quadrant; label: string; sub: string }> = [
    { id: "Q1", label: t("matrix.q1"), sub: "Urgent · Important" },
    { id: "Q2", label: t("matrix.q2"), sub: "Important · Not urgent" },
    { id: "Q3", label: t("matrix.q3"), sub: "Urgent · Not important" },
    { id: "Q4", label: t("matrix.q4"), sub: "Neither" },
  ];

  return (
    <div className="fade-in flex flex-col h-full p-7 gap-5">
      {/* Toolbar: AI classify */}
      <div className="flex items-center justify-end gap-2 -mb-1">
        <button
          className="btn btn-secondary"
          onClick={() => setClassifyOpen(true)}
          disabled={unclassified.length === 0}
          title={
            unclassified.length === 0 ? t("matrix.aiClassify.empty") : t("matrix.aiClassify")
          }
        >
          <IconSparkle size={14} />
          {t("matrix.aiClassify")}
          {unclassified.length > 0 && (
            <span className="ml-1 text-[11px] text-text-faint tabular-nums">
              · {unclassified.length}
            </span>
          )}
        </button>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
        {quadrants.map((q) => (
          <QuadrantPanel key={q.id} id={q.id} title={q.label} subtitle={q.sub} />
        ))}
      </div>

      {/* Unclassified strip — also a drop target (move task back to "no quadrant") */}
      {unclassified.length > 0 && (
        <DropZone target="unclassified" className="flex-shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-2">
            {t("matrix.unclassified")}
            <span className="ml-2 text-text-muted">{unclassified.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unclassified.map((task) => (
              <UnclassifiedChip key={task.id} task={task} />
            ))}
          </div>
        </DropZone>
      )}

      {classifyOpen && <AIClassifyModal onClose={() => setClassifyOpen(false)} />}
    </div>
  );
}

/* ── DnD helpers ──────────────────────────────────────────────────── */

const DND_MIME = "application/x-lumo-task";

function useTaskDrop(target: Quadrant | "unclassified") {
  const update = useTasksStore((s) => s.update);
  const [over, setOver] = useState(false);
  return {
    over,
    handlers: {
      onDragOver: (e: React.DragEvent) => {
        if (e.dataTransfer.types.includes(DND_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!over) setOver(true);
        }
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData(DND_MIME);
        if (!id) return;
        update(id, { quadrant: target as Task["quadrant"] });
      },
    },
  };
}

function makeDragProps(taskId: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(DND_MIME, taskId);
      // Make the source slightly transparent during drag
      (e.currentTarget as HTMLElement).style.opacity = "0.4";
    },
    onDragEnd: (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.opacity = "1";
    },
  };
}

/* ── Quadrant panel ───────────────────────────────────────────────── */

function QuadrantPanel({ id, title, subtitle }: { id: Quadrant; title: string; subtitle: string }) {
  const tasks = useTasksStore((s) => s.byQuadrant(id));
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const t = useT();
  const { over, handlers } = useTaskDrop(id);

  return (
    <div
      {...handlers}
      className="flex flex-col min-h-0 rounded-xl border bg-surface overflow-hidden transition-all"
      style={{
        borderColor: over ? "var(--accent-edge)" : "var(--border-default)",
        boxShadow: over ? "0 0 0 2px var(--accent-fog), inset 0 0 30px var(--accent-fog)" : "none",
      }}
    >
      <header
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "var(--border-faint)" }}
      >
        <span className={`qdot qdot-${id.toLowerCase()}`} />
        <span className="text-[13px] font-semibold text-text-primary">
          {id} · {title}
        </span>
        <span className="text-[11px] text-text-faint ml-1">{subtitle}</span>
        <span className="ml-auto text-[11px] tabular-nums text-text-muted">{tasks.length}</span>
      </header>

      <div className="flex-1 min-h-0 scroll-y p-3 flex flex-col gap-1.5">
        {tasks.length === 0 && (
          <div className="text-[12px] text-text-faint italic px-1 py-3">
            {over ? t("matrix.dropHere") : "No tasks here."}
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            {...makeDragProps(task.id)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-subtle transition-colors cursor-grab active:cursor-grabbing"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-text-primary truncate">{ls(task.title)}</div>
              <div className="text-[11px] text-text-muted tabular-nums mt-0.5">
                {fmtDuration(task.duration, locale)}
                {task.due && <span className="ml-2">· {task.due}</span>}
              </div>
            </div>
            <span className="pip">
              {Array.from({ length: task.pomos_total }).map((_, i) => (
                <i key={i} className={i < task.pomos_done ? "on" : ""} />
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Drop zone wrapper for the Unclassified strip ─────────────────── */

function DropZone({
  target,
  className,
  children,
}: {
  target: Quadrant | "unclassified";
  className?: string;
  children: React.ReactNode;
}) {
  const { over, handlers } = useTaskDrop(target);
  return (
    <section
      {...handlers}
      className={`rounded-xl border p-3 transition-all ${className ?? ""}`}
      style={{
        borderStyle: "dashed",
        borderColor: over ? "var(--accent-edge)" : "var(--border-faint)",
        background: over ? "var(--accent-fog)" : "transparent",
      }}
    >
      {children}
    </section>
  );
}

function UnclassifiedChip({ task }: { task: Task }) {
  const ls = useLocaleString();
  return (
    <div
      {...makeDragProps(task.id)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-deep text-text-secondary text-[12px] cursor-grab active:cursor-grabbing"
      style={{ borderColor: "var(--border-faint)" }}
    >
      <span className="qdot qdot-un" />
      <span>{ls(task.title)}</span>
      {task.ai_suggest && <span className="chip chip-ai">AI → {task.ai_suggest}</span>}
    </div>
  );
}
