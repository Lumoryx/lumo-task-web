import { useState } from "react";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { QuickCreate } from "@/components/QuickCreate";
import { useT } from "@/i18n/useT";
import { useAppStore } from "@/store/useAppStore";

/**
 * Full-viewport app frame — web / Windows desktop pattern (per Jalen's
 * feedback). The `<aside>` (sidebar) and `<main>` are siblings inside a
 * `position: fixed` stage. No window chrome, no max-width, no card —
 * the app tiles the entire viewport.
 */
export function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const t = useT();
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const density = useAppStore((s) => s.density);
  const [quickOpen, setQuickOpen] = useState(false);

  // Map route → page title/subtitle for the topbar.
  const titleMap: Record<string, { title: string; sub: string }> = {
    "/today": { title: t("today.title"), sub: t("today.sub") },
    "/matrix": { title: t("matrix.title"), sub: t("matrix.sub") },
    "/focus": { title: t("focus.title"), sub: t("focus.sub") },
    "/settings": { title: t("nav.settings"), sub: "AI · Appearance · Sync" },
    "/account": { title: t("account.title"), sub: t("account.profile") },
  };
  const meta = titleMap[location.pathname] ?? titleMap["/today"];

  // Focus mode hides the topbar to give the timer the full canvas.
  const isFocus = location.pathname === "/focus";

  return (
    <div className={`${reducedMotion ? "reduce-motion" : ""} density-${density}`}>
      <div className="fixed inset-0 flex bg-base">
        <div className="lumo-pulse" />
        <Sidebar />
        <main className="relative flex flex-1 flex-col min-w-0 min-h-0 bg-base">
          {!isFocus && (
            <Topbar
              title={meta.title}
              subtitle={meta.sub}
              onQuickAdd={() => setQuickOpen(true)}
            />
          )}
          <div className="relative flex-1 min-h-0 scroll-y">
            {outlet}
          </div>

          {quickOpen && (
            <QuickCreate
              onClose={() => setQuickOpen(false)}
              onCreated={() => {
                setQuickOpen(false);
                if (location.pathname !== "/matrix") navigate("/matrix");
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
