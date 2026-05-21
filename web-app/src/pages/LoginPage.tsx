import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { OAuthButton } from "@/components/OAuthButton";
import { IconArrowRight } from "@/components/icons";
import { useT } from "@/i18n/useT";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * /login — email + password + 3 OAuth providers + "continue without
 * account" escape hatch (Lumo is local-first; sign-in is optional).
 */
export function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const { signIn, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    try {
      await signIn(email, password);
      navigate("/today");
    } catch {
      /* error surfaces via store */
    }
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className="fade-in">
        <div className="text-[22px] font-semibold tracking-tight text-text-primary text-center" style={{ letterSpacing: "-0.01em" }}>
          {t("auth.login.h")}
        </div>
        <div className="mt-1.5 text-xs text-text-secondary leading-relaxed text-center">
          {t("auth.login.sub")}
        </div>

        <div className="mt-[22px] flex flex-col gap-3">
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full justify-center mt-1"
            disabled={loading}
          >
            {loading ? "…" : t("auth.login.btn")}
          </button>
        </div>

        <Divider label={t("auth.or")} />

        <div className="flex flex-col gap-2">
          <OAuthButton provider="google" label={t("auth.google")} comingSoon />
          <OAuthButton provider="apple" label={t("auth.apple")} comingSoon />
          <OAuthButton provider="github" label={t("auth.github")} comingSoon />
        </div>

        <div className="mt-[18px] flex justify-center gap-3.5 text-xs text-text-secondary">
          <button type="button" className="hover:text-text-primary transition-colors">
            {t("auth.forgot")}
          </button>
          <span className="text-text-faint">·</span>
          <button
            type="button"
            className="hover:text-text-primary transition-colors"
            onClick={() => navigate("/register")}
          >
            {t("auth.toregister")}
          </button>
        </div>

        <div className="mt-[18px] pt-4 border-t border-border-faint text-center">
          <button
            type="button"
            className="btn btn-ghost w-full justify-center"
            onClick={() => navigate("/today")}
          >
            {t("auth.localonly")}
            <IconArrowRight size={14} />
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-border-faint" />
      <span className="text-[11px] uppercase tracking-[0.1em] text-text-faint">{label}</span>
      <div className="flex-1 h-px bg-border-faint" />
    </div>
  );
}
