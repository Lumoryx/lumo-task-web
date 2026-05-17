import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "@/components/icons";
import { useT } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { PersonAvatar } from "@/pages/SettingsPage";
import type { Quadrant, Task } from "@/types/task";

interface Props {
  task: Task;
  onClose: () => void;
}

const QUADRANTS: Quadrant[] = ["Q1", "Q2", "Q3", "Q4"];

const Q_META: Record<Quadrant, { en: string; zh: string; descEn: string; descZh: string }> = {
  Q1:           { en: "Do first",  zh: "立即做", descEn: "Urgent & important",    descZh: "紧急 + 重要" },
  Q2:           { en: "Schedule",  zh: "安排做", descEn: "Important, not urgent", descZh: "重要，不紧急" },
  Q3:           { en: "Delegate",  zh: "委托做", descEn: "Urgent, not important", descZh: "紧急，不重要" },
  Q4:           { en: "Drop",      zh: "减少做", descEn: "Neither",               descZh: "都不是" },
  unclassified: { en: "Unsorted",  zh: "未分类", descEn: "Not yet placed",        descZh: "尚未归位" },
};

export function TaskEditModal({ task, onClose }: Props) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const update = useTasksStore((s) => s.update);
  const remove = useTasksStore((s) => s.remove);
  const people = usePeopleStore((s) => s.people);

  const todayISO = new Date().toISOString().split("T")[0];

  const initialTitle =
    typeof task.title === "string" ? task.title : (task.title as { en: string }).en;

  const [title, setTitle] = useState(initialTitle);
  const [quadrant, setQuadrant] = useState<Task["quadrant"]>(task.quadrant);
  const [duration, setDuration] = useState(task.duration);
  const [durationRaw, setDurationRaw] = useState(String(task.duration));
  const [dueDate, setDueDate] = useState<string>(
    task.due === "today" ? todayISO : task.due ?? todayISO
  );
  const [assigneeId, setAssigneeId] = useState<string | undefined>(task.assignee_id);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, quadrant, duration, dueDate, assigneeId]);

  async function handleSave() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await update(task.id, {
        title: { en: title.trim(), zh: title.trim() },
        quadrant: quadrant as Task["quadrant"],
        duration,
        pomos_total: Math.max(1, Math.ceil(duration / 25)),
        due: dueDate || null,
        assignee_id: assigneeId,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await remove(task.id);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fade-in fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(8, 11, 10, 0.65)", backdropFilter: "blur(6px)", padding: "0 32px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden border rounded-[14px]"
        style={{
          maxWidth: 520,
          background: "var(--bg-elevated)",
          borderColor: "var(--accent-edge)",
          boxShadow: "var(--shadow-lifted), 0 0 60px var(--accent-fog)",
          marginTop: "-6vh",
        }}
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-[18px] py-4 border-b border-border-faint">
          <div className="flex-1 text-[13px] font-semibold text-text-primary">{t("edit.title")}</div>
          <button
            onClick={onClose}
            aria-label={t("qc.close")}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-text-muted border border-border-default bg-transparent hover:bg-subtle hover:text-text-primary hover:border-border-strong transition-colors"
          >
            <IconClose size={12} />
          </button>
        </header>

        {/* Body */}
        <div className="px-[18px] py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint mb-1.5">
              {locale === "zh" ? "任务" : "Task"}
            </div>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("qc.placeholder")}
              className="input"
              style={{ height: 40, fontSize: 14, fontWeight: 500 }}
            />
          </div>

          {/* Quadrant 2×2 grid */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint mb-2">
              {t("qc.quadrant")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUADRANTS.map((q) => {
                const meta = Q_META[q];
                const active = quadrant === q;
                return (
                  <button
                    key={q}
                    onClick={() => setQuadrant(q)}
                    className="text-left rounded-lg border transition-colors"
                    style={{
                      padding: "9px 11px",
                      background: active ? "var(--bg-subtle)" : "var(--bg-surface)",
                      borderColor: active ? "var(--border-strong)" : "var(--border-default)",
                      boxShadow: active ? "0 0 0 1px var(--border-strong)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`qdot qdot-${q.toLowerCase()}`} />
                      <span className="text-[11px] font-semibold text-text-primary">{q}</span>
                      <span
                        className="text-[11px] font-medium ml-1"
                        style={{ color: `var(--q${q[1]}-color, var(--text-muted))` }}
                      >
                        {locale === "zh" ? meta.zh : meta.en}
                      </span>
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {locale === "zh" ? meta.descZh : meta.descEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint mb-1.5">
                {t("qc.due")}
              </div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
                style={{ colorScheme: "dark", cursor: "pointer" }}
              />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint mb-1.5">
                {t("qc.duration")}
              </div>
              <div
                className="flex items-center rounded-md border overflow-hidden"
                style={{ height: 36, borderColor: "var(--border-default)", background: "var(--bg-surface)" }}
              >
                <button
                  type="button"
                  onClick={() => { const next = Math.max(1, duration - 1); setDuration(next); setDurationRaw(String(next)); }}
                  className="flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-subtle transition-colors select-none"
                  style={{ width: 32, fontSize: 16, flexShrink: 0, height: "100%" }}
                >
                  −
                </button>
                <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
                  <input
                    type="number"
                    min={1}
                    value={durationRaw}
                    onChange={(e) => {
                      setDurationRaw(e.target.value);
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) setDuration(v);
                    }}
                    onBlur={() => {
                      const clamped = Math.max(1, duration || 1);
                      setDuration(clamped);
                      setDurationRaw(String(clamped));
                    }}
                    className="tabular-nums font-semibold text-text-primary bg-transparent border-none outline-none text-center"
                    style={{ fontSize: 13, width: 40 }}
                  />
                  <span className="text-[10px] text-text-muted flex-shrink-0">
                    {locale === "zh" ? "分钟" : "min"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { const next = duration + 1; setDuration(next); setDurationRaw(String(next)); }}
                  className="flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-subtle transition-colors select-none"
                  style={{ width: 32, fontSize: 16, flexShrink: 0, height: "100%" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Assignee */}
          {people.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint mb-1.5">
                {t("qc.assignee")}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAssigneeId(undefined)}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] transition-colors"
                  style={{
                    border: assigneeId === undefined ? "1px solid var(--accent-edge)" : "1px solid var(--border-default)",
                    background: assigneeId === undefined ? "var(--accent-fog)" : "var(--bg-surface)",
                    color: assigneeId === undefined ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                >
                  {t("qc.assignee.none")}
                </button>
                {people.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAssigneeId(p.id)}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] transition-colors"
                    style={{
                      border: assigneeId === p.id ? "1px solid var(--accent-edge)" : "1px solid var(--border-default)",
                      background: assigneeId === p.id ? "var(--accent-fog)" : "var(--bg-surface)",
                      color: assigneeId === p.id ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <PersonAvatar person={p} size={16} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-2 px-[18px] py-3 border-t border-border-faint">
          {/* Delete — left-anchored, confirm-to-delete pattern */}
          <button
            className="btn btn-ghost text-[12px] transition-colors"
            style={{ color: confirmDelete ? "var(--status-urgent)" : "var(--text-faint)", marginRight: "auto" }}
            onClick={handleDelete}
            disabled={busy}
          >
            {confirmDelete
              ? locale === "zh" ? "确认删除？" : "Confirm delete?"
              : t("edit.delete")}
          </button>
          {confirmDelete && (
            <button className="btn btn-ghost text-[12px]" onClick={() => setConfirmDelete(false)} disabled={busy}>
              {t("qc.cancel")}
            </button>
          )}
          {!confirmDelete && (
            <>
              <button className="btn btn-ghost" onClick={onClose} disabled={busy}>{t("qc.cancel")}</button>
              <button
                className="btn btn-primary"
                disabled={!title.trim() || busy}
                onClick={handleSave}
              >
                {t("edit.save")}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
