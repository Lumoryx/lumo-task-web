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
}

/**
 * Small action popover: choose between starting a focus session or
 * immediately completing the task. Rendered via portal so it's never
 * clipped by overflow:hidden ancestors (matrix quadrant panels, etc.).
 */
export function TaskActionPopover({ task, anchor, onClose }: Props) {
  const navigate = useNavigate();
  const t = useT();
  const complete = useTasksStore((s) => s.complete);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Decide whether to open above or below the anchor
  const popoverH = 90;
  const gap = 8;
  const spaceBelow = window.innerHeight - anchor.bottom;
  const openAbove = spaceBelow < popoverH + gap + 16;

  const posStyle: React.CSSProperties = openAbove
    ? { bottom: window.innerHeight - anchor.top + gap }
    : { top: anchor.bottom + gap };

  return createPortal(
    <>
      {/* Invisible backdrop — captures outside clicks */}
      <div className="fixed inset-0 z-[48]" onClick={onClose} />

      {/* Popover */}
      <div
        className="fixed z-[49] rounded-xl overflow-hidden"
        style={{
          left: Math.min(anchor.left, window.innerWidth - 216),
          ...posStyle,
          minWidth: 208,
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
        <div style={{ height: 1, background: "var(--border-faint)" }} />
        <ActionBtn
          icon={<IconCheck size={13} />}
          label={t("focus.complete")}
          onClick={() => { complete(task.id); onClose(); }}
        />
      </div>
    </>,
    document.body
  );
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
      className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors text-left"
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
