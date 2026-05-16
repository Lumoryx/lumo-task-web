import { useState } from "react";
import type { Task } from "@/types/task";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { fmtDuration, getDueLabel } from "@/lib/format";

interface TaskRowProps {
  task: Task;
  compact?: boolean;
}

/**
 * Single task line item — circular check, quadrant dot, title + meta.
 * Reused in Today's plan list and Matrix list view.
 */
export function TaskRow({ task, compact = false }: TaskRowProps) {
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const complete = useTasksStore((s) => s.complete);
  const [hovered, setHovered] = useState(false);

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
      <button
        onClick={() => complete(task.id)}
        className="flex-shrink-0 w-[18px] h-[18px] rounded-full border-[1.5px] border-border-strong"
        aria-label={t("focus.complete")}
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
      {task.quadrant !== "unclassified" && (
        <span className={`chip chip-${task.quadrant.toLowerCase()}`}>{task.quadrant}</span>
      )}
    </div>
  );
}
