import { mock, USE_MOCK, apiCall } from './client'
import type { AppSettings } from './types'

export const settingsApi = {
  get: (): Promise<AppSettings> =>
    USE_MOCK ? mock.settings.get() : apiCall('/api/settings'),

  update: (patch: Partial<AppSettings>): Promise<AppSettings> =>
    USE_MOCK ? mock.settings.update(patch) : apiCall('/api/settings', { method: 'PUT', body: JSON.stringify(patch) }),
}
