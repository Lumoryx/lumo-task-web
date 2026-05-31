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

export function WinControls({ height = 56 }: { height?: number }) {
  if (!isElectron) return null;
  return (
    <div style={{ display: "flex", WebkitAppRegion: "no-drag" }}>
      <button
        style={{ ...ctrlBase, height }}
        title="最小化"
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        onClick={() => window.electronAPI?.minimize()}
      >
        ─
      </button>
      <button
        style={{ ...ctrlBase, height }}
        title="最大化 / 还原"
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        onClick={() => window.electronAPI?.maximize()}
      >
        ▢
      </button>
      <button
        style={{ ...ctrlBase, height }}
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
