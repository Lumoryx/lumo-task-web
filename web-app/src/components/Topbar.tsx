import { useT } from "@/i18n/useT";
import { IconPlus, IconSearch } from "@/components/icons";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onQuickAdd: () => void;
}

/**
 * Fixed-height top bar with page meta on the left, search + actions on
 * the right. Matches the Win-desktop / web app pattern (per Jalen's
 * feedback: full-bleed, no window chrome).
 */
export function Topbar({ title, subtitle, onQuickAdd }: TopbarProps) {
  const t = useT();
  return (
    <div className="flex items-center gap-4 px-7 border-b border-border-faint" style={{ height: 56 }}>
      <div>
        <span className="text-[15px] font-semibold text-text-primary">{title}</span>
        {subtitle && <span className="ml-2.5 text-xs text-text-muted">{subtitle}</span>}
      </div>
      <div className="flex-1" />

      {/* Search */}
      <div
        className="flex items-center gap-2 bg-surface border border-border-faint rounded-lg px-3 text-xs text-text-muted"
        style={{ height: 32, width: 240 }}
      >
        <span className="inline-flex flex-shrink-0 text-text-muted">
          <IconSearch size={14} />
        </span>
        <input
          type="text"
          placeholder={t("topbar.search")}
          className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-muted"
        />
        <span
          className="text-[10px] font-mono text-text-faint border border-border-default rounded-[3px] bg-deep flex-shrink-0"
          style={{ padding: "1px 5px" }}
        >
          ⌘K
        </span>
      </div>

      {/* Quick add */}
      <button
        onClick={onQuickAdd}
        title={t("topbar.quickadd")}
        className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-subtle hover:text-text-primary transition-colors"
      >
        <IconPlus size={16} />
      </button>

      {/* Avatar */}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold text-text-inverse"
        style={{
          background: "linear-gradient(135deg, var(--accent-dim), var(--accent-primary))",
          boxShadow: "0 0 0 1px var(--border-default)",
        }}
      >
        AS
      </div>
    </div>
  );
}
