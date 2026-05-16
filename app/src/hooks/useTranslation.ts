import { useMemo } from 'react'
import en from '../i18n/en'
import zh from '../i18n/zh'
import type { Lang } from '../api/types'

const translations = { en, zh }

export function useTranslation(lang: Lang) {
  return useMemo(() => {
    const dict = translations[lang] || translations.en
    return (key: string, vars?: Record<string, string | number>): string => {
      let str = dict[key] || en[key] || key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, String(v))
        })
      }
      return str
    }
  }, [lang])
}
