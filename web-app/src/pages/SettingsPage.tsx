import { useNavigate } from "react-router-dom";
import { useAppStore, type Accent, type Density } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useT } from "@/i18n/useT";
import type { Locale } from "@/types/task";

const ACCENT_SWATCHES: Array<{ id: Accent; hex: string; label: string }> = [
  { id: "green", hex: "#3DFFA0", label: "Lumo Green" },
  { id: "cyan", hex: "#38D4D4", label: "Calm Cyan" },
  { id: "amber", hex: "#FFAA44", label: "Warm Amber" },
  { id: "graphite", hex: "#A0ADB0", label: "Graphite" },
];

/**
 * Settings — appearance / language / data reset.
 *
 * Each row uses the same grid pattern: label left, control right.
 */
export function SettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { accent, setAccent, density, setDensity, reducedMotion, setReducedMotion, locale, setLocale, setOnboarded } =
    useAppStore();
  const reset = useTasksStore((s) => s.reset);

  return (
    <div className="fade-in px-8 py-8 max-w-[760px] mx-auto">
      <Group title={t("settings.appearance")}>
        <Row label={t("settings.accent")}>
          <div className="flex gap-2">
            {ACCENT_SWATCHES.map((sw) => (
              <button
                key={sw.id}
                onClick={() => setAccent(sw.id)}
                title={sw.label}
                className="flex items-center justify-center rounded-full transition-transform"
                style={{
                  width: 28,
                  height: 28,
                  background: sw.hex,
                  outline: accent === sw.id ? "2px solid var(--text-primary)" : "1px solid var(--border-default)",
                  outlineOffset: 2,
                  transform: accent === sw.id ? "scale(1.05)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </Row>

        <Row label={t("settings.density")}>
          <Segmented<Density>
            value={density}
            options={[
              { value: "comfortable", label: t("settings.density.comfy") },
              { value: "compact", label: t("settings.density.compact") },
            ]}
            onChange={setDensity}
          />
        </Row>

        <Row label={t("settings.reducedMotion")}>
          <Toggle value={reducedMotion} onChange={setReducedMotion} />
        </Row>
      </Group>

      <Group title={t("settings.language")}>
        <Row label={t("settings.language")}>
          <Segmented<Locale>
            value={locale}
            options={[
              { value: "en", label: "English" },
              { value: "zh", label: "中文" },
            ]}
            onChange={setLocale}
          />
        </Row>
      </Group>

      <Group title="Data">
        <Row label={t("settings.resetData")} helper="Restores the seed tasks. Clears your local edits.">
          <button className="btn btn-secondary" onClick={() => reset()}>
            Reset
          </button>
        </Row>
        <Row
          label={t("settings.replayOnboarding")}
          helper="Walk through the welcome flow again."
        >
          <button
            className="btn btn-secondary"
            onClick={() => {
              setOnboarded(false);
              navigate("/onboarding");
            }}
          >
            Replay
          </button>
        </Row>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-2 pl-0.5">
        {title}
      </h3>
      <div className="rounded-[10px] border bg-surface overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid items-center px-5 py-4 border-t border-border-faint first:border-t-0"
      style={{ gridTemplateColumns: "220px 1fr", gap: 36 }}
    >
      <div>
        <div className="text-[13px] font-medium text-text-primary leading-snug">{label}</div>
        {helper && (
          <div className="text-[11.5px] text-text-muted mt-1 leading-relaxed max-w-[360px]">{helper}</div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="inline-flex p-[3px] gap-0.5 rounded-lg border bg-deep"
      style={{ borderColor: "var(--border-default)" }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="px-4 h-[30px] text-xs font-medium rounded-[5px] transition-colors whitespace-nowrap"
            style={{
              background: on ? "var(--bg-elevated)" : "transparent",
              color: on ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: on ? "inset 0 0 0 1px var(--border-default), 0 1px 2px rgba(0,0,0,0.4)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative rounded-full transition-colors"
      style={{
        width: 36,
        height: 20,
        background: value ? "var(--accent-primary)" : "var(--border-default)",
      }}
    >
      <span
        className="absolute top-0.5 rounded-full bg-text-primary transition-all"
        style={{
          width: 16,
          height: 16,
          left: value ? 18 : 2,
          background: value ? "var(--text-inverse)" : "var(--text-primary)",
        }}
      />
    </button>
  );
}
