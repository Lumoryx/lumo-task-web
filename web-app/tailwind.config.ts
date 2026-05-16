import type { Config } from "tailwindcss";

/**
 * Tailwind is wired to the design tokens defined in `src/index.css`.
 * Use these semantic class names instead of arbitrary hex codes so the
 * theme stays consistent (and accent swap works at runtime).
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        subtle: "var(--bg-subtle)",
        deep: "var(--bg-deep)",
        // Borders
        "border-faint": "var(--border-faint)",
        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",
        // Text
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-faint": "var(--text-faint)",
        "text-inverse": "var(--text-inverse)",
        // Accents
        "accent-primary": "var(--accent-primary)",
        "accent-dim": "var(--accent-dim)",
        // Quadrant
        q1: "var(--q1-color)",
        q2: "var(--q2-color)",
        q3: "var(--q3-color)",
        q4: "var(--q4-color)",
        // Status
        urgent: "var(--status-urgent)",
        success: "var(--status-success)",
        warning: "var(--status-warning)",
        info: "var(--status-info)",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "PingFang SC", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lifted: "var(--shadow-lifted)",
        window: "var(--shadow-window)",
      },
    },
  },
  plugins: [],
} satisfies Config;
