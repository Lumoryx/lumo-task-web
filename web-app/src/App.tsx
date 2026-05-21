import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { TodayPage } from "@/pages/TodayPage";
import { MatrixPage } from "@/pages/MatrixPage";
import { FocusPage } from "@/pages/FocusPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AccountPage } from "@/pages/AccountPage";
import { ChangePasswordPage } from "@/pages/ChangePasswordPage";
import { CountdownPage } from "@/pages/CountdownPage";
import { applyAccentTheme, useAppStore } from "@/store/useAppStore";
import { useTasksStore } from "@/store/useTasksStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useCountdownStore } from "@/store/useCountdownStore";
import { selectIsSignedIn, useAuthStore } from "@/store/useAuthStore";
import { ToastStack } from "@/components/ToastStack";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * App root.
 *
 * - Loads the persisted accent on mount.
 * - Bootstraps the task store from the mock API.
 * - First-run users see /onboarding; everyone else gets the Shell.
 */
export default function App() {
  const accent = useAppStore((s) => s.accent);
  const onboarded = useAppStore((s) => s.onboarded);
  const loadTasks = useTasksStore((s) => s.load);
  const clearTasks = useTasksStore((s) => s.clear);
  const loadPeople = usePeopleStore((s) => s.load);
  const clearPeople = usePeopleStore((s) => s.clear);
  const loadCountdowns = useCountdownStore((s) => s.load);
  const clearCountdowns = useCountdownStore((s) => s.clear);
  const isSignedIn = useAuthStore(selectIsSignedIn);
  const userId = useAuthStore((s) => s.user.id);
  const location = useLocation();

  useEffect(() => {
    applyAccentTheme(accent);
  }, [accent]);

  useEffect(() => {
    if (isSignedIn) {
      loadTasks();
      loadPeople();
      loadCountdowns(userId);
    } else {
      clearTasks();
      clearPeople();
      clearCountdowns();
    }
  }, [isSignedIn, userId, loadTasks, loadPeople, loadCountdowns, clearTasks, clearPeople, clearCountdowns]);

  // First-run gate — redirect to onboarding unless already there.
  if (!onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <ErrorBoundary>
    <ToastStack />
    <Routes>
      {/* Stand-alone full-screen pages (own layout, no Shell) */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Shell-wrapped pages */}
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/matrix" element={<MatrixPage />} />
        <Route path="/focus" element={<FocusPage />} />
        <Route path="/countdown" element={<CountdownPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
    </ErrorBoundary>
  );
}
