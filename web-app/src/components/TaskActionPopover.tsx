import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IconArrowRight, IconCheck } from "@/components/icons";
import { useT } from "@/i18n/useT";
import { useTasksStore } from "@/store/useTasksStore";
import type { Task } from "@/types/task";

interface Props {
  task: Task;
  /** Bounding rect of the trigger button — used to anchor the popover. */
  anchor: DOMRect;
  onClose: () => void;
  /** Called when the user selects "Edit" — parent mounts the edit modal. */
  onEdit: () => void;
}

export function TaskActionPopover({ task, anchor, onClose, onEdit }: Props) {
  const navigate = useNavigate();
  const t = useT();
  const complete = useTasksStore((s) => s.complete);
  const update = useTasksStore((s) => s.update);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const popoverH = 178;
  const gap = 8;
  const spaceBelow = window.innerHeight - anchor.bottom;
  const openAbove = spaceBelow < popoverH + gap + 16;

  const posStyle: React.CSSProperties = openAbove
    ? { bottom: window.innerHeight - anchor.top + gap }
    : { top: anchor.bottom + gap };

  async function handleToggleToday() {
    await update(task.id, { today: !task.today });
    onClose();
  }

  async function handleComplete() {
    await complete(task.id);
    onClose();
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[48]" onClick={onClose} />

      {/* Popover */}
      <div
        className="fixed z-[49] rounded-xl overflow-hidden"
        style={{
          left: Math.min(anchor.left, window.innerWidth - 228),
          ...posStyle,
          minWidth: 220,
          background: "var(--bg-elevated)",
          border: "1px solid var(--accent-edge)",
          boxShadow: "var(--shadow-lifted), 0 0 20px var(--accent-fog)",
          animation: "popoverIn 150ms var(--ease-enter) both",
        }}
      >
        <ActionBtn
          icon={<IconArrowRight size={13} />}
          label={t("today.start")}
          accent
          onClick={() => { onClose(); navigate("/focus"); }}
        />
        <Divider />
        <ActionBtn
          icon={<IconCheck size={13} />}
          label={t("focus.complete")}
          onClick={handleComplete}
        />
        <Divider />
        <ActionBtn
          icon={<EditIcon />}
          label={t("popover.edit")}
          onClick={() => { onClose(); onEdit(); }}
        />
        <ActionBtn
          icon={<TodayIcon active={task.today} />}
          label={task.today ? t("popover.today.remove") : t("popover.today.add")}
          onClick={handleToggleToday}
        />
      </div>
    </>,
    document.body
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border-faint)" }} />;
}

function ActionBtn({
  icon,
  label,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-left"
      style={{ color: accent ? "var(--accent-primary)" : "var(--text-secondary)", background: "transparent" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = accent
          ? "var(--accent-fog)"
          : "var(--bg-subtle)";
      }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {icon}
      {label}
    </button>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TodayIcon({ active }: { active: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      {active && <path d="M9 16l2 2 4-4" />}
    </svg>
  );
}
