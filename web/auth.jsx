// auth.jsx — Login, Register, First-run Onboarding

// ── AuthHero — product positioning visual for auth shell ─────────────────
function AuthHero({ lang, t }) {
  return (
    <div style={{
      width: 460, flexShrink: 0,
      background: `
        radial-gradient(70% 70% at 30% 30%, rgba(61, 255, 160, 0.07), transparent 65%),
        radial-gradient(60% 60% at 80% 80%, rgba(91, 200, 212, 0.04), transparent 70%),
        linear-gradient(160deg, #0A100D 0%, #060908 100%)
      `,
      borderRight: "1px solid var(--border-faint)",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
      padding: "32px"
    }}>
      {/* Decorative grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)",
        backgroundSize: "28px 28px",
        pointerEvents: "none"
      }} />

      {/* Centered visual stack */}
      <div style={{
        flex: 1, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {/* Outer glow halo */}
        <div style={{
          position: "absolute",
          width: 360, height: 360,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)",
          animation: "lumoBreath 5s ease-in-out infinite",
          pointerEvents: "none"
        }} />

        {/* Focus atmosphere mini ring */}
        <svg viewBox="0 0 260 260" style={{
          width: 260, height: 260, position: "relative", zIndex: 1
        }}>
          <defs>
            <linearGradient id="heroProgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--accent-dim)" />
            </linearGradient>
          </defs>
          <circle cx="130" cy="130" r="110" fill="none"
          stroke="var(--border-default)" strokeWidth="1" opacity="0.6" />
          <circle cx="130" cy="130" r="110" fill="none"
          stroke="url(#heroProgGrad)" strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 110}
          strokeDashoffset={2 * Math.PI * 110 * 0.32}
          transform="rotate(-90 130 130)"
          style={{ filter: "drop-shadow(0 0 6px var(--accent-primary))" }} />
          {/* Inner concentric */}
          <circle cx="130" cy="130" r="78" fill="none"
          stroke="var(--accent-edge)" strokeWidth="0.5" opacity="0.5" />
          <circle cx="130" cy="130" r="50" fill="none"
          stroke="var(--accent-edge)" strokeWidth="0.5" opacity="0.35" />
        </svg>

        {/* Center text — "this moment matters" */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 2
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "var(--accent-primary)",
            marginBottom: 8, opacity: 0.9
          }}>{lang === "zh" ? "现在" : "Now"}</div>
          <div style={{
            fontSize: 44, fontWeight: 200,
            fontFamily: "var(--font-mono)", lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums"
          }}>18:42</div>
          <div style={{
            fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
            color: "var(--text-muted)", marginTop: 10, textTransform: "uppercase"
          }}>2 / 4 · Q1</div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          fontSize: 18, fontWeight: 500,
          color: "var(--text-primary)",
          lineHeight: 1.45, letterSpacing: "-0.01em",
          textWrap: "pretty"
        }}>
          {lang === "zh" ?
          "10 秒内知道现在该做什么——然后,一键开始。" :
          "Know what to do in 10 seconds — then begin with one tap."}
        </div>
        <div style={{
          marginTop: 14, display: "flex", gap: 14,
          fontSize: 11, color: "var(--text-muted)",
          flexWrap: "wrap"
        }}>
          {(lang === "zh" ?
          ["AI 推荐 · 一件最重要的事", "番茄专注 · 一次只做一件", "本地优先 · 数据始终在你这"] :
          ["AI picks one task that matters most", "One pomodoro at a time", "Data stays on your device"]).
          map((line, i) =>
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{
              width: 3, height: 3, borderRadius: "50%",
              background: "var(--accent-primary)"
            }} />
              {line}
            </span>
          )}
        </div>
      </div>
    </div>);

}

function AuthShell({ children, lang, t, onBack }) {
  return (
    <div style={{
      flex: 1, display: "flex",
      background: "var(--bg-base)",
      position: "relative", overflow: "hidden"
    }}>
      {/* Back button — sits above both panels */}
      {onBack &&
      <button onClick={onBack} style={{
        position: "absolute", top: 18, left: 18, zIndex: 5,
        display: "inline-flex", alignItems: "center", gap: 6,
        height: 32, padding: "0 12px 0 8px", borderRadius: 8,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        color: "var(--text-secondary)",
        fontSize: 12, fontFamily: "inherit", cursor: "default",
        transition: "all 120ms var(--ease-default)"
      }}
      onMouseEnter={(e) => {e.currentTarget.style.background = "var(--bg-elevated)";e.currentTarget.style.color = "var(--text-primary)";}}
      onMouseLeave={(e) => {e.currentTarget.style.background = "var(--bg-surface)";e.currentTarget.style.color = "var(--text-secondary)";}}>
          <span style={{ width: 14, height: 14, display: "inline-flex" }}>{ICON.arrowLeft}</span>
          {lang === "zh" ? "返回" : "Back"}
        </button>
      }

      {/* Left: product positioning visual */}
      <AuthHero lang={lang} t={t} />

      {/* Right: form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 40px", minWidth: 0
      }}>
        <div style={{ width: 340, maxWidth: "100%" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            marginBottom: 22
          }}>
            <LumoGlyph size={20} />
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {t("brand.name")} <span style={{ color: "var(--text-faint)", fontWeight: 400, marginLeft: 2 }}>Task</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>);

}

function OAuthBtn({ provider, label }) {
  const icons = {
    google:
    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" /><path fill="#fff" opacity=".7" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.5-4H3.2v2.5A10 10 0 0 0 12 22z" /><path fill="#fff" opacity=".5" d="M6.5 14.1A6 6 0 0 1 6.2 12c0-.7.1-1.4.3-2.1V7.4H3.2A10 10 0 0 0 2 12c0 1.6.4 3.2 1.2 4.6l3.3-2.5z" /><path fill="#fff" opacity=".85" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.8A10 10 0 0 0 12 2 10 10 0 0 0 3.2 7.4l3.3 2.5A5.9 5.9 0 0 1 12 6z" /></svg>,

    apple:
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 12.5c0-2.7 2.2-4 2.3-4-.1-.2-1.3-2-3.3-2-1.4 0-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-2.5 0-5 2-5 5.8 0 3.6 2.7 7.7 4.3 7.7.8 0 1.6-.5 3.1-.5s2.1.6 3 .6c1.6 0 4-3.4 4-5-.2-.1-2.9-.7-2.9-2.6zM14.5 4.6c.8-1 1.4-2.3 1.2-3.6-1.2 0-2.6.8-3.4 1.7-.7.9-1.4 2.3-1.2 3.6 1.3.1 2.6-.7 3.4-1.7z" /></svg>,

    github:
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.4-1.2-1.1-1.5-1.1-1.5-1-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 1 1.6 2.4 1.2 3 .9.1-.7.4-1.2.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A10 10 0 0 0 12 2z" /></svg>

  };
  return (
    <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
      {icons[provider]}
      <span>{label}</span>
    </button>);

}

function LoginScreen({ lang, t, onLocal, onRegister, onBack }) {
  return (
    <AuthShell lang={lang} t={t} onBack={onBack}>
      <div className="fade-in">
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)", textAlign: "center" }}>
          {t("auth.login.h")}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.55, textAlign: "center" }}>
          {t("auth.login.sub")}
        </div>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="field-label">{t("auth.email")}</label>
            <input className="input" type="email" placeholder="you@example.com" defaultValue="alex@studio.io" />
          </div>
          <div>
            <label className="field-label">{t("auth.password")}</label>
            <input className="input" type="password" placeholder="••••••••" defaultValue="••••••••" />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {t("auth.login.btn")}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 12px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-faint)" }} />
          <span style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("auth.or")}</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-faint)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <OAuthBtn provider="google" label={t("auth.google")} />
          <OAuthBtn provider="apple" label={t("auth.apple")} />
          <OAuthBtn provider="github" label={t("auth.github")} />
        </div>

        <div style={{
          marginTop: 18, display: "flex", justifyContent: "center", gap: 14,
          fontSize: 12, color: "var(--text-secondary)"
        }}>
          <a style={{ color: "var(--text-secondary)", textDecoration: "none", cursor: "default" }}>{t("auth.forgot")}</a>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <a style={{ color: "var(--text-secondary)", textDecoration: "none", cursor: "default" }} onClick={onRegister}>{t("auth.toregister")}</a>
        </div>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border-faint)", textAlign: "center" }}>
          <button className="btn btn-ghost" onClick={onLocal} style={{ width: "100%", justifyContent: "center" }}>
            {t("auth.localonly")} {ICON.arrowRight}
          </button>
        </div>
      </div>
    </AuthShell>);

}

function RegisterScreen({ lang, t, onLocal, onLogin, onBack }) {
  return (
    <AuthShell lang={lang} t={t} onBack={onBack}>
      <div className="fade-in">
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)", textAlign: "center" }}>
          {t("auth.register.h")}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.55, textAlign: "center" }}>
          {t("auth.register.sub")}
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className="field-label">{t("auth.email")}</label>
            <input className="input" type="email" placeholder="you@example.com" />
          </div>
          <div>
            <label className="field-label">{t("auth.password")}</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="field-label">{t("auth.confirm")}</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="field-label">{t("auth.nick")} <span style={{ color: "var(--text-faint)" }}>· {t("auth.nick.opt")}</span></label>
            <input className="input" type="text" placeholder={lang === "zh" ? "怎么称呼你?" : "What should we call you?"} />
          </div>
          <label style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            fontSize: 12, color: "var(--text-secondary)",
            lineHeight: 1.5, marginTop: 4, cursor: "default"
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: 3,
              border: "1.5px solid var(--border-strong)",
              flexShrink: 0, marginTop: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--bg-elevated)"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 1, background: "var(--accent-primary)" }} />
            </span>
            <span>{t("auth.terms")}</span>
          </label>
          <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {t("auth.register.btn")}
          </button>
        </div>

        <div style={{
          marginTop: 16, display: "flex", justifyContent: "center", gap: 14,
          fontSize: 12, color: "var(--text-secondary)"
        }}>
          <a style={{ color: "var(--text-secondary)", textDecoration: "none", cursor: "default" }} onClick={onLogin}>{t("auth.tologin")}</a>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <a style={{ color: "var(--text-secondary)", textDecoration: "none", cursor: "default" }} onClick={onLocal}>{t("auth.localonly")}</a>
        </div>
      </div>
    </AuthShell>);

}

// ── Onboarding: 3 steps ─────────────────────────────────────────────────
function OnboardingScreen({ lang, t, onDone }) {
  const [step, setStep] = React.useState(0);
  const [obTasks, setObTasks] = React.useState([
  lang === "zh" ? "完成首页线框" : "Finish homepage wireframes",
  lang === "zh" ? "起草 Q3 OKR" : "Draft Q3 OKRs"]
  );
  const [input, setInput] = React.useState("");
  const [focusMin, setFocusMin] = React.useState(25);
  const [dndOn, setDndOn] = React.useState(true);

  const stepLabels = [t("ob.step1"), t("ob.step2"), t("ob.step3")];

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: `
        radial-gradient(70% 50% at 50% 0%, rgba(61, 255, 160, 0.05), transparent 70%),
        var(--bg-base)
      `,
      position: "relative", overflow: "hidden"
    }}>
      {/* Top */}
      <div style={{ padding: "32px 48px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <LumoGlyph size={24} />
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{t("brand.name")} Task</span>
        <span style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) =>
          <span key={i} style={{
            width: i === step ? 24 : 6, height: 6, borderRadius: 3,
            background: i <= step ? "var(--accent-primary)" : "var(--border-default)",
            transition: "all 240ms var(--ease-default)"
          }} />
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
          {step + 1} / 3 · {stepLabels[step]}
        </span>
      </div>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 48px"
      }}>
        <div style={{ maxWidth: 560, width: "100%" }} className="fade-in" key={step}>
          {step === 0 &&
          <>
              <div style={{
              fontSize: 32, fontWeight: 600, lineHeight: 1.2,
              color: "var(--text-primary)", letterSpacing: "-0.01em",
              textWrap: "pretty"
            }}>{t("ob.h")}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.55 }}>
                {t("ob.sub")}
              </div>
              {/* Tasks added */}
              <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
                {obTasks.map((tk, i) =>
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 8
              }}>
                    <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--accent-fog)",
                  border: "1px solid var(--accent-edge)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent-primary)", fontSize: 11, fontWeight: 600
                }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14 }}>{tk}</span>
                    <span style={{
                  fontSize: 10, color: "var(--accent-primary)",
                  background: "var(--accent-fog)",
                  border: "1px solid var(--accent-edge)",
                  padding: "2px 7px", borderRadius: 4, letterSpacing: "0.02em"
                }}>Q2 · ~30 {t("min")}</span>
                  </div>
              )}
                {/* Input */}
                <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "0 16px", height: 48,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 8
              }}>
                  <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--accent-primary)",
                  boxShadow: "0 0 8px var(--accent-primary)"
                }} />
                  <input
                  placeholder={t("ob.placeholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      setObTasks([...obTasks, input.trim()]);setInput("");
                    }
                  }}
                  style={{
                    flex: 1, background: "transparent", border: "none",
                    color: "var(--text-primary)", fontFamily: "inherit",
                    fontSize: 14, outline: "none"
                  }} />
                
                  <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>↵</span>
                </div>
              </div>
            </>
          }

          {step === 1 &&
          <>
              <div style={{
              fontSize: 28, fontWeight: 600, lineHeight: 1.2,
              color: "var(--text-primary)", letterSpacing: "-0.01em"
            }}>{t("ob.focus.h")}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12 }}>
                {lang === "zh" ? "可以之后在设置里再调。" : "You can change this anytime in Settings."}
              </div>
              <div style={{
              marginTop: 36, display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10
            }}>
                {[15, 25, 50].map((m) =>
              <button key={m} onClick={() => setFocusMin(m)}
              style={{
                padding: "22px 16px", textAlign: "left",
                background: focusMin === m ? "var(--accent-fog)" : "var(--bg-surface)",
                border: `1px solid ${focusMin === m ? "var(--accent-edge)" : "var(--border-default)"}`,
                borderRadius: 10, cursor: "default",
                color: "var(--text-primary)", fontFamily: "inherit"
              }}>
                    <div style={{
                  fontSize: 28, fontWeight: 500, color: focusMin === m ? "var(--accent-primary)" : "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em"
                }}>{m} <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("min")}</span></div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                      {m === 15 && (lang === "zh" ? "短促清晰" : "Sharp & light")}
                      {m === 25 && (lang === "zh" ? "经典番茄 · 推荐" : "Classic pomodoro · suggested")}
                      {m === 50 && (lang === "zh" ? "深度沉浸" : "Deep immersion")}
                    </div>
                  </button>
              )}
              </div>
            </>
          }

          {step === 2 &&
          <>
              <div style={{
              fontSize: 28, fontWeight: 600, lineHeight: 1.2,
              color: "var(--text-primary)", letterSpacing: "-0.01em"
            }}>{t("ob.dnd.h")}</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12 }}>
                {lang === "zh" ? "在这段时间内,Lumo 不会主动出声。" : "Lumo won't reach out during these hours."}
              </div>

              <div style={{
              marginTop: 36, padding: 22,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 10
            }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {lang === "zh" ? "免打扰" : "Do Not Disturb"}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button onClick={() => setDndOn(!dndOn)} style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: dndOn ? "var(--accent-primary)" : "var(--border-strong)",
                  border: "none", position: "relative", cursor: "default",
                  transition: "background 120ms var(--ease-default)"
                }}>
                    <span style={{
                    position: "absolute", top: 2, left: dndOn ? 18 : 2,
                    width: 16, height: 16, borderRadius: "50%",
                    background: dndOn ? "var(--bg-deep)" : "var(--text-primary)",
                    transition: "left 160ms var(--ease-default)"
                  }} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", opacity: dndOn ? 1 : 0.4 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{lang === "zh" ? "从" : "From"}</div>
                    <div style={{
                    fontSize: 22, fontWeight: 500, color: "var(--text-primary)",
                    fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)"
                  }}>22:00</div>
                  </div>
                  <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, var(--accent-primary), var(--accent-dim))", borderRadius: 1, marginTop: 12 }} />
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{lang === "zh" ? "到" : "To"}</div>
                    <div style={{
                    fontSize: 22, fontWeight: 500, color: "var(--text-primary)",
                    fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-mono)"
                  }}>09:00</div>
                  </div>
                </div>
              </div>
            </>
          }
        </div>
      </div>

      <div style={{
        padding: "20px 48px 36px",
        display: "flex", alignItems: "center", gap: 12,
        borderTop: "1px solid var(--border-faint)"
      }}>
        <button className="btn btn-ghost" onClick={onDone}>{t("ob.skip")}</button>
        <span style={{ flex: 1 }} />
        {step > 0 &&
        <button className="btn btn-secondary" onClick={() => setStep((s) => s - 1)}>
            {ICON.arrowLeft}{lang === "zh" ? "上一步" : "Back"}
          </button>
        }
        <button className="btn btn-primary" onClick={() => step < 2 ? setStep(step + 1) : onDone()}>
          {step < 2 ? t("ob.next") : t("ob.enter")} {ICON.arrowRight}
        </button>
      </div>
    </div>);

}

Object.assign(window, { LoginScreen, RegisterScreen, OnboardingScreen, LoggedInScreen });

// ── Logged-in state (visited /login while authenticated) ────────────────
function LoggedInScreen({ lang, t, onContinue, onSignOut, onSettings, onBack }) {
  return (
    <AuthShell lang={lang} t={t} onBack={onBack}>
      <div className="fade-in" style={{ textAlign: "center" }}>
        {/* Avatar with success glow */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          margin: "0 auto 18px",
          background: "linear-gradient(135deg, var(--accent-dim), var(--accent-primary))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 600, color: "var(--text-inverse)",
          boxShadow: "0 0 0 1px var(--border-default), 0 0 24px var(--accent-fog)",
          position: "relative"
        }}>
          AS
          <span style={{
            position: "absolute", bottom: -2, right: -2,
            width: 18, height: 18, borderRadius: "50%",
            background: "var(--status-success)",
            border: "2px solid var(--bg-base)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-base)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5 11-11" />
            </svg>
          </span>
        </div>

        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {lang === "zh" ? "你已登录" : "You're signed in"}
        </div>
        <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-secondary)" }}>
          Alex Stein
          <span style={{ color: "var(--text-faint)", margin: "0 6px" }}>·</span>
          <span style={{ color: "var(--text-muted)" }}>alex@studio.io</span>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          marginTop: 12, padding: "4px 10px",
          background: "var(--accent-fog)",
          border: "1px solid var(--accent-edge)",
          borderRadius: 999, fontSize: 11, fontWeight: 500,
          color: "var(--accent-primary)", letterSpacing: "0.04em"
        }}>
          PRO
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            · {lang === "zh" ? "续费 2026-08-12" : "Renews 2026-08-12"}
          </span>
        </div>

        {/* Quick stats */}
        <div style={{
          marginTop: 22, padding: "14px 18px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: 8,
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12, textAlign: "left"
        }}>
          {[
          { label: lang === "zh" ? "任务" : "Tasks", val: "24" },
          { label: lang === "zh" ? "番茄" : "Pomodoros", val: "312" },
          { label: lang === "zh" ? "同步状态" : "Sync", val: lang === "zh" ? "正常" : "OK", green: true }].
          map((s, i) =>
          <div key={i}>
              <div style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{
              fontSize: 16, fontWeight: 500,
              color: s.green ? "var(--status-success)" : "var(--text-primary)",
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
              display: "flex", alignItems: "center", gap: 6
            }}>
                {s.green &&
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--status-success)",
                boxShadow: "0 0 6px var(--status-success)"
              }} />
              }
                {s.val}
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-primary btn-lg" onClick={onContinue} style={{
          width: "100%", justifyContent: "center", marginTop: 22
        }}>
          {lang === "zh" ? "进入 Today" : "Continue to Today"} {ICON.arrowRight}
        </button>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onSettings} style={{ flex: 1, justifyContent: "center" }}>
            {lang === "zh" ? "账户设置" : "Account settings"}
          </button>
          <button className="btn btn-ghost" onClick={onSignOut} style={{ flex: 1, justifyContent: "center" }}>
            {lang === "zh" ? "退出登录" : "Sign out"}
          </button>
        </div>
      </div>
    </AuthShell>);

}