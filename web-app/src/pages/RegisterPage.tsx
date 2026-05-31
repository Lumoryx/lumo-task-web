import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { useT } from "@/i18n/useT";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * /register — email + password + confirm + optional nickname + ToS.
 *
 * On success: stores user via auth store, routes to /today.
 */
export function RegisterPage() {
  const t = useT();
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [agreed, setAgreed] = useState(true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    clearError();
    try {
      await register({ email, password, confirm, nickname });
      navigate("/today");
    } catch {
      // error is set in the store and displayed below
    }
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className="fade-in">
        <div className="text-[22px] font-semibold tracking-tight text-text-primary text-center" style={{ letterSpacing: "-0.01em" }}>
          {t("auth.register.h")}
        </div>
        <div className="mt-1.5 text-xs text-text-secondary leading-relaxed text-center">
          {t("auth.register.sub")}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Field label={t("auth.email")}>
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label={t("auth.password")}>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label={t("auth.confirm")}>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <Field
            label={
              <>
                {t("auth.nick")}{" "}
                <span className="text-text-faint">· {t("auth.nick.opt")}</span>
              </>
            }
          >
            <input
              className="input"
              type="text"
              placeholder="Alex"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </Field>

          <label className="flex items-start gap-2.5 mt-1 text-[12px] text-text-secondary leading-relaxed">
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className="flex items-center justify-center flex-shrink-0 rounded-[3px] mt-px transition-colors"
              style={{
                width: 14,
                height: 14,
                background: "var(--bg-elevated)",
                border: "1.5px solid var(--border-strong)",
              }}
            >
              {agreed && (
                <span className="rounded-[1px]" style={{ width: 8, height: 8, background: "var(--accent-primary)" }} />
              )}
            </button>
            <span>{t("auth.terms")}</span>
          </label>

          {error && (
            <div className="rounded-md px-3 py-2.5 text-[12px] leading-relaxed" style={{ background: "var(--color-danger-bg, #fef2f2)", color: "var(--color-danger, #dc2626)", border: "1px solid var(--color-danger-border, #fca5a5)" }}>
              <span className="font-medium">注册失败：</span>{error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full justify-center mt-1"
            disabled={loading || !agreed}
          >
            {loading ? "…" : t("auth.register.btn")}
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-3.5 text-xs text-text-secondary">
          <button type="button" className="hover:text-text-primary transition-colors" onClick={() => navigate("/login")}>
            {t("auth.tologin")}
          </button>
          <span className="text-text-faint">·</span>
          <button type="button" className="hover:text-text-primary transition-colors" onClick={() => navigate("/today")}>
            {t("auth.localonly")}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="block text-[12px] font-medium text-text-secondary mb-1.5"
        style={{ letterSpacing: "0.01em" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
