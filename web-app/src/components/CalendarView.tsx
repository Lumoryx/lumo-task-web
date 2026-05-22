import { useState } from "react";
import { useTasksStore } from "@/store/useTasksStore";
import { useAppStore } from "@/store/useAppStore";
import { useT, useLocaleString } from "@/i18n/useT";
import type { Task, Locale } from "@/types/task";
import { fmtDuration, parseDueISO, toISODate } from "@/lib/format";
import { TaskDetailModal } from "./TaskDetailModal";
import { IconCheck } from "./icons";

const DND_MIME = "application/x-lumo-task";

/* ── Date helpers ────────────────────────────────────────────────── */

interface WeekDay {
  date: Date;
  iso: string;
  isToday: boolean;
}

function getWeekDays(weekOffset: number): WeekDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISODate(today);
  // Week starts on Monday
  const dow = today.getDay(); // 0=Sun
  const daysFromMon = (dow + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMon + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISODate(d);
    return { date: d, iso, isToday: iso === todayISO };
  });
}

const EN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function weekRangeLabel(days: WeekDay[], locale: Locale): string {
  const first = days[0].date;
  const last = days[6].date;
  if (locale === "zh") {
    const y = first.getFullYear();
    if (first.getMonth() === last.getMonth()) {
      return `${y}年${first.getMonth() + 1}月${first.getDate()}–${last.getDate()}日`;
    }
    return `${y}年${first.getMonth() + 1}月${first.getDate()}日–${last.getMonth() + 1}月${last.getDate()}日`;
  }
  if (first.getMonth() === last.getMonth()) {
    return `${EN_MONTHS[first.getMonth()]} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
  }
  return `${EN_MONTHS[first.getMonth()]} ${first.getDate()} – ${EN_MONTHS[last.getMonth()]} ${last.getDate()}, ${first.getFullYear()}`;
}

// Day abbreviations keyed by getDay() value (0=Sun)
const DAY_ABBR: Record<number, Record<Locale, string>> = {
  0: { en: "Sun", zh: "日" },
  1: { en: "Mon", zh: "一" },
  2: { en: "Tue", zh: "二" },
  3: { en: "Wed", zh: "三" },
  4: { en: "Thu", zh: "四" },
  5: { en: "Fri", zh: "五" },
  6: { en: "Sat", zh: "六" },
};

/* ── Main CalendarView component ─────────────────────────────────── */

export function CalendarView() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const tasks = useTasksStore((s) => s.tasks);
  const update = useTasksStore((s) => s.update);

  const [weekOffset, setWeekOffset] = useState(0);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [overUnscheduled, setOverUnscheduled] = useState(false);

  const days = getWeekDays(weekOffset);

  // Partition active tasks into day buckets or unscheduled
  const dayBuckets = new Map<string, Task[]>();
  days.forEach((d) => dayBuckets.set(d.iso, []));
  const unscheduled: Task[] = [];

  for (const task of tasks) {
    if (task.completed) continue;
    const iso = parseDueISO(task.due);
    if (iso && dayBuckets.has(iso)) {
      dayBuckets.get(iso)!.push(task);
    } else {
      unscheduled.push(task);
    }
  }

  function dayDropHandlers(iso: string) {
    return {
      onDragOver: (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes(DND_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOverDay(iso);
      },
      onDragLeave: () => setOverDay(null),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setOverDay(null);
        const id = e.dataTransfer.getData(DND_MIME);
        if (id) update(id, { due: iso });
      },
    };
  }

  const unscheduledDrop = {
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DND_MIME)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverUnscheduled(true);
    },
    onDragLeave: () => setOverUnscheduled(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOverUnscheduled(false);
      const id = e.dataTransfer.getData(DND_MIME);
      if (id) update(id, { due: null });
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div
        className="flex items-center gap-2 px-7 py-2.5 flex-shrink-0 border-b"
        style={{ borderColor: "var(--border-faint)" }}
      >
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="btn btn-ghost text-[12px] px-2.5 py-1"
          aria-label={t("calendar.prev")}
        >
          ← {t("calendar.prev")}
        </button>

        <span className="flex-1 text-center text-[13px] font-medium text-text-primary tabular-nums select-none">
          {weekRangeLabel(days, locale)}
        </span>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="btn btn-ghost text-[12px] px-2.5 py-1"
          aria-label={t("calendar.next")}
        >
          {t("calendar.next")} →
        </button>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="btn btn-secondary text-[11px] px-2.5 py-1"
          >
            {t("calendar.today.btn")}
          </button>
        )}
      </div>

      {/* Calendar grid: unscheduled panel + 7 day columns */}
      <div className="flex flex-1 min-h-0 overflow-x-auto">
        {/* Unscheduled / No-date panel */}
        <div
          {...unscheduledDrop}
          className="flex flex-col border-r flex-shrink-0 min-h-0 transition-colors"
          style={{
            width: 152,
            borderColor: "var(--border-faint)",
            background: overUnscheduled ? "var(--accent-fog)" : "transparent",
          }}
        >
          <div
            className="px-3 pt-3 pb-2 border-b flex-shrink-0"
            style={{ borderColor: "var(--border-faint)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-faint">
              {t("calendar.unscheduled")}
            </span>
            {unscheduled.length > 0 && (
              <span className="ml-1.5 text-[10px] text-text-muted">{unscheduled.length}</span>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1">
            {unscheduled.length === 0 ? (
              <div className="text-[11px] text-text-faint italic px-1 py-2">
                {overUnscheduled ? t("calendar.unscheduled.hint") : "—"}
              </div>
            ) : (
              unscheduled.map((task) => <UnscheduledChip key={task.id} task={task} />)
            )}
          </div>
        </div>

        {/* 7 day columns */}
        {days.map((day) => {
          const dayTasks = dayBuckets.get(day.iso) ?? [];
          const abbr = DAY_ABBR[day.date.getDay()][locale];
          const isOver = overDay === day.iso;

          return (
            <div
              key={day.iso}
              {...dayDropHandlers(day.iso)}
              className="flex flex-col flex-1 min-w-0 border-r min-h-0 transition-colors"
              style={{
                minWidth: 100,
                borderColor: "var(--border-faint)",
                background: isOver
                  ? "var(--accent-fog)"
                  : day.isToday
                  ? "rgba(61,255,160,0.03)"
                  : "transparent",
              }}
            >
              {/* Day header */}
              <div
                className="flex flex-col items-center py-2.5 border-b gap-0.5 flex-shrink-0"
                style={{ borderColor: "var(--border-faint)" }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: day.isToday ? "var(--accent-primary)" : "var(--text-faint)" }}
                >
                  {abbr}
                </span>
                <span
                  className="flex items-center justify-center rounded-full text-[13px] font-semibold tabular-nums leading-none"
                  style={{
                    width: 26,
                    height: 26,
                    background: day.isToday ? "var(--accent-primary)" : "transparent",
                    color: day.isToday ? "var(--bg-base)" : "var(--text-primary)",
                  }}
                >
                  {day.date.getDate()}
                </span>
              </div>

              {/* Task list */}
              <div className="flex-1 min-h-0 overflow-y-auto p-1.5 flex flex-col gap-1">
                {dayTasks.length === 0 && isOver && (
                  <div className="text-[11px] text-text-faint italic px-1 py-1">
                    {t("calendar.drop.here")}
                  </div>
                )}
                {dayTasks.map((task) => (
                  <CalTaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Drag helper shared between chip and card ─────────────────────── */

function makeDragProps(taskId: string) {
  return {
    draggable: true as const,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(DND_MIME, taskId);
      (e.currentTarget as HTMLElement).style.opacity = "0.4";
    },
    onDragEnd: (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.opacity = "1";
    },
  };
}

/* ── Unscheduled panel chip ──────────────────────────────────────── */

function UnscheduledChip({ task }: { task: Task }) {
  const ls = useLocaleString();
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        {...makeDragProps(task.id)}
        onClick={() => setDetailOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-grab active:cursor-grabbing text-[11px] text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
        style={{ borderColor: "var(--border-faint)", background: "var(--bg-subtle)" }}
      >
        <span className={`qdot qdot-${task.quadrant.toLowerCase()}`} />
        <span className="truncate">{ls(task.title)}</span>
      </div>
      {detailOpen && <TaskDetailModal task={task} onClose={() => setDetailOpen(false)} />}
    </>
  );
}

/* ── Task card in day column ─────────────────────────────────────── */

const Q_BAR_COLOR: Record<string, string> = {
  Q1: "var(--q1-color)",
  Q2: "var(--q2-color)",
  Q3: "var(--q3-color)",
  Q4: "var(--q4-color)",
  unclassified: "var(--text-faint)",
};

function CalTaskCard({ task }: { task: Task }) {
  const t = useT();
  const ls = useLocaleString();
  const locale = useAppStore((s) => s.locale);
  const complete = useTasksStore((s) => s.complete);

  const [hovered, setHovered] = useState(false);
  const [circleHover, setCircleHover] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        {...makeDragProps(task.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-stretch gap-1.5 rounded-md cursor-grab active:cursor-grabbing transition-all"
        style={{
          background: hovered ? "var(--bg-elevated)" : "var(--bg-subtle)",
          border: `1px solid ${hovered ? "var(--border-default)" : "var(--border-faint)"}`,
          minHeight: 38,
          padding: "5px 6px",
        }}
      >
        {/* Quadrant accent bar */}
        <div
          className="flex-shrink-0 rounded-full self-stretch"
          style={{ width: 3, background: Q_BAR_COLOR[task.quadrant] }}
        />

        {/* Content — click opens detail */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setDetailOpen(true)}
        >
          <div
            className="text-[11px] font-medium text-text-primary leading-snug"
            style={{ wordBreak: "break-word" }}
          >
            {ls(task.title)}
          </div>
          {task.duration > 0 && (
            <div className="text-[10px] text-text-faint mt-0.5 tabular-nums">
              {fmtDuration(task.duration, locale)}
            </div>
          )}
        </div>

        {/* Complete circle (visible on hover) */}
        <button
          onMouseEnter={() => setCircleHover(true)}
          onMouseLeave={() => setCircleHover(false)}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            complete(task.id);
          }}
          aria-label={t("row.complete")}
          className="flex-shrink-0 flex items-center justify-center w-[14px] h-[14px] rounded-full border self-start mt-0.5 transition-all"
          style={{
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
            borderColor: circleHover ? "var(--accent-primary)" : "var(--border-strong)",
            background: circleHover ? "var(--accent-fog)" : "transparent",
            color: "var(--accent-primary)",
            cursor: "default",
          }}
        >
          {circleHover && <IconCheck size={8} strokeWidth={2.5} />}
        </button>
      </div>

      {detailOpen && <TaskDetailModal task={task} onClose={() => setDetailOpen(false)} />}
    </>
  );
}
