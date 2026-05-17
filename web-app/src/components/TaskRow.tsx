import { useRef, useState } from "react";
import type { Task } from "@/types/task";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { fmtDuration, getDueLabel } from "@/lib/format";
import { TaskActionPopover } from "@/components/TaskActionPopover";
import { usePeopleStore } from "@/store/usePeopleStore";
import { PersonAvatar } from "@/pages/SettingsPage";

interface TaskRowProps {
  task: Task;
  compact?: boolean;
}

export function TaskRow({ task, compact = false }: TaskRowProps) {
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const byId = usePeopleStore((s) => s.byId);
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const assignee = task.assignee_id ? byId(task.assignee_id) : undefined;

  const q = task.quadrant === "unclassified" ? "un" : task.quadrant.toLowerCase();
  const due = getDueLabel(task.due, locale);

  const openPopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setAnchor(rect);
  };

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
      {/* Circle trigger */}
      <button
        ref={btnRef}
        onClick={openPopover}
        className="flex-shrink-0 w-[18px] h-[18px] rounded-full border-[1.5px] transition-all"
        style={{
          borderColor: anchor ? "var(--accent-primary)" : "var(--border-strong)",
          boxShadow: anchor ? "0 0 6px var(--accent-glow)" : "none",
          background: "transparent",
        }}
        aria-label={t("focus.complete")}
      />

      {anchor && (
        <TaskActionPopover task={task} anchor={anchor} onClose={() => setAnchor(null)} />
      )}

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
      {assignee && <PersonAvatar person={assignee} size={20} />}
      {task.quadrant !== "unclassified" && (
        <span className={`chip chip-${task.quadrant.toLowerCase()}`}>{task.quadrant}</span>
      )}
    </div>
  );
}
