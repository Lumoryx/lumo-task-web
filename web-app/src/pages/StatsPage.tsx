import { useEffect, useState } from "react";
import { IconStats } from "@/components/icons";
import { useT } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";
import { selectIsSignedIn, useAuthStore } from "@/store/useAuthStore";
import { useHabitsStore } from "@/store/useHabitsStore";
import { api } from "@/api/client";
import type { CompletedEntry } from "@/types/task";
import { computeWeekStats, computeAllTimeStats, fmtHour } from "@/utils/stats";
import { currentStreak as habitStreak } from "@/utils/habits";
import { useNavigate } from "react-router-dom";

const DAY_KEYS = ["stats.day.sun","stats.day.mon","stats.day.tue","stats.day.wed","stats.day.thu","stats.day.fri","stats.day.sat"];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-surface border border-border-faint min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-faint">{label}</span>
      <span className="text-[28px] font-bold text-text-primary leading-none tabular-nums" style={{ color: "var(--accent-primary)" }}>
        {value}
      </span>
      {sub && <span className="text-[11px] text-text-muted">{sub}</span>}
    </div>
  );
}

export function StatsPage() {
  const t = useT();
  const navigate = useNavigate();
  const locale = useAppStore((s) => s.locale);
  const isSignedIn = useAuthStore(selectIsSignedIn);
  const userName = useAuthStore((s) => s.user.name);
  const { habits, logs: habitLogs } = useHabitsStore();
  const [entries, setEntries] = useState<CompletedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    api.listAllCompleted().then((data) => {
      setEntries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
          <IconStats size={28} />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-text-primary">{t("auth.required.title")}</h2>
          <p className="mt-1 text-[13px] text-text-muted max-w-xs">Sign in to view your productivity stats.</p>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-text-inverse transition-opacity hover:opacity-90"
          style={{ background: "var(--accent-primary)" }}
        >
          {t("auth.login.btn")}
        </button>
      </div>
    );
  }

  const week = computeWeekStats(entries);
  const allTime = computeAllTimeStats(entries);

  // Best habit streak across all habits
  const bestHabitStreak = habits.length > 0
    ? Math.max(...habits.map((h) => habitStreak(h, habitLogs)))
    : 0;

  const focusHours = (week.focusMinutes / 60).toFixed(1);
  const allFocusHours = (allTime.focusMinutes / 60).toFixed(0);

  // Week range label
  const weekLabel = `${week.weekStart.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" })} – ${week.weekEnd.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}`;

  const maxDay = Math.max(...week.byDay, 1);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary">{t("stats.title")}</h1>
          <p className="text-[13px] text-text-muted mt-0.5">{t("stats.sub")}</p>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {loading ? (
          <div className="text-center py-16 text-text-muted text-[13px]">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-[13px]">{t("stats.empty")}</div>
        ) : (
          <>
            {/* Week stats */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-text-secondary">{t("stats.week")}</h2>
                <span className="text-[12px] text-text-faint">{weekLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label={t("stats.tasks")}
                  value={week.tasksCompleted}
                  sub={`${week.q1Tasks} Q1`}
                />
                <StatCard
                  label={t("stats.focus")}
                  value={`${focusHours}${t("stats.hours")}`}
                  sub={`${week.focusMinutes} ${t("stats.mins")}`}
                />
                <StatCard
                  label={t("stats.streak")}
                  value={allTime.currentStreak}
                  sub={t("stats.days")}
                />
                {week.peakHour !== null && (
                  <StatCard
                    label={t("stats.peak")}
                    value={fmtHour(week.peakHour)}
                  />
                )}
              </div>

              {/* Daily bar chart */}
              <div className="mt-4 p-4 rounded-xl bg-surface border border-border-faint">
                <div className="flex items-end gap-2 h-16">
                  {week.byDay.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: count === 0 ? 2 : `${Math.max(8, (count / maxDay) * 52)}px`,
                          background: count > 0 ? "var(--accent-primary)" : "var(--bg-elevated)",
                          opacity: count > 0 ? 1 : 0.4,
                        }}
                      />
                      <span className="text-[9px] text-text-faint">{t(DAY_KEYS[i])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* All-time + habit streak */}
            <section>
              <h2 className="text-[13px] font-semibold text-text-secondary mb-3">{t("stats.alltime")}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label={t("stats.tasks")} value={allTime.tasksCompleted} />
                <StatCard label={t("stats.focus")} value={`${allFocusHours}${t("stats.hours")}`} />
                <StatCard label={t("stats.best")} value={allTime.bestStreak} sub={t("stats.days")} />
                {bestHabitStreak > 0 && (
                  <StatCard label="🔥 Habit" value={bestHabitStreak} sub={t("stats.days")} />
                )}
              </div>
            </section>

            {/* Share card */}
            <section>
              <div
                className="relative rounded-2xl p-6 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)",
                  border: "1px solid var(--accent-edge)",
                  boxShadow: "0 0 40px var(--accent-fog)",
                }}
              >
                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 20%, var(--accent-glow) 0%, transparent 60%)", opacity: 0.3 }} />

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-faint mb-1">Lumo Task</div>
                      <div className="text-[16px] font-bold text-text-primary">{t("stats.share.title")}</div>
                      <div className="text-[12px] text-text-muted mt-0.5">{weekLabel} · {userName}</div>
                    </div>
                    <div className="text-3xl">🌟</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-[24px] font-bold" style={{ color: "var(--accent-primary)" }}>{week.tasksCompleted}</div>
                      <div className="text-[10px] text-text-faint mt-0.5">{t("stats.tasks")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[24px] font-bold" style={{ color: "var(--accent-primary)" }}>{focusHours}<span className="text-[14px]">h</span></div>
                      <div className="text-[10px] text-text-faint mt-0.5">{t("stats.focus")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[24px] font-bold" style={{ color: "var(--accent-primary)" }}>🔥{allTime.currentStreak}</div>
                      <div className="text-[10px] text-text-faint mt-0.5">{t("stats.streak")}</div>
                    </div>
                  </div>

                  {/* Mini heatmap */}
                  <div className="flex items-end gap-1.5 mb-4">
                    {week.byDay.map((count, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full rounded-sm"
                          style={{
                            height: count === 0 ? 3 : `${Math.max(6, (count / maxDay) * 28)}px`,
                            background: count > 0 ? "var(--accent-primary)" : "var(--bg-deep, var(--bg-elevated))",
                            opacity: count > 0 ? 0.8 + (count / maxDay) * 0.2 : 0.3,
                          }}
                        />
                        <span className="text-[8px] text-text-faint">{t(DAY_KEYS[i])}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-[11px] font-medium" style={{ color: "var(--accent-primary)" }}>
                    {t("stats.share.hint")}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
