import { useRef, useState, useEffect } from "react";
import { useT } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useDogStore } from "@/store/useDogStore";
import { DogSvg } from "@/components/DogSvg";
import type { PrevWeekStats } from "@/utils/wrapped";

const DAY_KEYS = [
  "stats.day.sun", "stats.day.mon", "stats.day.tue", "stats.day.wed",
  "stats.day.thu", "stats.day.fri", "stats.day.sat",
];

interface WrappedCardProps {
  stats: PrevWeekStats;
  currentStreak: number;
  userName: string;
  onDismiss: () => void;
}

export function WrappedCard({ stats, currentStreak, userName, onDismiss }: WrappedCardProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const { level } = useDogStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "downloaded">("idle");
  const [insight, setInsight] = useState<string | null>(null);

  const maxDay = Math.max(...stats.byDay, 1);

  useEffect(() => {
    if (stats.tasksCompleted === 0) return;
    let cancelled = false;
    async function fetchInsight() {
      try {
        const { api } = await import("@/api/client");
        const result = await api.petChat({
          messages: [{
            role: "user",
            content: locale === "zh"
              ? `请用一句话点评我上周的数据：完成了${stats.tasksCompleted}个任务，专注了${Math.round(stats.focusMinutes / 60 * 10) / 10}小时，Q1完成${stats.q1Tasks}个，连击${currentStreak}天。要积极鼓励，不超过20字。`
              : `In one sentence, review my last week: ${stats.tasksCompleted} tasks done, ${Math.round(stats.focusMinutes / 60 * 10) / 10}h focus, ${stats.q1Tasks} Q1 tasks, ${currentStreak}-day streak. Be encouraging, max 15 words.`,
          }],
          context: { page: "stats", locale },
        });
        if (!cancelled && result.reply) setInsight(result.reply);
      } catch {
        // silently degrade
      }
    }
    fetchInsight();
    return () => { cancelled = true; };
  }, [stats, currentStreak, locale]);

  async function handleShare() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("export failed"))), "image/png")
      );
      const file = new File([blob], "lumo-wrapped.png", { type: "image/png" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t("wrapped.share.title") });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lumo-wrapped.png";
        a.click();
        URL.revokeObjectURL(url);
        setFeedback("downloaded");
        setTimeout(() => setFeedback("idle"), 2500);
      }
    } catch {
      // cancelled
    } finally {
      setBusy(false);
    }
  }

  const btnLabel = busy
    ? locale === "zh" ? "生成中…" : "Exporting…"
    : feedback === "downloaded"
    ? t("stats.share.downloaded")
    : t("wrapped.share.btn");

  return (
    <div style={{ maxWidth: 400 }}>
      {/* Captured area */}
      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg-base) 100%)",
          border: "1px solid var(--border-default)",
          borderRadius: 20,
          padding: "28px 28px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>
              {userName ? `${userName} · ` : ""}{t("wrapped.title")}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{stats.weekLabel}</div>
          </div>
          <DogSvg mood="happy" size={44} level={level} />
        </div>

        {/* Big stat row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "var(--bg-deep)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-primary)", lineHeight: 1 }}>
              {stats.tasksCompleted}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>{t("stats.tasks")}</div>
          </div>
          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "var(--bg-deep)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-primary)", lineHeight: 1 }}>
              {(stats.focusMinutes / 60).toFixed(1)}h
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>{t("stats.focus")}</div>
          </div>
          <div style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "var(--bg-deep)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-primary)", lineHeight: 1 }}>
              🔥{currentStreak}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>{t("stats.streak")}</div>
          </div>
        </div>

        {/* AI insight */}
        {insight && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(var(--accent-primary-rgb,61,255,160),0.08)",
            border: "1px solid var(--accent-dim)",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 16,
            lineHeight: 1.5,
          }}>
            "{insight}"
          </div>
        )}

        {/* Day bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 16, height: 36 }}>
          {stats.byDay.map((count, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: "100%",
                borderRadius: 2,
                height: count === 0 ? 3 : `${Math.max(6, (count / maxDay) * 26)}px`,
                background: count > 0 ? "var(--accent-primary)" : "var(--bg-elevated)",
                opacity: count > 0 ? 0.7 + (count / maxDay) * 0.3 : 0.3,
              }} />
              <span style={{ fontSize: 8, color: "var(--text-faint)" }}>{t(DAY_KEYS[i])}</span>
            </div>
          ))}
        </div>

        {/* Brand footer */}
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-faint)" }}>lumo.app</div>
      </div>

      {/* Action buttons — outside captured area */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
        <button
          onClick={handleShare}
          disabled={busy}
          className="btn btn-primary"
          style={{ minWidth: 100 }}
        >
          {btnLabel}
        </button>
        <button onClick={onDismiss} className="btn btn-ghost">
          {t("wrapped.dismiss")}
        </button>
      </div>
    </div>
  );
}
