import { useEffect, useState } from "react";
import { IconClose } from "@/components/icons";
import { useT } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { Quadrant, Task } from "@/types/task";

interface QuickCreateProps {
  initialQuadrant?: Quadrant;
  /** When provided, opens in edit mode for this task. */
  editTask?: Task;
  onClose: () => void;
  onCreated?: () => void;
}

const QUADRANTS: Quadrant[] = ["Q1", "Q2", "Q3", "Q4"];

const Q_META: Record<Quadrant, { en: string; zh: string; descEn: string; descZh: string }> = {
  Q1:           { en: "Do first",  zh: "立即做", descEn: "Urgent & important",    descZh: "紧急 + 重要" },
  Q2:           { en: "Schedule",  zh: "安排做", descEn: "Important, not urgent", descZh: "重要，不紧急" },
  Q3:           { en: "Delegate",  zh: "委托做", descEn: "Urgent, not important", descZh: "紧急，不重要" },
  Q4:           { en: "Drop",      zh: "减少做", descEn: "Neither",               descZh: "都不是" },
  unclassified: { en: "Unsorted",  zh: "未分类", descEn: "Not yet placed",        descZh: "尚未归位" },
};

/**
 * Modal for creating a task quickly. Per design: centered, dismiss via X or
 * Escape. Escape is a convenience but the X button is always the primary affordance.
 */
export function QuickCreate({ initialQuadrant = "Q2", editTask, onClose, onCreated }: QuickCreateProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const create = useTasksStore((s) => s.create);
  const update = useTasksStore((s) => s.update);

  const isEdit = !!editTask;

  const [title, setTitle] = useState(() => {
    if (!editTask) return "";
    return locale === "zh"
      ? (editTask.title.zh ?? editTask.title.en)
      : editTask.title.en;
  });
  const [quadrant, setQuadrant] = useState<Quadrant>(editTask?.quadrant ?? initialQuadrant);
  const [duration, setDuration] = useState(editTask?.duration ?? 30);
  const [due, setDue] = useState<string | null>(editTask?.due ?? "today");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, quadrant, duration, due]);

  async function submit() {
    if (!title.trim()) return;
    if (isEdit && editTask) {
      await update(editTask.id, {
        title: { en: title.trim(), zh: title.trim() },
        quadrant,
        today: due === "today",
        due,
        duration,
        pomos_total: Math.max(1, Math.ceil(duration / 25)),
      });
      onClose();
    } else {
      await create({
        title: { en: title.trim(), zh: title.trim() },
        quadrant,
        today: due === "today",
        due,
        duration,
        pomos_done: 0,
        pomos_total: Math.max(1, Math.ceil(duration / 25)),
      });
      onCreated?.();
    }
  }

  return (
    <div
      onClick={onClose}
      className="fade-in fixed inset-0 z-[150] flex items-center justify-center"
      style={{ background: "rgba(8, 11, 10, 0.6)", backdropFilter: "blur(6px)", padding: "0 32px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden border rounded-[14px] bg-elevated shadow-lifted"
        style={{
          maxWidth: 520,
          borderColor: "var(--accent-edge)",
          boxShadow: "var(--shadow-lifted), 0 0 60px var(--accent-fog)",
          marginTop: "-6vh",
        }}
      >
        {/* Header */}
        <header className="flex items-start gap-3 px-[18px] py-4 border-b border-border-faint">
          <span className="lumo-glyph" style={{ width: 14, height: 14, marginTop: 3 }}>
            <span className="halo" />
            <span className="core" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-text-primary">
              {isEdit
                ? (locale === "zh" ? "编辑任务" : "Edit task")
                : t("qc.title")}
            </div>
            <div className="mt-0.5 text-[11px] text-text-muted">
              {locale === "zh"
                ? "选个象限和时长，我会帮你排上。"
                : "Pick a quadrant + estimate. I'll slot it in."}
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
                      boxShadow: active ? `0 0 0 1px var(--border-strong)` : "none",
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
              <select
                value={due ?? ""}
                onChange={(e) => setDue(e.target.value || null)}
                className="input"
              >
                <option value="">—</option>
                <option value="today">{locale === "zh" ? "今天" : "Today"}</option>
                <option value="Fri">{locale === "zh" ? "周五" : "Fri"}</option>
                <option value="next wk">{locale === "zh" ? "下周" : "Next week"}</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-faint mb-1.5">
                {t("qc.duration")}
              </div>
              {/* Inline stepper — shows unit label, ±5 step */}
              <div
                className="flex items-center rounded-md border overflow-hidden"
                style={{
                  height: 36,
                  borderColor: "var(--border-default)",
                  background: "var(--bg-surface)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.max(5, d - 5))}
                  className="flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-subtle transition-colors select-none"
                  style={{ width: 32, fontSize: 16, flexShrink: 0, height: "100%" }}
                >
                  −
                </button>
                <div className="flex-1 flex items-center justify-center gap-1">
                  <span className="text-[13px] font-semibold tabular-nums text-text-primary">
                    {duration}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {locale === "zh" ? "分钟" : "min"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDuration((d) => d + 5)}
                  className="flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-subtle transition-colors select-none"
                  style={{ width: 32, fontSize: 16, flexShrink: 0, height: "100%" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 px-[18px] py-3 border-t border-border-faint">
          <button className="btn btn-ghost" onClick={onClose}>{t("qc.cancel")}</button>
          <button className="btn btn-primary" disabled={!title.trim()} onClick={submit}>
            {isEdit ? (locale === "zh" ? "保存" : "Save") : t("qc.create")}
          </button>
        </footer>
      </div>
    </div>
  );
}
