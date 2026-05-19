import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore, type Accent, type Density } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useAIStore } from "@/store/useAIStore";
import { api } from "@/api/client";
import { useT } from "@/i18n/useT";
import type { Locale, Person } from "@/types/task";
import { PERSON_COLORS } from "@/mocks/people";

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
  const { people, create: createPerson, update: updatePerson, remove: removePerson } = usePeopleStore();

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

      <MembersGroup
        people={people}
        onCreate={createPerson}
        onUpdate={updatePerson}
        onRemove={removePerson}
        t={t}
      />

      <AIConfigGroup t={t} locale={locale} />

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

/* ── Members management ───────────────────────────────────────────── */

type PersonDraft = { name: string; email: string; initials: string; color: string };

function emptyDraft(): PersonDraft {
  return { name: "", email: "", initials: "", color: PERSON_COLORS[0] };
}

function deriveInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function MembersGroup({
  people,
  onCreate,
  onUpdate,
  onRemove,
  t,
}: {
  people: Person[];
  onCreate: (input: Omit<Person, "id">) => Promise<Person>;
  onUpdate: (id: string, patch: Partial<Omit<Person, "id">>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  t: (key: string) => string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<PersonDraft>(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PersonDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);

  function startEdit(person: Person) {
    setEditId(person.id);
    setEditDraft({ name: person.name, email: person.email ?? "", initials: person.initials, color: person.color });
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit() {
    if (!editId || !editDraft.name.trim()) return;
    setBusy(true);
    try {
      await onUpdate(editId, {
        name: editDraft.name.trim(),
        email: editDraft.email.trim() || undefined,
        initials: editDraft.initials || deriveInitials(editDraft.name),
        color: editDraft.color,
      });
      setEditId(null);
    } finally {
      setBusy(false);
    }
  }

  async function saveNew() {
    if (!draft.name.trim()) return;
    setBusy(true);
    try {
      await onCreate({
        name: draft.name.trim(),
        email: draft.email.trim() || undefined,
        initials: draft.initials || deriveInitials(draft.name),
        color: draft.color,
      });
      setDraft(emptyDraft());
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-2 pl-0.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
          {t("settings.members")}
        </h3>
        {!adding && (
          <button
            className="text-[11px] text-accent-primary font-medium"
            style={{ color: "var(--accent-primary)" }}
            onClick={() => { setAdding(true); setDraft(emptyDraft()); }}
          >
            + {t("settings.members.add")}
          </button>
        )}
      </div>

      <div className="rounded-[10px] border bg-surface overflow-hidden" style={{ borderColor: "var(--border-default)" }}>
        {people.length === 0 && !adding && (
          <div className="px-5 py-4 text-[12px] text-text-muted italic">{t("settings.members.empty")}</div>
        )}

        {people.map((person) => (
          <div key={person.id} className="border-t border-border-faint first:border-t-0">
            {editId === person.id ? (
              <PersonForm
                draft={editDraft}
                onChange={setEditDraft}
                onSave={saveEdit}
                onCancel={cancelEdit}
                busy={busy}
                t={t}
              />
            ) : (
              <div className="flex items-center gap-3 px-5 py-3">
                <PersonAvatar person={person} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-primary">{person.name}</div>
                  {person.email && (
                    <div className="text-[11px] text-text-muted mt-0.5">{person.email}</div>
                  )}
                </div>
                <button
                  className="text-[11px] text-text-muted hover:text-text-primary transition-colors mr-3"
                  onClick={() => startEdit(person)}
                >
                  {t("settings.members.edit")}
                </button>
                <button
                  className="text-[11px] text-text-muted hover:text-status-urgent transition-colors"
                  style={{ "--hover-color": "var(--status-urgent)" } as React.CSSProperties}
                  onClick={() => onRemove(person.id)}
                >
                  {t("settings.members.delete")}
                </button>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="border-t border-border-faint first:border-t-0">
            <PersonForm
              draft={draft}
              onChange={setDraft}
              onSave={saveNew}
              onCancel={() => setAdding(false)}
              busy={busy}
              t={t}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ── AI Config section ────────────────────────────────────────────── */

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  deepseek: "DeepSeek",
  claude: "Claude",
  custom: "Custom",
};
const PROVIDER_DEFAULTS: Record<string, { model: string; baseUrl: string }> = {
  openai:   { model: "gpt-4o-mini",    baseUrl: "https://api.openai.com/v1" },
  deepseek: { model: "deepseek-chat",  baseUrl: "https://api.deepseek.com" },
  claude:   { model: "claude-3-5-haiku-20241022", baseUrl: "" },
  custom:   { model: "",               baseUrl: "" },
};

function AIConfigGroup({ t, locale }: { t: (k: string) => string; locale: string }) {
  const { config, saveConfig } = useAIStore();

  const [provider, setProvider] = useState(config.provider);
  const [apiKey, setApiKey]     = useState("");   // always empty — never pre-filled with real key
  const [model, setModel]       = useState(config.model ?? "");
  const [baseUrl, setBaseUrl]   = useState(config.baseUrl ?? "");
  const [showKey, setShowKey]   = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "fail" | "loading">("idle");
  const [saved, setSaved]       = useState(false);

  const isCustom = provider === "custom";
  const isClaude = provider === "claude";
  const hasKey   = config.apiKeySet || apiKey.trim().length > 0;

  async function handleSave() {
    await saveConfig({
      provider,
      ...(apiKey.trim() ? { newApiKey: apiKey.trim() } : {}),
      model: model.trim() || null,
      baseUrl: baseUrl.trim() || null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    setTestStatus("loading");
    try {
      await api.patchSettings({
        ai_provider: provider,
        ...(apiKey.trim() ? { ai_api_key: apiKey.trim() } : {}),
        ai_model: model.trim() || null,
        ai_base_url: baseUrl.trim() || null,
      });
      const res = await api.petChat({
        messages: [{ role: "user", content: "ping" }],
        context: { locale, userName: "Test" },
      });
      setTestStatus(res.fallback ? "fail" : "ok");
    } catch {
      setTestStatus("fail");
    }
  }

  const placeholderModel = PROVIDER_DEFAULTS[provider]?.model ?? "";
  const placeholderUrl   = PROVIDER_DEFAULTS[provider]?.baseUrl ?? "";

  return (
    <section className="mb-7">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint mb-2 pl-0.5">
        {t("ai.config.title")}
      </h3>
      <div className="rounded-[10px] border bg-surface overflow-hidden flex flex-col" style={{ borderColor: "var(--border-default)" }}>

        {/* Provider row */}
        <div className="grid items-center px-5 py-4 border-t border-border-faint first:border-t-0"
          style={{ gridTemplateColumns: "220px 1fr", gap: 36 }}>
          <div className="text-[13px] font-medium text-text-primary">{t("ai.config.provider")}</div>
          <div className="flex gap-1.5 flex-wrap">
            {(["openai", "deepseek", "claude", "custom"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProvider(p);
                  setModel(PROVIDER_DEFAULTS[p]?.model ?? "");
                  setBaseUrl(PROVIDER_DEFAULTS[p]?.baseUrl ?? "");
                }}
                className="px-3 h-[28px] text-[12px] rounded-md border transition-colors"
                style={{
                  background: provider === p ? "var(--accent-fog)" : "var(--bg-surface)",
                  borderColor: provider === p ? "var(--accent-edge)" : "var(--border-default)",
                  color: provider === p ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: provider === p ? 600 : 400,
                }}
              >
                {PROVIDER_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* API Key row */}
        <div className="grid items-center px-5 py-4 border-t border-border-faint"
          style={{ gridTemplateColumns: "220px 1fr", gap: 36 }}>
          <div>
            <div className="text-[13px] font-medium text-text-primary">{t("ai.config.apiKey")}</div>
            {config.apiKeySet && !apiKey && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-primary)" }} />
                <span className="text-[11px]" style={{ color: "var(--accent-primary)" }}>
                  {locale === "zh" ? "已配置" : "Configured"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.apiKeySet ? (locale === "zh" ? "输入新 Key 以替换" : "Enter new key to replace") : (isClaude ? "sk-ant-..." : "sk-...")}
              className="input flex-1"
              style={{ height: 34, fontSize: 13 }}
            />
            {apiKey && (
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-text-muted hover:text-text-primary transition-colors px-1.5"
              >
                {showKey ? (locale === "zh" ? "隐藏" : "Hide") : (locale === "zh" ? "显示" : "Show")}
              </button>
            )}
          </div>
        </div>

        {/* Model row */}
        <div className="grid items-center px-5 py-4 border-t border-border-faint"
          style={{ gridTemplateColumns: "220px 1fr", gap: 36 }}>
          <div className="text-[13px] font-medium text-text-primary">{t("ai.config.model")}</div>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={placeholderModel}
            className="input"
            style={{ height: 34, fontSize: 13 }}
          />
        </div>

        {/* Base URL (custom + deepseek override) */}
        {(isCustom || isClaude === false) && (
          <div className="grid items-center px-5 py-4 border-t border-border-faint"
            style={{ gridTemplateColumns: "220px 1fr", gap: 36 }}>
            <div>
              <div className="text-[13px] font-medium text-text-primary">{t("ai.config.baseUrl")}</div>
              <div className="text-[11px] text-text-muted mt-0.5">{locale === "zh" ? "留空用默认地址" : "Leave blank for default"}</div>
            </div>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={placeholderUrl || "https://..."}
              className="input"
              style={{ height: 34, fontSize: 13 }}
            />
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border-faint">
          <button
            onClick={handleTest}
            disabled={!hasKey || testStatus === "loading"}
            className="btn btn-secondary"
            style={{ height: 32, fontSize: 12 }}
          >
            {testStatus === "loading"
              ? (locale === "zh" ? "测试中..." : "Testing...")
              : t("ai.config.test")}
          </button>
          {testStatus === "ok" && (
            <span className="text-[12px] font-medium" style={{ color: "var(--accent-primary)" }}>
              ✓ {t("ai.config.test.ok")}
            </span>
          )}
          {testStatus === "fail" && (
            <span className="text-[12px] font-medium" style={{ color: "var(--status-urgent)" }}>
              ✗ {t("ai.config.test.fail")}
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ height: 32, fontSize: 12 }}
          >
            {saved ? t("ai.config.saved") : t("ai.config.save")}
          </button>
        </div>

      </div>
    </section>
  );
}

function PersonForm({
  draft,
  onChange,
  onSave,
  onCancel,
  busy,
  t,
}: {
  draft: PersonDraft;
  onChange: (d: PersonDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* Avatar preview */}
        <PersonAvatar
          person={{ name: draft.name, initials: draft.initials || deriveInitials(draft.name) || "?", color: draft.color }}
          size={36}
        />
        <div className="flex-1 grid grid-cols-2 gap-2">
          <input
            autoFocus
            placeholder={t("settings.members.name")}
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value;
              onChange({ ...draft, name, initials: deriveInitials(name) });
            }}
            className="input"
            style={{ height: 34, fontSize: 13 }}
          />
          <input
            placeholder={t("settings.members.email") + " (optional)"}
            value={draft.email}
            onChange={(e) => onChange({ ...draft, email: e.target.value })}
            className="input"
            style={{ height: 34, fontSize: 13 }}
          />
          <input
            placeholder={t("settings.members.initials")}
            value={draft.initials}
            maxLength={2}
            onChange={(e) => onChange({ ...draft, initials: e.target.value.toUpperCase() })}
            className="input"
            style={{ height: 34, fontSize: 13 }}
          />
          <div className="flex items-center gap-1.5">
            {PERSON_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChange({ ...draft, color: c })}
                className="rounded-full transition-transform flex-shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  background: c,
                  outline: draft.color === c ? "2px solid var(--text-primary)" : "1px solid transparent",
                  outlineOffset: 2,
                  transform: draft.color === c ? "scale(1.1)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel} disabled={busy} style={{ height: 30, fontSize: 12 }}>
          {t("settings.members.cancel")}
        </button>
        <button
          className="btn btn-primary"
          onClick={onSave}
          disabled={busy || !draft.name.trim()}
          style={{ height: 30, fontSize: 12 }}
        >
          {t("settings.members.save")}
        </button>
      </div>
    </div>
  );
}

export function PersonAvatar({ person, size = 24 }: { person: Pick<Person, "initials" | "color" | "name">; size?: number }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold select-none"
      title={person.name}
      style={{
        width: size,
        height: size,
        background: person.color,
        color: "#0d1210",
        fontSize: Math.round(size * 0.4),
        letterSpacing: "-0.02em",
      }}
    >
      {person.initials}
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
