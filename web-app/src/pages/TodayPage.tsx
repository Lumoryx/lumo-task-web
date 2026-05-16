import { useNavigate } from "react-router-dom";
import { TaskRow } from "@/components/TaskRow";
import { LumoStatus } from "@/components/LumoStatus";
import { IconArrowRight, IconCheck } from "@/components/icons";
import { useT, useLocaleString } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { fmtDuration } from "@/lib/format";

/**
 * Today — the hero recommendation card + the rest of today's plan +
 * completed-today log.
 */
export function TodayPage() {
  const navigate = useNavigate();
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const tasks = useTasksStore((s) => s.tasks);
  const completed = useTasksStore((s) => s.completed);
  const loading = useTasksStore((s) => s.loading);

  const today = tasks.filter((x) => x.today && !x.completed);
  const top = today.find((x) => x.quadrant === "Q1") ?? today[0];
  const rest = today.filter((x) => x.id !== top?.id);

  if (loading && tasks.length === 0) {
    return <div className="p-8 text-text-muted text-sm">Loading…</div>;
  }

  if (!top) {
    return (
      <div className="fade-in px-8 py-10 max-w-3xl mx-auto">
        <div className="text-2xl font-semibold text-text-primary">{t("today.empty.title")}</div>
        <div className="mt-2 text-sm text-text-muted">{t("today.empty.sub")}</div>
      </div>
    );
  }

  return (
    <div className="fade-in px-8 py-8 max-w-[920px] mx-auto">
      {/* Recommendation card */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-3">
        {t("today.recommended")}
      </div>

      <article
        className="relative overflow-visible rounded-xl border bg-surface p-6"
        style={{
          borderColor: "var(--accent-edge)",
          boxShadow: "var(--shadow-lifted), 0 0 60px var(--accent-fog)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="chip chip-q1">Q1</span>
          {top.due && (
            <span className="text-xs text-text-muted">
              {locale === "zh" ? "截止 " : "Due "}
              {top.due === "today" ? (locale === "zh" ? "今天" : "today") : top.due}
            </span>
          )}
        </div>

        <h2 className="text-2xl font-semibold leading-snug text-text-primary tracking-tight">
          {ls(top.title)}
        </h2>

        {top.desc && (
          <p className="mt-2.5 text-sm leading-relaxed text-text-secondary max-w-[620px]">
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

      {/* Rest of today */}
      {rest.length > 0 && (
        <section className="mt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-2">
            {t("today.plan")}
          </div>
          <div>
            {rest.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="mt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-2">
            {t("today.completed")}
          </div>
          <div className="flex flex-col gap-1.5">
            {completed.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 py-2 text-sm text-text-muted line-through decoration-text-faint"
              >
                <IconCheck size={14} />
                <span className="flex-1">{ls(c.title)}</span>
                <span className="text-xs tabular-nums">{fmtDuration(c.duration, locale)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
