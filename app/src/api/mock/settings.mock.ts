import { db, persistSettings } from './db'
import { mockDelay } from './delay'
import type { AppSettings } from '../types'

export const settingsMock = {
  async get(): Promise<AppSettings> {
    await mockDelay(50, 100)
    return { ...db.settings }
  },

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    await mockDelay(60, 120)
    db.settings = { ...db.settings, ...patch }
    persistSettings()
    return { ...db.settings }
  },
}
