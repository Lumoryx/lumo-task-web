import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft, IconCheck } from "@/components/icons";
import { useT } from "@/i18n/useT";

/**
 * /account/change-password — form to update the user's password.
 *
 * Validates client-side (empty, mismatch, length), then calls a mock
 * API. On success shows an inline confirmation before redirecting back.
 */
export function ChangePasswordPage() {
  const t = useT();
  const navigate = useNavigate();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!current || !next || !confirm) {
      setError(t("account.changePass.err.empty"));
      return;
    }
    if (next !== confirm) {
      setError(t("account.changePass.err.mismatch"));
      return;
    }
    if (next.length < 8) {
      setError(t("account.changePass.err.short"));
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // mock network
    setLoading(false);

    // Mock: treat any non-empty "current" as correct
    setSuccess(true);
    setTimeout(() => navigate("/account"), 1600);
  }

  return (
    <div className="fade-in px-8 py-8 max-w-[760px] mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate("/account")}
        className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <IconArrowLeft size={14} />
        {t("account.title")}
      </button>

      <h1
        className="text-[22px] font-semibold text-text-primary mb-6"
        style={{ letterSpacing: "-0.01em" }}
      >
        {t("account.changePass")}
      </h1>

      <div
        className="rounded-[10px] border bg-surface overflow-hidden"
        style={{ borderColor: "var(--border-default)", maxWidth: 480 }}
      >
        {success ? (
          <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 44,
                height: 44,
                background: "var(--accent-fog)",
                border: "1px solid var(--accent-edge)",
              }}
            >
              <IconCheck size={18} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="text-[14px] font-medium text-text-primary">
              {t("account.changePass.success")}
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col">
            <Field label={t("account.changePass.current")}>
              <input
                autoFocus
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={current}
                className="input"
                onChange={(e) => { setError(null); setCurrent(e.target.value); }}
              />
            </Field>

            <div style={{ height: 1, background: "var(--border-faint)" }} />

            <Field label={t("account.changePass.new")}>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={next}
                className="input"
                onChange={(e) => { setError(null); setNext(e.target.value); }}
              />
            </Field>

            <div style={{ height: 1, background: "var(--border-faint)" }} />

            <Field label={t("account.changePass.confirm")}>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                className="input"
                onChange={(e) => { setError(null); setConfirm(e.target.value); }}
              />
            </Field>

            {error && (
              <div
                className="mx-5 mb-4 px-3 py-2 rounded-md text-[12px]"
                style={{
                  background: "rgba(255, 107, 107, 0.08)",
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  color: "var(--status-urgent)",
                }}
              >
                {error}
              </div>
            )}

            <div
              className="flex items-center justify-end gap-2 px-5 py-4 border-t"
              style={{ borderColor: "var(--border-faint)" }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("/account")}
                disabled={loading}
              >
                {t("settings.members.cancel")}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "…" : t("account.changePass.save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="grid items-center px-5 py-4"
      style={{ gridTemplateColumns: "180px 1fr", gap: 24 }}
    >
      <label className="text-[13px] font-medium text-text-primary">{label}</label>
      <div>{children}</div>
    </div>
  );
}
