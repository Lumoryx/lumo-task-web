import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Task } from "@/types/task";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { fmtDuration, getDueLabel } from "@/lib/format";
import { IconMore, IconPlay } from "@/components/icons";
import { TaskMoreMenu } from "@/components/TaskMoreMenu";
import { QuickCreate } from "@/components/QuickCreate";

interface TaskRowProps {
  task: Task;
  compact?: boolean;
}

export function TaskRow({ task, compact = false }: TaskRowProps) {
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const complete = useTasksStore((s) => s.complete);
  const remove = useTasksStore((s) => s.remove);
  const navigate = useNavigate();

  const [hovered, setHovered] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<DOMRect | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);

  const q = task.quadrant === "unclassified" ? "un" : task.quadrant.toLowerCase();
  const due = getDueLabel(task.due, locale);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 border-b border-border-faint rounded-md transition-colors"
      style={{
        padding: compact ? "10px 8px" : "14px 8px",
        marginLeft: -8,
        marginRight: -8,
        background: hovered ? "var(--bg-subtle)" : "transparent",
      }}
    >
      {/* Circle — click to complete */}
      <button
        onClick={() => complete(task.id)}
        className="flex-shrink-0 w-[18px] h-[18px] rounded-full border-[1.5px] transition-all"
        style={{
          borderColor: "var(--border-strong)",
          background: "transparent",
        }}
        aria-label={t("focus.complete")}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 6px var(--accent-glow)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      />

      <span className={`qdot qdot-${q}`} />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{ls(task.title)}</div>
        <div className="flex gap-3 mt-1 text-xs text-text-muted tabular-nums">
          {due && <span>{due}</span>}
          {task.duration > 0 && <span>{fmtDuration(task.duration, locale)}</span>}
          <span className="pip">
            {Array.from({ length: task.pomos_total }).map((_, i) => (
              <i key={i} className={i < task.pomos_done ? "on" : ""} />
            ))}
          </span>
        </div>
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Start Focus button — shown on hover */}
        <button
          onClick={() => navigate("/focus")}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-all"
          style={{
            color: hovered ? "var(--accent-primary)" : "transparent",
            background: hovered ? "var(--accent-fog)" : "transparent",
            border: `1px solid ${hovered ? "var(--accent-edge)" : "transparent"}`,
            pointerEvents: hovered ? "auto" : "none",
          }}
          tabIndex={hovered ? 0 : -1}
        >
          <IconPlay size={10} />
          {t("today.start")}
        </button>

        {/* Quadrant chip */}
        {task.quadrant !== "unclassified" && (
          <span className={`chip chip-${task.quadrant.toLowerCase()}`}>{task.quadrant}</span>
        )}

        {/* More actions button */}
        <button
          ref={moreRef}
          onClick={(e) => {
            e.stopPropagation();
            const rect = moreRef.current?.getBoundingClientRect();
            if (rect) setMoreAnchor(rect);
          }}
          className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
          style={{
            color: hovered ? "var(--text-muted)" : "transparent",
            background: moreAnchor ? "var(--bg-subtle)" : "transparent",
          }}
          aria-label="More actions"
        >
          <IconMore size={13} />
        </button>
      </div>

      {moreAnchor && (
        <TaskMoreMenu
          anchor={moreAnchor}
          onClose={() => setMoreAnchor(null)}
          onEdit={() => setEditOpen(true)}
          onDelete={() => remove(task.id)}
        />
      )}

      {editOpen && (
        <QuickCreate
          editTask={task}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
