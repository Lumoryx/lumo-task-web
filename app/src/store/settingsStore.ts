import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, AccentKey, Lang, DensityKey } from '../api/types'

const ACCENT_THEMES: Record<AccentKey, Record<string, string>> = {
  green: {
    primary: '#3DFFA0', dim: '#1A7A4A',
    glow: 'rgba(61, 255, 160, 0.25)', fog: 'rgba(61, 255, 160, 0.10)', edge: 'rgba(61, 255, 160, 0.50)',
  },
  cyan: {
    primary: '#38D4D4', dim: '#1F6E73',
    glow: 'rgba(56, 212, 212, 0.25)', fog: 'rgba(56, 212, 212, 0.10)', edge: 'rgba(56, 212, 212, 0.50)',
  },
  amber: {
    primary: '#FFAA44', dim: '#9F6420',
    glow: 'rgba(255, 170, 68, 0.22)', fog: 'rgba(255, 170, 68, 0.10)', edge: 'rgba(255, 170, 68, 0.50)',
  },
  graphite: {
    primary: '#A0ADB0', dim: '#52605E',
    glow: 'rgba(160, 173, 176, 0.20)', fog: 'rgba(160, 173, 176, 0.10)', edge: 'rgba(160, 173, 176, 0.40)',
  },
}

export function applyAccent(theme: AccentKey) {
  const t = ACCENT_THEMES[theme] || ACCENT_THEMES.green
  const root = document.documentElement
  root.style.setProperty('--accent-primary', t.primary)
  root.style.setProperty('--accent-dim', t.dim)
  root.style.setProperty('--accent-glow', t.glow)
  root.style.setProperty('--accent-fog', t.fog)
  root.style.setProperty('--accent-edge', t.edge)
}

export { ACCENT_THEMES }

interface SettingsState extends AppSettings {
  setAccent: (accent: AccentKey) => void
  setLang: (lang: Lang) => void
  setDensity: (density: DensityKey) => void
  setReducedMotion: (v: boolean) => void
  update: (patch: Partial<AppSettings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accent: 'green',
      lang: 'en',
      density: 'comfortable',
      reducedMotion: false,
      cloudSync: false,
      syncTasks: true,
      syncMemory: true,
      syncConversations: false,
      aiProvider: 'claude',
      aiModel: 'claude-haiku-4-5',
      aiApiKey: '',
      aiBaseUrl: '',
      pomoDuration: 25,
      quietHoursEnabled: true,
      quietStart: '22:00',
      quietEnd: '09:00',

      setAccent: (accent) => {
        applyAccent(accent)
        set({ accent })
      },
      setLang: (lang) => set({ lang }),
      setDensity: (density) => set({ density }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      update: (patch) => {
        if (patch.accent) applyAccent(patch.accent)
        set(patch)
      },
    }),
    { name: 'lumo:settings' }
  )
)
