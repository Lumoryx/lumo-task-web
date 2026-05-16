import React, { useState, useEffect } from 'react'
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { useAccent } from './hooks/useAccent'
import { useTimer } from './hooks/useTimer'
import { useAuthStore } from './store/authStore'

// Lazy-load screens
import { TodayScreen } from './screens/Today/TodayScreen'
import { MatrixScreen } from './screens/Matrix/MatrixScreen'
import { FocusScreen } from './screens/Focus/FocusScreen'
import { SettingsScreen } from './screens/Settings/SettingsScreen'
import { LoginScreen } from './screens/Auth/LoginScreen'
import { RegisterScreen } from './screens/Auth/RegisterScreen'
import { OnboardingScreen } from './screens/Auth/OnboardingScreen'
import { LoggedInScreen } from './screens/Auth/LoggedInScreen'
import { QuickCreate } from './screens/QuickCreate/QuickCreate'

function Root() {
  useAccent()
  useTimer()
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [qcQuadrant, setQcQuadrant] = useState<string | undefined>()

  const openQC = (q?: string) => { setQcQuadrant(q); setQuickCreateOpen(true) }
  const closeQC = () => setQuickCreateOpen(false)

  // Global keyboard shortcut: Escape closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQC()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <AppShell onQuickAdd={() => openQC()} />
      {quickCreateOpen && (
        <QuickCreate
          initialQuadrant={qcQuadrant}
          onClose={closeQC}
        />
      )}
    </>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/today" replace />,
  },
  // Auth routes (no shell)
  { path: '/auth/login', element: <LoginScreen /> },
  { path: '/auth/register', element: <RegisterScreen /> },
  { path: '/auth/onboarding', element: <OnboardingScreen /> },
  { path: '/auth/loggedin', element: <LoggedInScreen /> },
  // App routes (with shell)
  {
    path: '/',
    element: (
      <AuthGuard>
        <Root />
      </AuthGuard>
    ),
    children: [
      { path: 'today', element: <TodayScreen /> },
      { path: 'matrix', element: <MatrixScreen /> },
      { path: 'focus', element: <FocusScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'settings/:section', element: <SettingsScreen /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
