import { useEffect } from 'react'
import { useSettingsStore, applyAccent } from '../store/settingsStore'

export function useAccent() {
  const accent = useSettingsStore(s => s.accent)
  useEffect(() => { applyAccent(accent) }, [accent])
}
