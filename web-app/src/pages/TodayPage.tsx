import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TaskRow } from "@/components/TaskRow";
import { IconArrowRight, IconUndo } from "@/components/icons";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { usePetStore } from "@/store/usePetStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { fmtDuration } from "@/lib/format";
import type { CompletedEntry, Locale, Task } from "@/types/task";

const Q_PRIORITY: Record<Task["quadrant"], number> = {
  Q1: 0, Q2: 1, Q3: 2, Q4: 3, unclassified: 4,
};

const Q_CHIP: Record<string, string> = {
  Q1: "chip chip-q1",
  Q2: "chip chip-q2",
  Q3: "chip chip-q3",
  Q4: "chip chip-q4",
  unclassified: "chip",
};

function fmtTime(iso: string | undefined, locale: Locale): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// ─── Conviction Card ───────────────────────────────────────────────────────

interface ConvictionCardProps {
  task: Task;
  tasks: Task[];
  locale: Locale;
}

function ConvictionCard({ task, tasks, locale }: ConvictionCardProps) {
  const navigate = useNavigate();
  const t = useT();
  const ls = useLocaleString();
  const isMobile = useIsMobile();

  const conviction = task.conviction ?? 0.9;
  const targetPct = Math.round(conviction * 100);
  const [displayPct, setDisplayPct] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setDisplayPct(0);
    setBarPct(0);
    let start: number | null = null;
    const duration = 1100;

    const timeout = setTimeout(() => {
      const animate = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setDisplayPct(Math.round(ease * targetPct));
        setBarPct(ease * conviction * 100);
        if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, 220);

    return () => { clearTimeout(timeout); cancelAnimationFrame(rafRef.current); };
  }, [task.id, targetPct, conviction]);

  const notNow = task.not_now ?? [];
  const chipClass = Q_CHIP[task.quadrant] ?? "chip";

  return (
    <article
      className="conviction-card relative overflow-hidden rounded-xl"
      style={{
        border: "1px solid var(--border-default)",
        background: "var(--bg-surface)",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 220px",
        boxShadow: "var(--shadow-lifted)",
      }}
    >
      {/* Top accent scan line — animates in */}
      <div
        className="conviction-scanline absolute left-0 right-0 top-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, var(--accent-edge) 25%, var(--accent-primary) 50%, var(--accent-edge) 75%, transparent 100%)",
        }}
      />

      {/* Ambient halo — top-right glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -80, right: -40, width: 260, height: 260,
          background: "radial-gradient(circle, var(--accent-fog) 0%, transparent 65%)",
          animation: "lumoBreath 5s ease-in-out infinite",
        }}
      />

      {/* ── Left column ── */}
      <div
        className="relative flex flex-col"
        style={{ padding: "26px 28px 24px", borderRight: "1px solid var(--border-faint)" }}
      >
        {/* Header: Lumo orb + label + quadrant chip */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="lumo-glyph">
            <div className="halo" />
            <div className="core" />
          </div>
          <span
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {t("today.recommended")}
          </span>
          <span className="flex-1" />
          <span className={chipClass} style={{ fontSize: 10 }}>
            {task.quadrant === "unclassified" ? "—" : task.quadrant}
          </span>
          {!task.today && (
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              {locale === "zh" ? "待办" : "backlog"}
            </span>
          )}
        </div>

        {/* Reason quote */}
        {task.reason && (
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "var(--text-secondary)", fontStyle: "italic", maxWidth: 560 }}
          >
            "{ls(task.reason)}"
          </p>
        )}

        {/* Task title */}
        <h2
          className="font-semibold leading-snug tracking-tight mb-4"
          style={{ fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.01em", maxWidth: 560 }}
        >
          {ls(task.title)}
        </h2>

        {/* Meta row */}
        <div
          className="flex items-center gap-4 text-xs tabular-nums mb-5"
          style={{ color: "var(--text-muted)" }}
        >
          {task.due && (
            <span>
              <span style={{ color: "var(--text-faint)" }}>{t("today.due")} · </span>
              {task.due === "today" ? (locale === "zh" ? "今天" : "Today") : task.due}
            </span>
          )}
          <span>
            <span style={{ color: "var(--text-faint)" }}>{t("today.est")} · </span>
            {fmtDuration(task.duration, locale)}
          </span>
          <span className="pip">
            {Array.from({ length: task.pomos_total }).map((_, i) => (
              <i key={i} className={i < task.pomos_done ? "on" : ""} />
            ))}
          </span>
        </div>

        {/* Next step */}
        {task.next_step && (
          <div className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--text-faint)" }}>
              {locale === "zh" ? "下一步 · " : "Next step · "}
            </span>
            {ls(task.next_step)}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-auto">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/focus")}>
            {t("today.start")} <IconArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Right column — conviction sidecar ── */}
      {!isMobile && <div
        className="relative flex flex-col gap-5"
        style={{
          padding: "26px 22px 24px",
          background: "linear-gradient(180deg, var(--accent-fog) 0%, transparent 55%)",
        }}
      >
        {/* Conviction score */}
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-faint)" }}
          >
            {t("today.conviction")}
          </div>

          {/* Animated number */}
          <div
            className="flex items-baseline gap-1 mb-2.5 tabular-nums"
            style={{ fontSize: 38, fontWeight: 700, color: "var(--accent-primary)", letterSpacing: "-0.025em" }}
          >
            {displayPct}
            <span style={{ fontSize: 18, fontWeight: 500, color: "var(--text-muted)" }}>%</span>
          </div>

          {/* Animated bar */}
          <div
            className="h-[3px] w-full rounded-full overflow-hidden"
            style={{ background: "var(--bg-deep)" }}
          >
            <div
              style={{
                width: `${barPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--accent-dim), var(--accent-primary))",
                boxShadow: "0 0 8px var(--accent-primary)",
              }}
            />
          </div>
        </div>

        {/* Divider */}
        {notNow.length > 0 && (
          <div className="h-px w-full" style={{ background: "var(--border-faint)" }} />
        )}

        {/* Not now list */}
        {notNow.length > 0 && (
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-faint)" }}
            >
              {t("today.notnow")}
            </div>
            <div className="flex flex-col gap-3.5">
              {notNow.map((nn) => {
                const ref = tasks.find((x) => x.id === nn.id);
                if (!ref) return null;
                return (
                  <div key={nn.id}>
                    <div
                      className="text-xs font-medium leading-snug mb-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {ls(ref.title)}
                    </div>
                    <div
                      className="text-[11px] leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {ls(nn.reason)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>}
    </article>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

function TodayEmptyState() {
  const navigate = useNavigate();
  const t = useT();
  const locale = useAppStore((s) => s.locale);

  return (
    <div
      className="fade-in flex flex-col items-center justify-center text-center"
      style={{ minHeight: "65vh", padding: "48px 32px" }}
    >
      {/* Breathing triple-ring orb */}
      <div className="relative mb-10" style={{ width: 136, height: 136 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 65%)",
            animation: "lumoBreath 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: 24,
            border: "1px solid var(--accent-edge)",
            animation: "lumoBreath 4s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: 42,
            border: "1px solid var(--accent-primary)",
            opacity: 0.35,
            animation: "lumoBreath 3.2s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: 56,
            background: "var(--accent-primary)",
            boxShadow: "0 0 20px var(--accent-primary)",
            animation: "lumoBreath 4s ease-in-out infinite",
          }}
        />
      </div>

      <h2
        className="font-semibold mb-3"
        style={{ fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.01em" }}
      >
        {t("today.empty.title")}
      </h2>
      <p
        className="text-sm leading-relaxed mb-8"
        style={{ color: "var(--text-secondary)", maxWidth: 360 }}
      >
        {t("today.empty.sub")}
      </p>

      <button className="btn btn-secondary" onClick={() => navigate("/matrix")}>
        {t("today.empty.cta")}
        <span style={{ marginLeft: 4, opacity: 0.7 }}>→</span>
      </button>

      {/* Subtle hint row */}
      <div
        className="flex items-center gap-5 mt-12 text-[11px] tabular-nums"
        style={{ color: "var(--text-faint)" }}
      >
        {(locale === "zh"
          ? ["Q1 · 立即做", "Q2 · 安排做", "Q3 · 委托做"]
          : ["Q1 · Do first", "Q2 · Schedule", "Q3 · Delegate"]
        ).map((label, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className="inline-block rounded-full"
              style={{
                width: 6, height: 6,
                background: ["var(--q1-color)", "var(--q2-color)", "var(--q3-color)"][i],
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Confetti colors for the all-done celebration
const CONFETTI_COLORS = ["#3dffa0", "#ff6b6b", "#a8e64b", "#5bc8d4", "#ffb347"];

// ─── All-done Banner ────────────────────────────────────────────────────────

function AllDoneBanner() {
  const t = useT();

  useEffect(() => {
    usePetStore.getState().celebrate("pet.celebrate.alldone");
  }, []);

  const confetti = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${6 + (i * 6) % 88}%`,
    delay: `${(i * 0.12).toFixed(2)}s`,
    duration: `${0.9 + (i % 4) * 0.25}s`,
  }));

  return (
    <div
      className="fade-in relative flex items-center gap-4 rounded-xl border mb-10 overflow-hidden"
      style={{
        padding: "18px 24px",
        borderColor: "var(--accent-edge)",
        background: "linear-gradient(135deg, var(--accent-fog) 0%, var(--bg-surface) 60%)",
        boxShadow: "0 0 30px var(--accent-fog)",
      }}
    >
      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute"
            style={{
              width: 5,
              height: 8,
              top: -10,
              left: c.left,
              borderRadius: 2,
              background: c.color,
              animation: `confettiFall ${c.duration} ${c.delay} ease-in both`,
            }}
          />
        ))}
      </div>
      {/* Animated orb */}
      <div className="lumo-glyph flex-shrink-0" style={{ width: 20, height: 20 }}>
        <div className="halo" />
        <div className="core" />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="font-semibold text-sm"
          style={{ color: "var(--accent-primary)" }}
        >
          {t("today.alldone.title")}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {t("today.alldone.sub")}
        </div>
      </div>

      {/* Subtle checkmark cluster */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full border-2 flex items-center justify-center"
            style={{
              width: 16, height: 16,
              borderColor: "var(--accent-primary)",
              background: "var(--accent-dim)",
              opacity: 0.4 + i * 0.2,
              transform: `scale(${0.75 + i * 0.125})`,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--bg-base)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5 11-11" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Completed Timeline ────────────────────────────────────────────────────

interface TimelineProps {
  entries: CompletedEntry[];
  locale: Locale;
}

function CompletedTimeline({ entries, locale }: TimelineProps) {
  const ls = useLocaleString();
  const t = useT();
  const reopen = useTasksStore((s) => s.reopen);
  const total = entries.reduce((s, c) => s + c.duration, 0);
  const totalLabel =
    total >= 60
      ? locale === "zh"
        ? `${Math.floor(total / 60)} 小时 ${total % 60} 分`
        : `${Math.floor(total / 60)}h ${total % 60}m`
      : locale === "zh"
      ? `${total} 分钟`
      : `${total} min`;

  const sorted = [...entries].sort((a, b) => {
    const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return ta - tb;
  });

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint">
          {locale === "zh" ? "今日已完成" : "Completed today"}
        </span>
        <span
          className="text-[11px] tabular-nums text-text-faint px-2 py-0.5 rounded-full border"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {entries.length} {locale === "zh" ? "项" : entries.length === 1 ? "task" : "tasks"}
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
        <span className="text-[11px] tabular-nums text-text-faint">
          {locale === "zh" ? "共 " : ""}{totalLabel}{locale === "zh" ? "" : " total"}
        </span>
      </div>

      <div className="flex flex-col">
        {sorted.map((entry, idx) => {
          const isLast = idx === sorted.length - 1;
          const timeStart = fmtTime(entry.startedAt, locale);
          const timeEnd = fmtTime(entry.completedAt, locale);
          const qChip = entry.quadrant ? (Q_CHIP[entry.quadrant] ?? "chip") : null;

          return (
            <div key={entry.id} className="flex gap-0">
              <div
                className="flex flex-col items-end gap-0.5 flex-shrink-0 pt-0.5"
                style={{ width: 72, minWidth: 72 }}
              >
                {timeStart && (
                  <span className="text-[11px] tabular-nums text-text-faint leading-none">{timeStart}</span>
                )}
                {timeEnd && timeEnd !== timeStart && (
                  <span className="text-[11px] tabular-nums text-text-muted leading-none">{timeEnd}</span>
                )}
              </div>

              <div className="flex flex-col items-center mx-4 flex-shrink-0">
                <div
                  className="flex-shrink-0 rounded-full border-2 mt-1"
                  style={{
                    width: 10, height: 10,
                    borderColor: "var(--accent-primary)",
                    background: "var(--bg-base)",
                    boxShadow: "0 0 6px var(--accent-glow)",
                  }}
                />
                {!isLast && (
                  <div
                    className="flex-1 w-px mt-1"
                    style={{
                      background: "linear-gradient(to bottom, var(--accent-edge), var(--border-subtle))",
                      minHeight: 28,
                    }}
                  />
                )}
              </div>

              <div className="flex-1 group" style={{ paddingBottom: isLast ? 0 : 20 }}>
                <div className="flex items-start gap-2">
                  <span
                    className="flex-1 text-sm font-medium text-text-secondary leading-snug"
                    style={{ textDecoration: "line-through", textDecorationColor: "var(--text-faint)" }}
                  >
                    {ls(entry.title)}
                  </span>
                  {/* Reopen button — visible on hover */}
                  <button
                    onClick={() => reopen(entry.id)}
                    title={t("today.reopen")}
                    className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-md px-2 py-0.5 text-[11px]"
                    style={{
                      color: "var(--text-faint)",
                      background: "transparent",
                      border: "1px solid var(--border-faint)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "var(--accent-primary)";
                      el.style.borderColor = "var(--accent-edge)";
                      el.style.background = "var(--accent-fog)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "var(--text-faint)";
                      el.style.borderColor = "var(--border-faint)";
                      el.style.background = "transparent";
                    }}
                  >
                    <IconUndo size={11} />
                    {t("today.reopen")}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {qChip && (
                    <span className={qChip} style={{ fontSize: 10, padding: "1px 7px" }}>
                      {entry.quadrant}
                    </span>
                  )}
                  <span className="text-[11px] tabular-nums text-text-faint">
                    {fmtDuration(entry.duration, locale)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function TodayPage() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const tasks = useTasksStore((s) => s.tasks);
  const completed = useTasksStore((s) => s.completed);
  const loading = useTasksStore((s) => s.loading);

  if (loading && tasks.length === 0) {
    return <div className="p-8 text-text-muted text-sm">Loading…</div>;
  }

  const incomplete = [...tasks]
    .filter((x) => !x.completed)
    .sort((a, b) => Q_PRIORITY[a.quadrant] - Q_PRIORITY[b.quadrant]);

  const top =
    incomplete.find((x) => x.today && x.quadrant === "Q1") ??
    incomplete.find((x) => x.quadrant === "Q1") ??
    incomplete[0];

  const todayRest = tasks
    .filter((x) => x.today && !x.completed && x.id !== top?.id)
    .sort((a, b) => Q_PRIORITY[a.quadrant] - Q_PRIORITY[b.quadrant]);

  const todayAllDone =
    tasks.filter((x) => x.today && !x.completed).length === 0 && completed.length > 0;

  if (!top && completed.length === 0) {
    return <TodayEmptyState />;
  }

  return (
    <div className="fade-in px-4 sm:px-8 py-6 sm:py-8">
      {!top && completed.length > 0 && (
        <AllDoneBanner />
      )}

      {top && (
        <>
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-3 flex items-center gap-2">
            {t("today.recommended")}
            {todayAllDone && (
              <span className="chip chip-ai">
                {locale === "zh" ? "来自待办" : "from backlog"}
              </span>
            )}
          </div>

          <ConvictionCard task={top} tasks={tasks} locale={locale} />
        </>
      )}

      {todayRest.length > 0 && (
        <section className="mt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-2">
            {t("today.plan")}
          </div>
          <div>
            {todayRest.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <CompletedTimeline entries={completed} locale={locale} />
      )}
    </div>
  );
}
