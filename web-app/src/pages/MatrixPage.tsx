import { useRef, useState } from "react";
import { useTasksStore } from "@/store/useTasksStore";
import { useT, useLocaleString } from "@/i18n/useT";
import type { Quadrant, Task } from "@/types/task";
import { useAppStore } from "@/store/useAppStore";
import { fmtDuration } from "@/lib/format";
import { IconSparkle } from "@/components/icons";
import { AIClassifyModal } from "@/components/AIClassifyModal";
import { TaskActionPopover } from "@/components/TaskActionPopover";
import { usePeopleStore } from "@/store/usePeopleStore";
import { PersonAvatar } from "@/pages/SettingsPage";

/**
 * Eisenhower 2×2. Each quadrant is a column with a header and a stack
 * of compact task cards. Unclassified tasks live in a top toolbar strip
 * alongside the AI classify button (both at the same visual level).
 *
 * Drag a card from any quadrant (or from the Unclassified strip) onto
 * another quadrant to reassign. The target quadrant highlights on dragover.
 */
export function MatrixPage() {
  const t = useT();
  const tasks = useTasksStore((s) => s.tasks);
  const unclassified = tasks.filter((x) => x.quadrant === "unclassified" && !x.completed);
  const allActive = tasks.filter((x) => !x.completed);
  const [classifyOpen, setClassifyOpen] = useState(false);

  const quadrants: Array<{ id: Quadrant; label: string; sub: string }> = [
    { id: "Q1", label: t("matrix.q1"), sub: "Urgent · Important" },
    { id: "Q2", label: t("matrix.q2"), sub: "Important · Not urgent" },
    { id: "Q3", label: t("matrix.q3"), sub: "Urgent · Not important" },
    { id: "Q4", label: t("matrix.q4"), sub: "Neither" },
  ];

  return (
    <div className="fade-in flex flex-col h-full p-7 gap-4">
      {/* Toolbar: unclassified strip (left) + AI classify (right) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Unclassified drop zone + chips */}
        <UnclassifiedBar unclassified={unclassified} label={t("matrix.unclassified")} />

        {/* AI classify — always available for all tasks */}
        <button
          className="btn btn-secondary flex-shrink-0"
          onClick={() => setClassifyOpen(true)}
          disabled={allActive.length === 0}
        >
          <IconSparkle size={14} />
          {t("matrix.aiClassify")}
          {allActive.length > 0 && (
            <span className="ml-1 text-[11px] text-text-faint tabular-nums">
              · {allActive.length}
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

      {classifyOpen && <AIClassifyModal onClose={() => setClassifyOpen(false)} />}
    </div>
  );
}

/* ── Unclassified bar — drop zone + horizontal chip list ─────────── */

function UnclassifiedBar({ unclassified, label }: { unclassified: Task[]; label: string }) {
  const { over, handlers } = useTaskDrop("unclassified");

  return (
    <div
      {...handlers}
      className="flex-1 min-w-0 flex items-center gap-2 rounded-lg border px-3 transition-all overflow-hidden"
      style={{
        height: 38,
        borderStyle: unclassified.length === 0 ? "dashed" : "solid",
        borderColor: over ? "var(--accent-edge)" : "var(--border-faint)",
        background: over ? "var(--accent-fog)" : "transparent",
      }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint flex-shrink-0">
        {label}
        {unclassified.length > 0 && (
          <span className="ml-1.5 font-normal text-text-muted">{unclassified.length}</span>
        )}
      </span>
      {unclassified.length === 0 ? (
        <span className="text-[11px] text-text-faint italic ml-1">
          {over ? "Drop here" : "—"}
        </span>
      ) : (
        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0" style={{ scrollbarWidth: "none" }}>
          {unclassified.map((task) => (
            <UnclassifiedChip key={task.id} task={task} />
          ))}
        </div>
      )}
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
          <MatrixTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

/* ── Matrix task card with circle action trigger ─────────────────── */

function MatrixTaskCard({ task }: { task: Task }) {
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const byId = usePeopleStore((s) => s.byId);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const assignee = task.assignee_id ? byId(task.assignee_id) : undefined;

  const openPopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setAnchor(rect);
  };

  return (
    <div
      {...makeDragProps(task.id)}
      className="relative flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-subtle transition-colors cursor-grab active:cursor-grabbing"
    >
      <button
        ref={btnRef}
        onClick={openPopover}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex-shrink-0 w-4 h-4 rounded-full border-[1.5px] transition-all cursor-default"
        style={{
          borderColor: anchor ? "var(--accent-primary)" : "var(--border-strong)",
          boxShadow: anchor ? "0 0 6px var(--accent-glow)" : "none",
          background: "transparent",
        }}
      />
      {anchor && (
        <TaskActionPopover task={task} anchor={anchor} onClose={() => setAnchor(null)} />
      )}

      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-primary truncate">{ls(task.title)}</div>
        <div className="text-[11px] text-text-muted tabular-nums mt-0.5">
          {fmtDuration(task.duration, locale)}
          {task.due && <span className="ml-2">· {task.due}</span>}
        </div>
      </div>
      {assignee && <PersonAvatar person={assignee} size={18} />}
      <span className="pip">
        {Array.from({ length: task.pomos_total }).map((_, i) => (
          <i key={i} className={i < task.pomos_done ? "on" : ""} />
        ))}
      </span>
    </div>
  );
}

function UnclassifiedChip({ task }: { task: Task }) {
  const ls = useLocaleString();
  return (
    <div
      {...makeDragProps(task.id)}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-deep text-text-secondary text-[12px] cursor-grab active:cursor-grabbing flex-shrink-0 whitespace-nowrap"
      style={{ borderColor: "var(--border-faint)" }}
    >
      <span className="qdot qdot-un" />
      <span>{ls(task.title)}</span>
      {task.ai_suggest && <span className="chip chip-ai">AI → {task.ai_suggest}</span>}
    </div>
  );
}
