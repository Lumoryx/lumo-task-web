import { useEffect, useState } from "react";
import { IconCheck } from "@/components/icons";
import { useT } from "@/i18n/useT";
import type { Habit } from "@/types/task";

const COLOR_MAP: Record<string, string> = {
  green:  "var(--status-success)",
  cyan:   "var(--accent-primary)",
  amber:  "var(--status-warning)",
  red:    "var(--status-danger)",
  purple: "#a78bfa",
};

interface Props {
  habit: Habit;
  onConfirm: () => void;
  onClose: () => void;
}

export function HabitCheckInModal({ habit, onConfirm, onClose }: Props) {
  const t = useT();
  const color = COLOR_MAP[habit.color] ?? COLOR_MAP.green;
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleConfirm() {
    if (confirmed) return;
    setConfirmed(true);
    onConfirm();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface border border-border-faint shadow-2xl overflow-hidden">
        {/* Color accent strip */}
        <div className="h-1 w-full" style={{ background: color }} />

        <div className="p-6 space-y-5">
          {/* Habit identity */}
          <div className="flex flex-col items-center gap-2 text-center">
            {habit.emoji ? (
              <span className="text-4xl leading-none">{habit.emoji}</span>
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: `${color}22` }}
              >
                <IconCheck size={22} style={{ color }} />
              </div>
            )}
            <h2 className="text-[17px] font-semibold text-text-primary mt-1">{habit.title}</h2>
            <p className="text-[13px] text-text-muted">{t("habit.checkin.sub")}</p>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={confirmed}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: color, opacity: confirmed ? 0.5 : 1, cursor: confirmed ? "default" : "pointer" }}
          >
            <IconCheck size={16} />
            {t("habit.checkin.btn")}
          </button>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-[13px] text-text-muted hover:text-text-secondary transition-colors"
          >
            {t("habit.btn.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
