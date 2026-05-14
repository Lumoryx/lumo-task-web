// app.jsx — main Lumo Task app + Tweaks + routing

const ACCENT_THEMES = {
  green: {
    primary: "#3DFFA0", dim: "#1A7A4A",
    glow: "rgba(61, 255, 160, 0.25)", fog: "rgba(61, 255, 160, 0.10)", edge: "rgba(61, 255, 160, 0.50)",
  },
  cyan: {
    primary: "#38D4D4", dim: "#1F6E73",
    glow: "rgba(56, 212, 212, 0.25)", fog: "rgba(56, 212, 212, 0.10)", edge: "rgba(56, 212, 212, 0.50)",
  },
  amber: {
    primary: "#FFAA44", dim: "#9F6420",
    glow: "rgba(255, 170, 68, 0.22)", fog: "rgba(255, 170, 68, 0.10)", edge: "rgba(255, 170, 68, 0.50)",
  },
  graphite: {
    primary: "#A0ADB0", dim: "#52605E",
    glow: "rgba(160, 173, 176, 0.20)", fog: "rgba(160, 173, 176, 0.10)", edge: "rgba(160, 173, 176, 0.40)",
  },
};

function applyAccent(theme) {
  const t = ACCENT_THEMES[theme] || ACCENT_THEMES.green;
  const root = document.documentElement;
  root.style.setProperty("--accent-primary", t.primary);
  root.style.setProperty("--accent-dim", t.dim);
  root.style.setProperty("--accent-glow", t.glow);
  root.style.setProperty("--accent-fog", t.fog);
  root.style.setProperty("--accent-edge", t.edge);
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "green",
  "lang": "en",
  "route": "today",
  "cardVariant": "classic",
  "matrixLayout": "classic",
  "aiVariant": "dot",
  "density": "comfortable",
  "reducedMotion": false,
  "matrixAI": false,
  "todayState": "default",
  "matrixDrag": "off",
  "matrixOverload": false,
  "settingsSection": "ai",
  "quickCreate": false
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [qcQuadrant, setQcQuadrant] = React.useState(null);
  const lang = tweaks.lang;
  const t = window.useT(lang);
  const route = tweaks.route;
  const setRoute = (r) => setTweak("route", r);

  React.useEffect(() => { applyAccent(tweaks.accent); }, [tweaks.accent]);

  const openQuickCreate = (q) => {
    setQcQuadrant(q || null);
    setTweak("quickCreate", true);
  };
  const closeQuickCreate = () => {
    setTweak("quickCreate", false);
    setQcQuadrant(null);
  };

  const isAuthish = route === "login" || route === "register" || route === "onboarding" || route === "loggedin";
  const isFocus = route === "focus";

  const pageMeta = {
    today: { title: t("today.title"), sub: t("today.sub") },
    matrix: { title: t("matrix.title"), sub: t("matrix.sub") },
    focus: { title: t("focus.title"), sub: t("focus.sub") },
    settings: { title: t("nav.settings"), sub: lang === "zh" ? "AI · 外观 · 同步" : "AI · Appearance · Sync" },
  };

  const tasks = window.SAMPLE_TASKS;

  return (
    <div className={
      (tweaks.reducedMotion ? "reduce-motion " : "") +
      "density-" + tweaks.density
    }>
      <Window pulse={tweaks.reducedMotion ? "reduced" : "default"}>
        {isAuthish ? (
          <>
            {route === "login" && (
              <LoginScreen lang={lang} t={t}
                onLocal={() => setRoute("today")}
                onRegister={() => setRoute("register")}
                onBack={() => setRoute("today")} />
            )}
            {route === "register" && (
              <RegisterScreen lang={lang} t={t}
                onLocal={() => setRoute("today")}
                onLogin={() => setRoute("login")}
                onBack={() => setRoute("today")} />
            )}
            {route === "loggedin" && (
              <LoggedInScreen lang={lang} t={t}
                onContinue={() => setRoute("today")}
                onSettings={() => { setRoute("settings"); setTweak("settingsSection", "account"); }}
                onSignOut={() => setRoute("login")}
                onBack={() => setRoute("today")} />
            )}
            {route === "onboarding" && (
              <OnboardingScreen lang={lang} t={t} onDone={() => setRoute("today")} />
            )}
          </>
        ) : (
          <>
            <Sidebar route={route} setRoute={setRoute} t={t} taskCount={tasks.length} />
            <div className="main">
              <Topbar
                title={pageMeta[route]?.title || ""}
                sub={pageMeta[route]?.sub}
                t={t}
                onLogin={() => setRoute("login")}
                onQuickAdd={() => openQuickCreate()}
              />
              <div className="content">
                {route === "today" && (
                  <TodayScreen
                    lang={lang} t={t}
                    cardVariant={tweaks.cardVariant}
                    aiVariant={tweaks.aiVariant}
                    state={tweaks.todayState}
                    tasks={tasks}
                    completed={window.COMPLETED_TODAY}
                    onStart={() => setRoute("focus")}
                    onResume={() => setRoute("focus")}
                    onOpenQuickCreate={() => openQuickCreate()}
                  />
                )}
                {route === "matrix" && (
                  <MatrixScreen
                    lang={lang} t={t}
                    layout={tweaks.matrixLayout}
                    aiVariant={tweaks.aiVariant}
                    aiClassifyOn={tweaks.matrixAI}
                    dragState={tweaks.matrixDrag}
                    overload={tweaks.matrixOverload}
                    tasks={tasks}
                    onAddTask={(q) => openQuickCreate(q)}
                  />
                )}
                {route === "settings" && (
                  <SettingsScreen
                    lang={lang} t={t}
                    section={tweaks.settingsSection}
                    onSectionChange={(s) => setTweak("settingsSection", s)}
                    tweaks={tweaks} setTweak={setTweak} />
                )}
              </div>
              {isFocus && (
                <div style={{
                  position: "absolute", inset: "56px 0 0", display: "flex",
                  background: "var(--bg-base)",
                }}>
                  <FocusScreen
                    lang={lang} t={t}
                    task={tasks.find(x => x.quadrant === "Q1" && x.today) || tasks[0]}
                    aiVariant={tweaks.aiVariant}
                    onExit={() => setRoute("today")}
                    onComplete={() => setRoute("today")}
                  />
                </div>
              )}
              {tweaks.quickCreate && !isFocus && (
                <QuickCreate lang={lang} t={t} aiVariant={tweaks.aiVariant}
                             initialQuadrant={qcQuadrant}
                             onClose={closeQuickCreate} />
              )}
            </div>
          </>
        )}
      </Window>

      <TweaksPanel title={lang === "zh" ? "调节" : "Tweaks"}>
        <TweakSection label={lang === "zh" ? "屏幕" : "Screen"} />
        <TweakSelect
          label={lang === "zh" ? "当前页" : "Current"}
          value={route}
          options={[
            { value: "onboarding", label: lang === "zh" ? "首次引导" : "Onboarding" },
            { value: "login", label: lang === "zh" ? "登录" : "Login" },
            { value: "register", label: lang === "zh" ? "注册" : "Register" },
            { value: "loggedin", label: lang === "zh" ? "已登录" : "Signed in" },
            { value: "today", label: t("today.title") },
            { value: "matrix", label: t("matrix.title") },
            { value: "focus", label: t("focus.title") },
            { value: "settings", label: t("nav.settings") },
          ]}
          onChange={(v) => setTweak("route", v)} />
        <TweakToggle
          label={lang === "zh" ? "快速创建弹窗" : "Quick create modal"}
          value={tweaks.quickCreate}
          onChange={(v) => setTweak("quickCreate", v)} />

        <TweakSection label={lang === "zh" ? "Today 推荐卡构图" : "Today card layout"} />
        <TweakRadio
          label={lang === "zh" ? "样式" : "Style"}
          value={tweaks.cardVariant}
          options={[
            { value: "classic", label: t("card.classic") },
            { value: "conviction", label: t("card.letter") },
            { value: "path", label: t("card.path") },
          ]}
          onChange={(v) => setTweak("cardVariant", v)} />
        <TweakRadio
          label={lang === "zh" ? "状态" : "State"}
          value={tweaks.todayState}
          options={[
            { value: "default", label: lang === "zh" ? "默认" : "Default" },
            { value: "empty", label: lang === "zh" ? "空" : "Empty" },
            { value: "inprogress", label: lang === "zh" ? "在专注" : "In focus" },
          ]}
          onChange={(v) => setTweak("todayState", v)} />

        <TweakSection label={lang === "zh" ? "Matrix 布局" : "Matrix layout"} />
        <TweakRadio
          label={lang === "zh" ? "样式" : "Style"}
          value={tweaks.matrixLayout}
          options={[
            { value: "classic", label: "2×2" },
            { value: "list", label: lang === "zh" ? "列表" : "List" },
            { value: "hybrid", label: lang === "zh" ? "聚焦" : "Focus" },
          ]}
          onChange={(v) => setTweak("matrixLayout", v)} />
        <TweakToggle
          label={lang === "zh" ? "AI 一键分类" : "AI classify"}
          value={tweaks.matrixAI}
          onChange={(v) => setTweak("matrixAI", v)} />
        <TweakRadio
          label={lang === "zh" ? "拖拽" : "Drag"}
          value={tweaks.matrixDrag}
          options={[
            { value: "off", label: lang === "zh" ? "关" : "Off" },
            { value: "to-q2", label: lang === "zh" ? "→Q2" : "→Q2" },
          ]}
          onChange={(v) => setTweak("matrixDrag", v)} />
        <TweakToggle
          label={lang === "zh" ? "Q1 超载" : "Q1 overload"}
          value={tweaks.matrixOverload}
          onChange={(v) => setTweak("matrixOverload", v)} />

        <TweakSection label={lang === "zh" ? "Settings 子页" : "Settings section"} />
        <TweakSelect
          label={lang === "zh" ? "当前" : "Section"}
          value={tweaks.settingsSection}
          options={[
            { value: "account", label: lang === "zh" ? "账户" : "Account" },
            { value: "ai", label: "AI" },
            { value: "appearance", label: lang === "zh" ? "外观" : "Appearance" },
            { value: "sync", label: lang === "zh" ? "同步" : "Sync" },
            { value: "privacy", label: lang === "zh" ? "隐私与数据" : "Privacy" },
          ]}
          onChange={(v) => { setTweak("settingsSection", v); if (route !== "settings") setTweak("route", "settings"); }} />

        <TweakSection label={lang === "zh" ? "AI 视觉" : "AI presence"} />
        <TweakRadio
          label={lang === "zh" ? "形态" : "Form"}
          value={tweaks.aiVariant}
          options={[
            { value: "dot", label: lang === "zh" ? "呼吸" : "Dot" },
            { value: "orb", label: "Orb" },
            { value: "text", label: lang === "zh" ? "字" : "Text" },
          ]}
          onChange={(v) => setTweak("aiVariant", v)} />

        <TweakSection label={lang === "zh" ? "外观" : "Appearance"} />
        <TweakColor
          label={lang === "zh" ? "强调色" : "Accent"}
          value={tweaks.accent}
          options={[
            { value: "green", label: "Lumo Green" },
            { value: "cyan", label: "Calm Cyan" },
            { value: "amber", label: "Warm Amber" },
            { value: "graphite", label: "Graphite" },
          ].map(o => o.value)
          .map(v => ACCENT_THEMES[v].primary)
          .map((color, i) => color)}
          onChange={(hex) => {
            const key = Object.keys(ACCENT_THEMES).find(k => ACCENT_THEMES[k].primary === hex);
            if (key) setTweak("accent", key);
          }} />
        <TweakRadio
          label={lang === "zh" ? "密度" : "Density"}
          value={tweaks.density}
          options={[
            { value: "comfortable", label: lang === "zh" ? "宽松" : "Comfy" },
            { value: "compact", label: lang === "zh" ? "紧凑" : "Compact" },
          ]}
          onChange={(v) => setTweak("density", v)} />
        <TweakToggle
          label={lang === "zh" ? "降低动效" : "Reduced motion"}
          value={tweaks.reducedMotion}
          onChange={(v) => setTweak("reducedMotion", v)} />

        <TweakSection label={lang === "zh" ? "语言" : "Language"} />
        <TweakRadio
          label={lang === "zh" ? "界面" : "UI"}
          value={tweaks.lang}
          options={[
            { value: "en", label: "English" },
            { value: "zh", label: "中文" },
          ]}
          onChange={(v) => setTweak("lang", v)} />
      </TweaksPanel>
    </div>
  );
}

// ── (legacy) Settings teaser — kept for fallback ────────────────────────
function SettingsTeaser({ lang, t }) {
  const sections = [
    { key: "ai", label: lang === "zh" ? "AI 配置" : "AI", count: 6 },
    { key: "appearance", label: lang === "zh" ? "外观" : "Appearance", count: 4 },
    { key: "sync", label: lang === "zh" ? "同步" : "Sync", count: 5 },
    { key: "privacy", label: lang === "zh" ? "隐私与数据" : "Privacy", count: 7 },
    { key: "account", label: lang === "zh" ? "账户" : "Account", count: 6 },
  ];
  return (
    <div className="fade-in" style={{ display: "flex", height: "100%" }}>
      <div style={{
        width: 240, flexShrink: 0, padding: "20px 12px",
        borderRight: "1px solid var(--border-faint)",
      }}>
        {sections.map((s, i) => (
          <div key={s.key} className={"nav-item " + (i === 0 ? "active" : "")} style={{ margin: "2px 4px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "var(--accent-primary)" : "var(--border-strong)" }} />
            <span>{s.label}</span>
            <span className="badge">{s.count}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
          {lang === "zh" ? "AI 配置" : "AI Configuration"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5, maxWidth: 540 }}>
          {lang === "zh"
            ? "连接你常用的大模型。API Key 只保存在本地,绝不会上传。"
            : "Connect the model you already use. API keys are stored on this device — never uploaded."}
        </div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18, maxWidth: 580 }}>
          <SettingRow label={lang === "zh" ? "AI 状态" : "AI Status"} helper={lang === "zh" ? "当前已连接到 Anthropic Claude" : "Currently connected to Anthropic Claude"}>
            <span className="chip chip-ai">{lang === "zh" ? "已连接" : "Connected"}</span>
          </SettingRow>
          <SettingRow label={lang === "zh" ? "提供商" : "Provider"}>
            <select className="input" style={{ width: 220, height: 36 }} defaultValue="Claude">
              <option>OpenAI</option><option>Claude</option><option>Gemini</option>
              <option>DeepSeek</option><option>Ollama</option><option>Custom…</option>
            </select>
          </SettingRow>
          <SettingRow label="API Key" helper={lang === "zh" ? "仅保存在本地,提交后不会再展示完整 Key" : "Stored locally — never displayed in full after save"}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" style={{ width: 280 }} defaultValue="sk-ant-····················9f3a" />
              <button className="btn btn-secondary">{lang === "zh" ? "测试连接" : "Test"}</button>
            </div>
          </SettingRow>
          <SettingRow label={lang === "zh" ? "模型" : "Model"}>
            <select className="input" style={{ width: 220, height: 36 }} defaultValue="claude-haiku-4-5">
              <option>claude-haiku-4-5</option>
              <option>claude-sonnet-4</option>
              <option>claude-opus-4</option>
            </select>
          </SettingRow>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, helper, children }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "180px 1fr",
      gap: 24, alignItems: "flex-start",
      paddingBottom: 18, borderBottom: "1px solid var(--border-faint)",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        {helper && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>{helper}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
