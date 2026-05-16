import { db, persistUser } from './db'
import { mockDelay } from './delay'
import type { AuthResponse, UserProfile } from '../types'

export const authMock = {
  async login(email: string, _password: string): Promise<AuthResponse> {
    await mockDelay(400, 700)
    const user: UserProfile = {
      id: 'u1',
      name: email.split('@')[0],
      email,
      plan: 'pro',
      renewsAt: '2026-12-01',
    }
    db.user = user
    db.isAuthenticated = true
    persistUser()
    return { user, token: 'mock-jwt-token' }
  },

  async register(email: string, _password: string, name: string): Promise<AuthResponse> {
    await mockDelay(500, 800)
    const user: UserProfile = {
      id: 'u2', name, email, plan: 'free',
    }
    db.user = user
    db.isAuthenticated = true
    persistUser()
    return { user, token: 'mock-jwt-token' }
  },

  async profile(): Promise<UserProfile> {
    await mockDelay(100, 200)
    if (!db.user) throw new Error('Not authenticated')
    return db.user
  },

  async logout(): Promise<void> {
    await mockDelay(100)
    db.user = null
    db.isAuthenticated = false
    persistUser()
  },
}
