import { mock, USE_MOCK, apiCall } from './client'
import type { AuthResponse, UserProfile } from './types'

export const authApi = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    USE_MOCK ? mock.auth.login(email, password) : apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email: string, password: string, name: string): Promise<AuthResponse> =>
    USE_MOCK ? mock.auth.register(email, password, name) : apiCall('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  profile: (): Promise<UserProfile> =>
    USE_MOCK ? mock.auth.profile() : apiCall('/api/user/profile'),

  logout: (): Promise<void> =>
    USE_MOCK ? mock.auth.logout() : apiCall('/api/auth/logout', { method: 'POST' }),
}
