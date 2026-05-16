import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'
import type { UserProfile } from '../api/types'

interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  continueLocal: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { user } = await authApi.login(email, password)
        set({ user, isAuthenticated: true })
      },

      register: async (email, password, name) => {
        const { user } = await authApi.register(email, password, name)
        set({ user, isAuthenticated: true })
      },

      logout: async () => {
        await authApi.logout()
        set({ user: null, isAuthenticated: false })
      },

      continueLocal: () => {
        set({
          user: { id: 'local', name: 'Local', email: '', plan: 'free' },
          isAuthenticated: true,
        })
      },
    }),
    { name: 'lumo:auth' }
  )
)
