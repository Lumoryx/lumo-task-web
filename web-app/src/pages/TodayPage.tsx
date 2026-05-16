import { useNavigate } from "react-router-dom";
import { TaskRow } from "@/components/TaskRow";
import { LumoStatus } from "@/components/LumoStatus";
import { IconArrowRight } from "@/components/icons";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { fmtDuration } from "@/lib/format";
import type { CompletedEntry, Locale, Task } from "@/types/task";

const Q_PRIORITY: Record<Task["quadrant"], number> = {
  Q1: 0,
  Q2: 1,
  Q3: 2,
  Q4: 3,
  unclassified: 4,
};

const Q_CHIP: Record<string, string> = {
  Q1: "chip chip-q1",
  Q2: "chip chip-q2",
  Q3: "chip chip-q3",
  Q4: "chip chip-q4",
  unclassified: "chip chip-unclassified",
};

function fmtTime(iso: string | undefined, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function totalMinutes(entries: CompletedEntry[]) {
  return entries.reduce((s, c) => s + c.duration, 0);
}

// ─── Timeline ──────────────────────────────────────────────────────────────

interface TimelineProps {
  entries: CompletedEntry[];
  locale: Locale;
}

function CompletedTimeline({ entries, locale }: TimelineProps) {
  const ls = useLocaleString();
  const total = totalMinutes(entries);
  const totalLabel =
    total >= 60
      ? locale === "zh"
        ? `${Math.floor(total / 60)} 小时 ${total % 60} 分`
        : `${Math.floor(total / 60)}h ${total % 60}m`
      : locale === "zh"
      ? `${total} 分钟`
      : `${total} min`;

  // Sort chronologically by completedAt (oldest first for timeline top-to-bottom)
  const sorted = [...entries].sort((a, b) => {
    const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return ta - tb;
  });

  return (
    <section className="mt-10">
      {/* Header */}
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

      {/* Timeline */}
      <div className="flex flex-col">
        {sorted.map((entry, idx) => {
          const isLast = idx === sorted.length - 1;
          const timeStart = fmtTime(entry.startedAt, locale);
          const timeEnd = fmtTime(entry.completedAt, locale);
          const qChip = entry.quadrant ? Q_CHIP[entry.quadrant] ?? "chip chip-unclassified" : null;

          return (
            <div key={entry.id} className="flex gap-0">
              {/* Time column */}
              <div
                className="flex flex-col items-end gap-0.5 flex-shrink-0 pt-0.5"
                style={{ width: 72, minWidth: 72 }}
              >
                {timeStart && (
                  <span className="text-[11px] tabular-nums text-text-faint leading-none">
                    {timeStart}
                  </span>
                )}
                {timeEnd && timeEnd !== timeStart && (
                  <span className="text-[11px] tabular-nums text-text-muted leading-none">
                    {timeEnd}
                  </span>
                )}
              </div>

              {/* Spine + dot */}
              <div className="flex flex-col items-center mx-4 flex-shrink-0">
                {/* dot */}
                <div
                  className="flex-shrink-0 rounded-full border-2 mt-1"
                  style={{
                    width: 10,
                    height: 10,
                    borderColor: "var(--accent-primary)",
                    background: "var(--bg-base)",
                    boxShadow: "0 0 6px var(--accent-glow)",
                  }}
                />
                {/* connecting line */}
                {!isLast && (
                  <div
                    className="flex-1 w-px mt-1"
                    style={{
                      background:
                        "linear-gradient(to bottom, var(--accent-edge), var(--border-subtle))",
                      minHeight: 28,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-${isLast ? "0" : "5"}`} style={{ paddingBottom: isLast ? 0 : 20 }}>
                <div className="flex items-start gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium text-text-secondary leading-snug"
                    style={{ textDecoration: "line-through", textDecorationColor: "var(--text-faint)" }}
                  >
                    {ls(entry.title)}
                  </span>
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

/**
 * Today — hero recommendation card (pulls from all incomplete tasks, not
 * just today's list) + remaining today plan + completed-today timeline.
 */
export function TodayPage() {
  const navigate = useNavigate();
  const t = useT();
  const ls = useLocaleString();
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
    return (
      <div className="fade-in px-8 py-10">
        <div className="text-2xl font-semibold text-text-primary">{t("today.empty.title")}</div>
        <div className="mt-2 text-sm text-text-muted">{t("today.empty.sub")}</div>
      </div>
    );
  }

  const chipClass = top ? (Q_CHIP[top.quadrant] ?? "chip chip-unclassified") : "";

  return (
    <div className="fade-in px-8 py-8">
      {/* Recommendation card */}
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

          <article
            className="relative overflow-visible rounded-xl border bg-surface p-6"
            style={{
              borderColor: "var(--accent-edge)",
              boxShadow: "var(--shadow-lifted), 0 0 60px var(--accent-fog)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={chipClass}>{top.quadrant === "unclassified" ? "—" : top.quadrant}</span>
              {top.due && (
                <span className="text-xs text-text-muted">
                  {locale === "zh" ? "截止 " : "Due "}
                  {top.due === "today" ? (locale === "zh" ? "今天" : "today") : top.due}
                </span>
              )}
              {!top.today && (
                <span className="text-xs text-text-faint">
                  {locale === "zh" ? "待办清单" : "backlog"}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-semibold leading-snug text-text-primary tracking-tight">
              {ls(top.title)}
            </h2>

            {top.desc && (
              <p className="mt-2.5 text-sm leading-relaxed text-text-secondary max-w-[680px]">
                {ls(top.desc)}
              </p>
            )}

            {top.reason && (
              <div className="mt-5 px-3.5 py-3 rounded-md border border-border-faint bg-base">
                <LumoStatus text={ls(top.reason)} />
              </div>
            )}

            {top.next_step && (
              <div className="mt-4 text-sm text-text-secondary">
                <span className="text-text-faint">
                  {locale === "zh" ? "下一步 · " : "Next step · "}
                </span>
                {ls(top.next_step)}
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button className="btn btn-primary btn-lg" onClick={() => navigate("/focus")}>
                {t("today.start")} <IconArrowRight size={14} />
              </button>
              <div className="flex items-center gap-3 text-xs text-text-muted tabular-nums">
                <span>{fmtDuration(top.duration, locale)}</span>
                <span className="pip">
                  {Array.from({ length: top.pomos_total }).map((_, i) => (
                    <i key={i} className={i < top.pomos_done ? "on" : ""} />
                  ))}
                </span>
              </div>
            </div>
          </article>
        </>
      )}

      {/* Rest of today's plan */}
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

      {/* Completed today — timeline */}
      {completed.length > 0 && (
        <CompletedTimeline entries={completed} locale={locale} />
      )}
    </div>
  );
}
