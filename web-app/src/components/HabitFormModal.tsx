import { useEffect, useState } from "react";
import { IconClose } from "@/components/icons";
import { useT } from "@/i18n/useT";
import type { Habit, HabitColor, HabitFrequency } from "@/types/task";

const COLORS: HabitColor[] = ["green", "cyan", "amber", "red", "purple"];
const FREQUENCIES: HabitFrequency[] = ["daily", "weekdays", "weekly"];

const COLOR_HEX: Record<HabitColor, string> = {
  green:  "var(--status-success)",
  cyan:   "var(--accent-primary)",
  amber:  "var(--status-warning)",
  red:    "var(--status-danger)",
  purple: "#a78bfa",
};

interface FormState {
  title: string;
  emoji: string;
  color: HabitColor;
  frequency: HabitFrequency;
  note: string;
}

interface Props {
  habit?: Habit | null;
  onSave: (data: Omit<Habit, "id" | "createdAt">) => void;
  onClose: () => void;
}

export function HabitFormModal({ habit, onSave, onClose }: Props) {
  const t = useT();
  const isEdit = !!habit;

  const [form, setForm] = useState<FormState>({
    title: habit?.title ?? "",
    emoji: habit?.emoji ?? "",
    color: habit?.color ?? "green",
    frequency: habit?.frequency ?? "daily",
    note: habit?.note ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    setForm({
      title: habit?.title ?? "",
      emoji: habit?.emoji ?? "",
      color: habit?.color ?? "green",
      frequency: habit?.frequency ?? "daily",
      note: habit?.note ?? "",
    });
    setErrors({});
  }, [habit]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = t("habit.form.error.title");
    else if (form.title.length > 100) errs.title = t("habit.form.error.title.maxlen");
    if (form.note.length > 500) errs.note = t("habit.form.error.note.maxlen");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      title: form.title.trim(),
      emoji: form.emoji.trim() || undefined,
      color: form.color,
      frequency: form.frequency,
      note: form.note.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface border border-border-faint shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-faint">
          <h2 className="text-[15px] font-semibold text-text-primary">
            {isEdit ? t("habit.form.edit") : t("habit.form.new")}
          </h2>
          <button
            onClick={onClose}
            aria-label="close"
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
          >
            <IconClose size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">
              {t("habit.form.title")}
            </label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("habit.form.title")}
              className="w-full px-3 py-2 rounded-lg bg-elevated border border-border-faint text-[13px] text-text-primary placeholder:text-text-faint outline-none focus:border-accent-edge transition-colors"
            />
            {errors.title && (
              <p className="mt-1 text-[11px]" style={{ color: "var(--status-danger)" }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Emoji + Frequency row */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-24">
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                {t("habit.form.emoji")}
              </label>
              <input
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                placeholder="🔥"
                className="w-full px-3 py-2 rounded-lg bg-elevated border border-border-faint text-[18px] text-center outline-none focus:border-accent-edge transition-colors"
                maxLength={4}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                {t("habit.form.frequency")}
              </label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as HabitFrequency }))}
                className="w-full px-3 py-2 rounded-lg bg-elevated border border-border-faint text-[13px] text-text-primary outline-none focus:border-accent-edge transition-colors"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>{t(`habit.freq.${freq}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-2">
              {t("habit.form.color")}
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={t(`habit.color.${c}`)}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    background: COLOR_HEX[c],
                    borderColor: form.color === c ? "var(--text-primary)" : "transparent",
                    transform: form.color === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">
              {t("habit.form.note")}
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-elevated border border-border-faint text-[13px] text-text-primary placeholder:text-text-faint outline-none focus:border-accent-edge transition-colors resize-none"
            />
            {errors.note && (
              <p className="mt-1 text-[11px]" style={{ color: "var(--status-danger)" }}>
                {errors.note}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium text-text-secondary bg-elevated hover:bg-surface border border-border-faint transition-colors"
            >
              {t("habit.btn.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-text-inverse transition-opacity"
              style={{ background: "var(--accent-primary)" }}
            >
              {isEdit ? t("habit.form.save") : t("habit.form.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
