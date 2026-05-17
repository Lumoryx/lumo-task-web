import { useNavigate } from "react-router-dom";
import { useT } from "@/i18n/useT";
import { IconPlus, IconSearch } from "@/components/icons";
import { useAuthStore } from "@/store/useAuthStore";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onQuickAdd: () => void;
}

const isElectron = typeof window !== "undefined" && !!window.electronAPI;

const ctrlBase: React.CSSProperties = {
  WebkitAppRegion: "no-drag",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 46,
  height: 56,
  flexShrink: 0,
  background: "transparent",
  border: "none",
  cursor: "default",
  fontSize: 11,
  color: "var(--text-muted)",
  transition: "background 120ms, color 120ms",
};

function WinControls() {
  if (!isElectron) return null;
  return (
    <div style={{ display: "flex", marginRight: -28, WebkitAppRegion: "no-drag" }}>
      <button
        style={ctrlBase}
        title="最小化"
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        onClick={() => window.electronAPI?.minimize()}
      >
        ─
      </button>
      <button
        style={ctrlBase}
        title="最大化 / 还原"
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        onClick={() => window.electronAPI?.maximize()}
      >
        ▢
      </button>
      <button
        style={ctrlBase}
        title="关闭"
        onMouseEnter={(e) => { e.currentTarget.style.background = "#c42b1c"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        onClick={() => window.electronAPI?.close()}
      >
        ✕
      </button>
    </div>
  );
}

export function Topbar({ title, subtitle, onQuickAdd }: TopbarProps) {
  const t = useT();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div
      className="flex items-center gap-4 px-7 border-b border-border-faint"
      style={{
        height: 56,
        WebkitAppRegion: isElectron ? "drag" : undefined,
      }}
    >
      <div style={{ WebkitAppRegion: "no-drag" }}>
        <span className="text-[15px] font-semibold text-text-primary">{title}</span>
        {subtitle && <span className="ml-2.5 text-xs text-text-muted">{subtitle}</span>}
      </div>
      <div className="flex-1" />

      {/* Search */}
      <div
        className="flex items-center gap-2 bg-surface border border-border-faint rounded-lg px-3 text-xs text-text-muted"
        style={{ height: 32, width: 240, WebkitAppRegion: "no-drag" }}
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
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <IconPlus size={16} />
      </button>

      {/* Avatar */}
      <button
        onClick={() => navigate("/account")}
        title={user.name}
        className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold text-text-inverse flex-shrink-0 transition-opacity hover:opacity-80 active:opacity-60"
        style={{
          background: "linear-gradient(135deg, var(--accent-dim), var(--accent-primary))",
          boxShadow: "0 0 0 1px var(--border-default)",
          WebkitAppRegion: "no-drag",
        }}
      >
        {user.initials}
      </button>

      <WinControls />
    </div>
  );
}
