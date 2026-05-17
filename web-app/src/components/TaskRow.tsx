import { useState } from "react";
import type { Task } from "@/types/task";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { fmtDuration, getDueLabel } from "@/lib/format";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { TaskEditModal } from "@/components/TaskEditModal";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useTasksStore } from "@/store/useTasksStore";
import { PersonAvatar } from "@/pages/SettingsPage";
import { IconArrowRight, IconEdit, IconCheck } from "@/components/icons";

interface TaskRowProps {
  task: Task;
  compact?: boolean;
}

export function TaskRow({ task, compact = false }: TaskRowProps) {
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const navigate = useNavigate();
  const byId = usePeopleStore((s) => s.byId);
  const complete = useTasksStore((s) => s.complete);

  const [hovered, setHovered] = useState(false);
  const [circleHover, setCircleHover] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const assignee = task.assignee_id ? byId(task.assignee_id) : undefined;
  const q = task.quadrant === "unclassified" ? "un" : task.quadrant.toLowerCase();
  const due = getDueLabel(task.due, locale);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-3 border-b border-border-faint rounded-md transition-colors"
        style={{
          padding: compact ? "9px 8px" : "13px 8px",
          marginLeft: -8,
          marginRight: -8,
          background: hovered ? "var(--bg-subtle)" : "transparent",
        }}
      >
        {/* ── Left: complete circle ─────────────────────────────── */}
        <button
          onMouseEnter={() => setCircleHover(true)}
          onMouseLeave={() => setCircleHover(false)}
          onClick={(e) => { e.stopPropagation(); complete(task.id); }}
          aria-label={t("row.complete")}
          className="flex-shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] transition-all"
          style={{
            borderColor: circleHover ? "var(--accent-primary)" : "var(--border-strong)",
            background: circleHover ? "var(--accent-fog)" : "transparent",
            boxShadow: circleHover ? "0 0 6px var(--accent-glow)" : "none",
            color: "var(--accent-primary)",
          }}
        >
          {circleHover && <IconCheck size={10} strokeWidth={2.5} />}
        </button>

        {/* ── Center: clickable content area ───────────────────── */}
        <span className={`qdot qdot-${q} flex-shrink-0`} />

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setDetailOpen(true)}
        >
          <div className="text-sm font-medium text-text-primary truncate leading-snug">
            {ls(task.title)}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted tabular-nums">
            {due && <span>{due}</span>}
            {task.duration > 0 && <span>{fmtDuration(task.duration, locale)}</span>}
            <span className="pip">
              {Array.from({ length: task.pomos_total }).map((_, i) => (
                <i key={i} className={i < task.pomos_done ? "on" : ""} />
              ))}
            </span>
          </div>
        </div>

        {/* ── Right: always-visible meta + hover actions ────────── */}
        {/* Hover actions — Start focus + Edit */}
        <div
          className="flex items-center gap-0.5 transition-all"
          style={{
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          <IconActionBtn
            label={t("row.startfocus")}
            onClick={(e) => { e.stopPropagation(); navigate("/focus"); }}
          >
            <IconArrowRight size={13} />
          </IconActionBtn>
          <IconActionBtn
            label={t("popover.edit")}
            onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
          >
            <IconEdit size={13} />
          </IconActionBtn>
        </div>

        {/* Assignee avatar — always visible */}
        {assignee && <PersonAvatar person={assignee} size={20} />}

        {/* Quadrant chip — always visible */}
        {task.quadrant !== "unclassified" && (
          <span
            className={`chip chip-${task.quadrant.toLowerCase()} flex-shrink-0`}
            onClick={() => setDetailOpen(true)}
            style={{ cursor: "pointer" }}
          >
            {task.quadrant}
          </span>
        )}
      </div>

      {detailOpen && (
        <TaskDetailModal task={task} onClose={() => setDetailOpen(false)} />
      )}
      {editOpen && (
        <TaskEditModal task={task} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}

function IconActionBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
      style={{ color: "var(--text-faint)", background: "transparent" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
      }}
    >
      {children}
    </button>
  );
}
