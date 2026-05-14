// settings.jsx — Lumo Task Settings (AI / Appearance / Sync / Privacy / Account)

const SETTINGS_SECTIONS = ["account", "ai", "appearance", "sync", "privacy"];

// Group of rows — one bordered card with thin internal dividers
function SettingsPanel({ children }) {
  return <div className="settings-panel">{children}</div>;
}

// Sub-section heading inside a settings page
function SettingsGroupHeading({ label }) {
  return <div className="settings-group-h">{label}</div>;
}

function SettingRow({ label, helper, children, align }) {
  return (
    <div className={"settings-row" + (align === "top" ? " row-top" : "")}>
      <div>
        <div className="settings-label">{label}</div>
        {helper && <div className="settings-helper">{helper}</div>}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>);

}

// Segmented control — uniform segmented buttons (replaces row of btn-primary/secondary)
function SegControl({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map((o) =>
      <button key={o.value}
      className={value === o.value ? "on" : ""}
      onClick={() => onChange && onChange(o.value)}>
          {o.label}
        </button>
      )}
    </div>);
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange && onChange(!on)} style={{
      width: 36, height: 20, borderRadius: 10,
      background: on ? "var(--accent-primary)" : "var(--border-strong)",
      border: "none", position: "relative", cursor: "default",
      transition: "background 120ms var(--ease-default)",
      flexShrink: 0, padding: 0
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? "var(--bg-deep)" : "var(--text-primary)",
        transition: "left 160ms var(--ease-default)"
      }} />
    </button>);

}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ paddingBottom: 4 }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
        {title}
      </div>
      {sub &&
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.55, maxWidth: 560 }}>
          {sub}
        </div>
      }
    </div>);

}

// ── AI Configuration ────────────────────────────────────────────────────
function SettingsAI({ lang, t }) {
  return (
    <div className="fade-in">
      <SectionHeader
        title={lang === "zh" ? "AI 配置" : "AI Configuration"}
        sub={lang === "zh" ?
        "连接你常用的大模型。API Key 仅保存在本地,绝不会上传。" :
        "Connect a model you already use. API keys stay on this device — never uploaded."} />

      <SettingsPanel>
        <SettingRow
          label={lang === "zh" ? "AI 状态" : "AI Status"}
          helper={lang === "zh" ? "上次连接 12 秒前 · 21ms 延迟" : "Last check 12s ago · 21ms latency"}>
          <span className="chip chip-ai" style={{ height: 24 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "var(--accent-primary)",
              boxShadow: "0 0 6px var(--accent-primary)",
              animation: "lumoBreath 3s ease-in-out infinite"
            }} />
            {lang === "zh" ? "已连接" : "Connected"}
          </span>
        </SettingRow>

        <SettingRow label={lang === "zh" ? "提供商" : "Provider"}>
          <select className="input" style={{ width: 260, height: 36 }} defaultValue="Claude">
            <option>OpenAI</option><option>Claude</option><option>Gemini</option>
            <option>DeepSeek</option><option>Ollama</option><option>Custom…</option>
          </select>
        </SettingRow>

        <SettingRow label="API Key"
        helper={lang === "zh" ? "保存后将以掩码形式显示。" : "Hidden after save — toggle to reveal momentarily."}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="input" style={{ width: 320 }} type="password" defaultValue="sk-ant-····················9f3a" />
            <button className="btn btn-secondary">{lang === "zh" ? "显示" : "Show"}</button>
            <button className="btn btn-secondary">{lang === "zh" ? "测试" : "Test"}</button>
          </div>
        </SettingRow>

        <SettingRow label={lang === "zh" ? "Base URL" : "Base URL"}
        helper={lang === "zh" ? "用于自定义或自托管的提供商" : "Custom / self-hosted endpoint"}>
          <input className="input" style={{ width: 360 }} placeholder="https://api.anthropic.com/v1" />
        </SettingRow>

        <SettingRow label={lang === "zh" ? "模型" : "Model"}>
          <select className="input" style={{ width: 260, height: 36 }} defaultValue="claude-haiku-4-5">
            <option>claude-haiku-4-5</option>
            <option>claude-sonnet-4</option>
            <option>claude-opus-4</option>
          </select>
        </SettingRow>

        <SettingRow label={lang === "zh" ? "本月用量" : "Usage this month"} helper="Pro · 8,420 / 60,000 tokens">
          <div style={{ width: 360 }}>
            <div style={{ height: 4, background: "var(--bg-deep)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                width: "14%", height: "100%",
                background: "linear-gradient(90deg, var(--accent-dim), var(--accent-primary))",
                boxShadow: "0 0 6px var(--accent-primary)"
              }} />
            </div>
          </div>
        </SettingRow>
      </SettingsPanel>
    </div>);

}

// ── Appearance — wired to real tweaks so changes take effect globally ──
function SettingsAppearance({ lang, t, tweaks, setTweak }) {
  const [theme, setTheme] = React.useState("dark"); // visual selection only — prototype is dark
  const accents = [
  { key: "green", label: "Lumo Green", color: "#3DFFA0" },
  { key: "cyan", label: "Calm Cyan", color: "#38D4D4" },
  { key: "amber", label: "Warm Amber", color: "#FFAA44" },
  { key: "graphite", label: "Graphite", color: "#A0ADB0" }];

  const accent = tweaks ? tweaks.accent : "green";

  return (
    <div className="fade-in">
      <SectionHeader
        title={lang === "zh" ? "外观" : "Appearance"}
        sub={lang === "zh" ? "整理界面的节奏与质感。改动会立刻应用到整体界面。" : "Tune the rhythm and texture of the interface — changes apply globally as you make them."} />

      <SettingsGroupHeading label={lang === "zh" ? "色调" : "Color"} />
      <SettingsPanel>
        <SettingRow label={lang === "zh" ? "主题" : "Theme"}
        helper={lang === "zh" ? "本期仅支持暗色 · 浅色与跟随系统即将推出" : "Dark only this release · Light & System coming soon"}>
          <SegControl
            value={theme}
            onChange={setTheme}
            options={[
            { value: "dark", label: lang === "zh" ? "暗色" : "Dark" },
            { value: "light", label: lang === "zh" ? "浅色" : "Light" },
            { value: "system", label: lang === "zh" ? "系统" : "System" }]
            } />
        </SettingRow>

        <SettingRow label={lang === "zh" ? "强调色" : "Accent color"}
        helper={lang === "zh" ? "立刻应用 — 影响高亮、按钮、状态指示器、Lumo 呼吸光等。" : "Applies instantly — highlights, buttons, status indicators, Lumo's breathing glow."}
        align="top">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 460 }}>
            {accents.map((a) => {
              const active = a.key === accent;
              return (
                <button key={a.key}
                onClick={() => setTweak && setTweak("accent", a.key)}
                style={{
                  padding: 12, textAlign: "left",
                  background: active ? "var(--bg-elevated)" : "var(--bg-deep)",
                  border: "1px solid " + (active ? "var(--accent-edge)" : "var(--border-default)"),
                  borderRadius: 8, cursor: "default",
                  fontFamily: "inherit",
                  boxShadow: active ? "0 0 0 3px var(--accent-fog)" : "none",
                  transition: "all 140ms var(--ease-default)"
                }}>
                  <div style={{
                    width: "100%", height: 28, borderRadius: 4,
                    background: `linear-gradient(135deg, ${a.color} 0%, ${a.color}44 100%)`,
                    boxShadow: active ? `0 0 12px ${a.color}66` : "none",
                    marginBottom: 8,
                    position: "relative"
                  }}>
                    {active && <span style={{
                      position: "absolute", top: 6, right: 6,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff"
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l5 5 11-11" />
                      </svg>
                    </span>}
                  </div>
                  <div style={{
                    fontSize: 11, color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: active ? 500 : 400
                  }}>{a.label}</div>
                </button>);
            })}
          </div>
        </SettingRow>
      </SettingsPanel>

      <SettingsGroupHeading label={lang === "zh" ? "节奏" : "Rhythm"} />
      <SettingsPanel>
        <SettingRow label={lang === "zh" ? "动效" : "Motion"}
        helper={lang === "zh" ? "降低后关闭呼吸光与卡片飘入。" : "Reduced turns off breathing glows and card-float entries."}>
          <SegControl
            value={tweaks && tweaks.reducedMotion ? "reduced" : "standard"}
            onChange={(v) => setTweak && setTweak("reducedMotion", v === "reduced")}
            options={[
            { value: "standard", label: lang === "zh" ? "标准" : "Standard" },
            { value: "reduced", label: lang === "zh" ? "降低" : "Reduced" }]
            } />
        </SettingRow>

        <SettingRow label={lang === "zh" ? "卡片密度" : "Card density"}
        helper={lang === "zh" ? "影响列表行高与导航高度。" : "Affects row height and navigation density."}>
          <SegControl
            value={tweaks ? tweaks.density : "comfortable"}
            onChange={(v) => setTweak && setTweak("density", v)}
            options={[
            { value: "comfortable", label: lang === "zh" ? "宽松" : "Comfortable" },
            { value: "compact", label: lang === "zh" ? "紧凑" : "Compact" }]
            } />
        </SettingRow>
      </SettingsPanel>
    </div>);

}

// ── Sync ────────────────────────────────────────────────────────────────
function SettingsSync({ lang, t }) {
  const [sync, setSync] = React.useState(true);
  const [taskSync, setTaskSync] = React.useState(true);
  const [memSync, setMemSync] = React.useState(true);
  const [convSync, setConvSync] = React.useState(false);
  return (
    <div className="fade-in">
      <SectionHeader
        title={lang === "zh" ? "同步" : "Sync"}
        sub={lang === "zh" ?
        "默认情况下,你的数据保存在这台设备上。开启同步后,数据才会到达云端。" :
        "Your data is saved on this device by default. Data only reaches the cloud after you enable sync."} />

      <SettingsPanel>
        <SettingRow label={lang === "zh" ? "云同步" : "Cloud sync"}
        helper={lang === "zh" ? "总开关。关闭后所有子项停止同步。" : "Master toggle — turning off pauses all sub-syncs."}>
          <Toggle on={sync} onChange={setSync} />
        </SettingRow>
        <div style={{
          opacity: sync ? 1 : 0.4,
          pointerEvents: sync ? "auto" : "none",
          transition: "opacity 200ms var(--ease-default)"
        }}>
          <SettingRow label={lang === "zh" ? "任务同步" : "Tasks"}>
            <Toggle on={taskSync} onChange={setTaskSync} />
          </SettingRow>
          <SettingRow label={lang === "zh" ? "记忆同步" : "Memory"}
          helper={lang === "zh" ? "Pro · AI 自动提取的偏好与事实" : "Pro · AI-extracted preferences & facts"}>
            <Toggle on={memSync} onChange={setMemSync} />
          </SettingRow>
          <SettingRow label={lang === "zh" ? "对话同步" : "Conversations"}
          helper={lang === "zh" ? "Pro · 跨设备保留 AI 对话上下文" : "Pro · keep AI chat context across devices"}>
            <Toggle on={convSync} onChange={setConvSync} />
          </SettingRow>
        </div>
      </SettingsPanel>

      <SettingsGroupHeading label={lang === "zh" ? "状态" : "Status"} />
      <SettingsPanel>
        <SettingRow label={lang === "zh" ? "同步状态" : "Status"}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "8px 12px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: 8
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--status-success)",
              boxShadow: "0 0 8px var(--status-success)"
            }} />
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
              {lang === "zh" ? "刚刚已同步" : "Synced just now"}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              · 14:32 · 24 {lang === "zh" ? "项已更新" : "items"}
            </span>
            <span style={{ marginLeft: 12 }}>
              <button className="btn btn-ghost" style={{ height: 28, padding: "0 10px" }}>
                {lang === "zh" ? "手动同步" : "Sync now"}
              </button>
            </span>
          </div>
        </SettingRow>
      </SettingsPanel>
    </div>);

}

// ── Privacy & Data ──────────────────────────────────────────────────────
function SettingsPrivacy({ lang, t }) {
  return (
    <div className="fade-in">
      <SectionHeader
        title={lang === "zh" ? "隐私与本地数据" : "Privacy & Local Data"}
        sub={lang === "zh" ?
        "Lumo 默认把一切保留在本地。下面是你的数据具体在哪里、能做什么。" :
        "Lumo keeps everything local by default. Here's where your data lives and what you can do with it."} />

      <SettingsPanel>
        <SettingRow label={lang === "zh" ? "本地数据库" : "Local database"}
        helper={lang === "zh" ? "SQLite · 占用 8.4 MB" : "SQLite · 8.4 MB"}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 12px",
            background: "var(--bg-deep)",
            border: "1px solid var(--border-default)",
            borderRadius: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 12, color: "var(--text-secondary)",
            maxWidth: 540
          }}>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              ~/Library/Application Support/Lumo/lumo.sqlite
            </span>
            <button className="btn btn-ghost" style={{ height: 26, padding: "0 8px", fontSize: 11 }}>
              {lang === "zh" ? "复制" : "Copy"}
            </button>
          </div>
        </SettingRow>

        <SettingRow label={lang === "zh" ? "导出本地数据" : "Export local data"}
        helper={lang === "zh" ? "JSON 或可读 Markdown 格式" : "JSON or readable Markdown"}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary">JSON</button>
            <button className="btn btn-secondary">Markdown</button>
          </div>
        </SettingRow>

        <SettingRow label={lang === "zh" ? "本地备份" : "Local backup"}
        helper={lang === "zh" ? "上次备份 · 今日 02:00" : "Last backup · today 02:00"}>
          <button className="btn btn-secondary">{lang === "zh" ? "立即备份" : "Back up now"}</button>
        </SettingRow>

        <SettingRow label="AI Key"
        helper={lang === "zh" ?
        "API Key 仅以本机加密后保存。云同步不会传输此项。" :
        "API keys are encrypted on this device only. Cloud sync never carries them."}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 14, display: "inline-flex" }}>{ICON.lock}</span>
            {lang === "zh" ? "本机加密保存" : "Encrypted on this device"}
          </span>
        </SettingRow>
      </SettingsPanel>
    </div>);

}

// ── Account ─────────────────────────────────────────────────────────────
function SettingsAccount({ lang, t }) {
  return (
    <div className="fade-in">
      <SectionHeader
        title={lang === "zh" ? "账户" : "Account"}
        sub={lang === "zh" ? "身份、数据、安全。" : "Identity, data, security."} />

      <SettingsPanel>
        <SettingRow label={lang === "zh" ? "身份" : "Identity"} align="top">
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-dim), var(--accent-primary))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 600, color: "var(--text-inverse)",
              boxShadow: "0 0 0 1px var(--border-default)",
              flexShrink: 0
            }}>AS</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 500, color: "var(--text-primary)",
                lineHeight: 1.3
              }}>Alex Stein</div>
              <div style={{
                fontSize: 12, color: "var(--text-muted)", marginTop: 4,
                lineHeight: 1.35
              }}>alex@studio.io</div>
            </div>
            <button className="btn btn-ghost">{lang === "zh" ? "编辑" : "Edit"}</button>
          </div>
        </SettingRow>

        <SettingRow label={lang === "zh" ? "本地数据" : "Local data"}
        helper={lang === "zh" ? "上次保存 14:32" : "Last saved 14:32"}
        align="top">
          <div className="stat-group" style={{ maxWidth: 480 }}>
            <div className="stat">
              <div className="stat-label">{lang === "zh" ? "任务" : "Tasks"}</div>
              <div className="stat-value">24</div>
            </div>
            <div className="stat">
              <div className="stat-label">{lang === "zh" ? "记忆" : "Memories"}</div>
              <div className="stat-value">17</div>
            </div>
            <div className="stat">
              <div className="stat-label">{lang === "zh" ? "番茄" : "Pomodoros"}</div>
              <div className="stat-value">312</div>
            </div>
          </div>
        </SettingRow>

        <SettingRow label={lang === "zh" ? "安全" : "Security"}>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary">{lang === "zh" ? "修改密码" : "Change password"}</button>
            <button className="btn btn-ghost">{lang === "zh" ? "退出登录" : "Sign out"}</button>
          </div>
        </SettingRow>
      </SettingsPanel>
    </div>);

}

// ── Settings shell ──────────────────────────────────────────────────────
function SettingsScreen({ lang, t, section = "ai", onSectionChange, tweaks, setTweak }) {
  const sections = [
  { key: "account", label: lang === "zh" ? "账户" : "Account", icon: "●" },
  { key: "ai", label: "AI" },
  { key: "appearance", label: lang === "zh" ? "外观" : "Appearance" },
  { key: "sync", label: lang === "zh" ? "同步" : "Sync" },
  { key: "privacy", label: lang === "zh" ? "隐私与数据" : "Privacy" }];

  return (
    <div className="fade-in" style={{ display: "flex", height: "100%" }}>
      {/* Subnav */}
      <div style={{
        width: 220, flexShrink: 0, padding: "24px 12px",
        borderRight: "1px solid var(--border-faint)",
        background: "var(--bg-deep)"
      }}>
        {sections.map((s) =>
        <div key={s.key}
        className={"nav-item " + (section === s.key ? "active" : "")}
        style={{ margin: "2px 0" }}
        onClick={() => onSectionChange && onSectionChange(s.key)}>
            <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: section === s.key ? "var(--accent-primary)" : "var(--border-strong)",
            flexShrink: 0
          }} />
            <span>{s.label}</span>
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: "28px 40px", overflowY: "auto", minWidth: 0 }} key={section}>
        {section === "ai" && <SettingsAI lang={lang} t={t} />}
        {section === "appearance" && <SettingsAppearance lang={lang} t={t} tweaks={tweaks} setTweak={setTweak} />}
        {section === "sync" && <SettingsSync lang={lang} t={t} />}
        {section === "privacy" && <SettingsPrivacy lang={lang} t={t} />}
        {section === "account" && <SettingsAccount lang={lang} t={t} />}
      </div>
    </div>);

}

Object.assign(window, { SettingsScreen });