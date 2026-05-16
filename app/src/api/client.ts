import { tasksMock } from './mock/tasks.mock'
import { aiMock } from './mock/ai.mock'
import { focusMock } from './mock/focus.mock'
import { authMock } from './mock/auth.mock'
import { settingsMock } from './mock/settings.mock'
import { ApiError } from './types'

const USE_MOCK = import.meta.env.VITE_API_MODE !== 'real'
const API_BASE = import.meta.env.VITE_API_BASE || ''

// Route table for mock dispatch
export const mock = {
  tasks: tasksMock,
  ai: aiMock,
  focus: focusMock,
  auth: authMock,
  settings: settingsMock,
}

// Generic fetch wrapper for real API mode
export async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    throw new Error(`apiCall used in mock mode — use typed API modules directly: ${path}`)
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(res.status, text)
  }
  return res.json() as Promise<T>
}

export { USE_MOCK }
