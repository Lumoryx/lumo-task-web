import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IconClose, IconCalendar, IconClock, IconArrowRight, IconCheck } from "@/components/icons";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { PersonAvatar } from "@/pages/SettingsPage";
import { TaskEditModal } from "@/components/TaskEditModal";
import { fmtDuration, getDueLabel } from "@/lib/format";
import type { Task } from "@/types/task";

const Q_COLOR: Record<string, string> = {
  Q1: "var(--q1-color)",
  Q2: "var(--q2-color)",
  Q3: "var(--q3-color)",
  Q4: "var(--q4-color)",
  unclassified: "var(--text-faint)",
};

const Q_LABEL_EN: Record<string, string> = {
  Q1: "Urgent · Important",
  Q2: "Important · Not urgent",
  Q3: "Urgent · Not important",
  Q4: "Neither",
  unclassified: "Unclassified",
};

const Q_LABEL_ZH: Record<string, string> = {
  Q1: "紧急 · 重要",
  Q2: "重要 · 不紧急",
  Q3: "紧急 · 不重要",
  Q4: "都不是",
  unclassified: "未分类",
};

interface Props {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: Props) {
  const t = useT();
  const ls = useLocaleString();
  const navigate = useNavigate();
  const locale = useAppStore((s) => s.locale);
  const complete = useTasksStore((s) => s.complete);
  const byId = usePeopleStore((s) => s.byId);
  const [editOpen, setEditOpen] = useState(false);

  const assignees = (task.assignee_ids ?? []).map(byId).filter(Boolean) as import("@/types/task").Person[];
  const due = getDueLabel(task.due, locale);
  const qColor = Q_COLOR[task.quadrant] ?? "var(--text-faint)";
  const qLabel = locale === "zh" ? Q_LABEL_ZH[task.quadrant] : Q_LABEL_EN[task.quadrant];

  async function handleComplete() {
    await complete(task.id);
    onClose();
  }


  if (editOpen) {
    return <TaskEditModal task={task} onClose={() => { setEditOpen(false); onClose(); }} />;
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fade-in fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(8,11,10,0.6)", backdropFilter: "blur(6px)", padding: "0 32px" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden rounded-[16px] border"
        style={{
          maxWidth: 480,
          background: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-lifted)",
          marginTop: "-4vh",
        }}
      >
        {/* Header — quadrant accent bar + title */}
        <div
          className="h-[3px] w-full"
          style={{ background: qColor, opacity: 0.7 }}
        />
        <header className="flex items-start gap-3 px-5 pt-4 pb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-block rounded-full flex-shrink-0"
                style={{ width: 7, height: 7, background: qColor }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: qColor }}>
                {task.quadrant === "unclassified" ? (locale === "zh" ? "未分类" : "Unclassified") : task.quadrant}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>·</span>
              <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{qLabel}</span>
            </div>
            <h2
              className="font-semibold leading-snug"
              style={{ fontSize: 17, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
            >
              {ls(task.title)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-text-muted border border-border-default bg-transparent hover:bg-subtle hover:text-text-primary transition-colors mt-0.5"
            aria-label={t("qc.close")}
          >
            <IconClose size={13} />
          </button>
        </header>

        {/* Meta grid */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Due date */}
          {due && (
            <MetaRow
              icon={<IconCalendar size={13} />}
              label={t("detail.due")}
              value={due}
            />
          )}

          {/* Duration */}
          <MetaRow
            icon={<IconClock size={13} />}
            label={t("detail.estimate")}
            value={fmtDuration(task.duration, locale)}
          />

          {/* Pomodoro pips */}
          {task.pomos_total > 0 && (
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)", minWidth: 64 }}>
                Pomodoro
              </span>
              <span className="pip">
                {Array.from({ length: task.pomos_total }).map((_, i) => (
                  <i key={i} className={i < task.pomos_done ? "on" : ""} />
                ))}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: "var(--text-faint)" }}>
                {task.pomos_done}/{task.pomos_total}
              </span>
            </div>
          )}

          {/* Assignees */}
          {assignees.length > 0 && (
            <div className="col-span-2 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)", minWidth: 64 }}>
                {t("detail.assignee")}
              </span>
              {assignees.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <PersonAvatar person={p} size={20} />
                  <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Next step */}
        {task.next_step && (
          <div
            className="mx-5 mb-4 px-3 py-2.5 rounded-lg text-[12px] leading-relaxed"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-faint)",
              color: "var(--text-secondary)",
            }}
          >
            <span className="font-medium" style={{ color: "var(--text-faint)" }}>
              {t("detail.nextstep")} ·{" "}
            </span>
            {ls(task.next_step)}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-faint)", margin: "0 0" }} />

        {/* Footer actions */}
        <footer className="flex items-center gap-2 px-5 py-3">
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => { onClose(); navigate("/focus"); }}
          >
            {t("detail.start")}
            <IconArrowRight size={13} />
          </button>

          <button
            className="btn btn-secondary flex items-center gap-1.5"
            onClick={handleComplete}
          >
            <IconCheck size={13} />
            {t("detail.complete")}
          </button>

          <div style={{ flex: 1 }} />

          <button
            className="btn btn-ghost"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setEditOpen(true)}
          >
            {t("detail.edit")}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--text-faint)" }}>{icon}</span>
      <span className="text-[11px] font-medium" style={{ color: "var(--text-faint)", minWidth: 40 }}>{label}</span>
      <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}
